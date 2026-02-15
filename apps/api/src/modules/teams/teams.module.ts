import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { DatabaseModule } from '../../core/database/database.module';
import { RbacModule } from '../../core/rbac/rbac.module';

@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService], // Exported for use in future project/task modules
})
export class TeamsModule {}
