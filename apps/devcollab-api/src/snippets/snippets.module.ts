import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { SnippetsService } from './snippets.service';
import { SnippetsController } from './snippets.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SnippetsController],
  providers: [SnippetsService],
})
export class SnippetsModule {}
