import { Module } from '@nestjs/common';
import { ClaudeModule } from '../claude/claude.module';
import { DatabaseModule } from '../database/database.module';
import { ScraperService } from './scraper.service';
import { QualifyService } from './qualify.service';
import { EnrichService } from './enrich.service';
import { PersonalizeService } from './personalize.service';
import { PipelineService } from './pipeline.service';

@Module({
  imports: [ClaudeModule, DatabaseModule],
  providers: [ScraperService, QualifyService, EnrichService, PersonalizeService, PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
