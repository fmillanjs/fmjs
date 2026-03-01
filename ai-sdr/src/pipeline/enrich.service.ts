import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import { EnrichSchema, EnrichOutput } from '../claude/schemas/enrich.schema';
import { ENRICH_SYSTEM_PROMPT } from '../claude/prompts/enrich.prompt';

@Injectable()
export class EnrichService {
  constructor(private readonly claude: ClaudeService) {}

  async enrich(leadProfile: string): Promise<EnrichOutput> {
    return this.claude.structuredOutput(
      EnrichSchema,
      ENRICH_SYSTEM_PROMPT,
      leadProfile,
    );
  }
}
