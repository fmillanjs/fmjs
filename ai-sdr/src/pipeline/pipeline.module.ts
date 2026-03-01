import { Module } from '@nestjs/common';
import { ClaudeModule } from '../claude/claude.module';
import { DatabaseModule } from '../database/database.module';
import { ScraperService } from './scraper.service';

@Module({
  imports: [ClaudeModule, DatabaseModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class PipelineModule {}
