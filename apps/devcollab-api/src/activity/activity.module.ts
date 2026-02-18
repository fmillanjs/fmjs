import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
