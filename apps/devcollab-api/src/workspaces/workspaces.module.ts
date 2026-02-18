import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { WorkspaceAbilityFactory } from './workspace-ability.factory';

@Module({
  imports: [DatabaseModule],
  providers: [WorkspaceAbilityFactory],
  exports: [WorkspaceAbilityFactory],
})
export class WorkspacesModule {}
