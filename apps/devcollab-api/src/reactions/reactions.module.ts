import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}
