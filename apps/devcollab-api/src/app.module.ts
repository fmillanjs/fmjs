import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CaslAuthGuard } from './guards/casl-auth.guard';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.DEVCOLLAB_JWT_SECRET || 'devcollab-dev-secret',
        signOptions: { expiresIn: '7d', algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaslAuthGuard,
    },
  ],
})
export class AppModule {}
