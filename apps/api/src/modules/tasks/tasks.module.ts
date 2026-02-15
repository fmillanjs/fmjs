import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { DatabaseModule } from '../../core/database/database.module';
import { RbacModule } from '../../core/rbac/rbac.module';

@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
