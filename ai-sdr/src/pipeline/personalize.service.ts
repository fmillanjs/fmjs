import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import { EnrichOutput } from '../claude/schemas/enrich.schema';
import { PERSONALIZE_SYSTEM_PROMPT } from '../claude/prompts/personalize.prompt';

@Injectable()
export class PersonalizeService {
  constructor(private readonly claude: ClaudeService) {}

  streamEmail(
    leadProfile: string,
    enrichment: EnrichOutput,
  ): AsyncGenerator<string> {
    const userMessage = this.buildPersonalizeInput(leadProfile, enrichment);
    return this.claude.streamText(PERSONALIZE_SYSTEM_PROMPT, userMessage);
  }

  private buildPersonalizeInput(
    leadProfile: string,
    enrichment: EnrichOutput,
  ): string {
    return [
      leadProfile,
      '',
      '## Enrichment Context',
      `Industry: ${enrichment.industry ?? 'Unknown'}`,
      `Company Size: ${enrichment.companySize ?? 'Unknown'}`,
      `Tech Stack: ${enrichment.techStack.join(', ') || 'Unknown'}`,
      `Pain Points: ${enrichment.painPoints.join('; ') || 'Unknown'}`,
    ].join('\n');
  }
}
