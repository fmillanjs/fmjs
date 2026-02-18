import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { WorkspaceAbilityFactory } from './workspace-ability.factory';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceAbilityFactory],
  exports: [WorkspaceAbilityFactory],
})
export class WorkspacesModule {}
