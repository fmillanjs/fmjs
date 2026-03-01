import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import { QualifySchema, QualifyOutput } from '../claude/schemas/qualify.schema';
import { QUALIFY_SYSTEM_PROMPT } from '../claude/prompts/qualify.prompt';

@Injectable()
export class QualifyService {
  constructor(private readonly claude: ClaudeService) {}

  async qualify(leadProfile: string): Promise<QualifyOutput> {
    return this.claude.structuredOutput(
      QualifySchema,
      QUALIFY_SYSTEM_PROMPT,
      leadProfile,
    );
  }
}
