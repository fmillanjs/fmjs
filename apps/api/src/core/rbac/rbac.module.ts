import { Global, Module } from '@nestjs/common';
import { AbilityFactory } from './ability.factory';
import { RbacGuard } from './rbac.guard';

@Global()
@Module({
  providers: [AbilityFactory, RbacGuard],
  exports: [AbilityFactory],
})
export class RbacModule {}
