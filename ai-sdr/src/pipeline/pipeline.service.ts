import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScraperService } from './scraper.service';
import { QualifyService } from './qualify.service';
import { EnrichService } from './enrich.service';
import { PersonalizeService } from './personalize.service';
import { QualifyOutput } from '../claude/schemas/qualify.schema';
import { EnrichOutput } from '../claude/schemas/enrich.schema';

// Step literal constants — Phase 45 queries AIOutput by these exact strings. Do not change.
export const STEP_QUALIFY = 'qualify' as const;
export const STEP_ENRICH = 'enrich' as const;
export const STEP_PERSONALIZE = 'personalize' as const;

export type StepEvent =
  | { type: 'qualify-complete'; data: QualifyOutput }
  | { type: 'enrich-complete'; data: EnrichOutput }
  | { type: 'personalize-token'; token: string }
  | { type: 'personalize-complete' };

export type StepCallback = (event: StepEvent) => void;

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly scraper: ScraperService,
    private readonly qualify: QualifyService,
    private readonly enrich: EnrichService,
    private readonly personalize: PersonalizeService,
    private readonly prisma: PrismaService,
  ) {}

  async processWithStream(leadId: string, onStep: StepCallback): Promise<void> {
    try {
      // 1. Set status to processing
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { status: 'processing' },
      });

      // 2. Load lead
      const lead = await this.prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
      });

      // 3. Scrape company website (empty string if unreachable — never throws)
      const scraped = await this.scraper.scrape(lead.companyUrl);
      const leadProfile = this.buildLeadProfile(lead, scraped);

      // 4. Qualify
      this.logger.log(`[${leadId}] Starting qualify step`);
      const qualifyResult = await this.qualify.qualify(leadProfile);
      await this.prisma.aIOutput.create({
        data: { leadId, step: STEP_QUALIFY, content: qualifyResult },
      });
      onStep({ type: 'qualify-complete', data: qualifyResult });
      this.logger.log(`[${leadId}] qualify-complete — icpScore: ${qualifyResult.icpScore}`);

      // 5. Enrich
      this.logger.log(`[${leadId}] Starting enrich step`);
      const enrichResult = await this.enrich.enrich(leadProfile);
      await this.prisma.aIOutput.create({
        data: { leadId, step: STEP_ENRICH, content: enrichResult },
      });
      onStep({ type: 'enrich-complete', data: enrichResult });
      this.logger.log(`[${leadId}] enrich-complete — industry: ${enrichResult.industry}`);

      // 6. Personalize (streaming email)
      this.logger.log(`[${leadId}] Starting personalize step`);
      let emailBody = '';
      for await (const token of this.personalize.streamEmail(leadProfile, enrichResult)) {
        emailBody += token;
        onStep({ type: 'personalize-token', token });
      }
      await this.prisma.aIOutput.create({
        data: { leadId, step: STEP_PERSONALIZE, content: { email: emailBody } },
      });
      onStep({ type: 'personalize-complete' });
      this.logger.log(`[${leadId}] personalize-complete — ${emailBody.length} chars`);

      // 7. Update Lead record with enriched fields + icpScore
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          icpScore: qualifyResult.icpScore,
          industry: enrichResult.industry,
          companySize: enrichResult.companySize,
          status: 'complete',
        },
      });
      this.logger.log(`[${leadId}] Pipeline complete`);
    } catch (err: unknown) {
      // On any failure, mark lead as failed — never leave it stuck in 'processing'
      this.logger.error(`[${leadId}] Pipeline failed: ${(err as Error).message}`);
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { status: 'failed' },
      }).catch(() => {
        // If the lead update itself fails (e.g. leadId not found), log and swallow
        this.logger.error(`[${leadId}] Could not set status to failed`);
      });
      throw err;
    }
  }

  private buildLeadProfile(
    lead: { name: string; companyName: string; companyUrl: string },
    scrapedText: string,
  ): string {
    const lines = [
      `Name: ${lead.name}`,
      `Company: ${lead.companyName}`,
      `Company URL: ${lead.companyUrl}`,
    ];
    if (scrapedText) {
      lines.push('', '## Company Website Content', scrapedText);
    }
    return lines.join('\n');
  }
}
