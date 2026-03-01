import { Module } from '@nestjs/common';
import { ClaudeModule } from '../claude/claude.module';
import { DatabaseModule } from '../database/database.module';
import { ScraperService } from './scraper.service';
import { QualifyService } from './qualify.service';
import { EnrichService } from './enrich.service';
import { PersonalizeService } from './personalize.service';
// PipelineService will be added by Plan 43-03

@Module({
  imports: [ClaudeModule, DatabaseModule],
  providers: [ScraperService, QualifyService, EnrichService, PersonalizeService],
  exports: [ScraperService, QualifyService, EnrichService, PersonalizeService],
})
export class PipelineModule {}
