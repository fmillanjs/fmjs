import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
