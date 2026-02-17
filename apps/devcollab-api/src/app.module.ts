import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CaslAuthGuard } from './guards/casl-auth.guard';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaslAuthGuard,
    },
  ],
})
export class AppModule {}
