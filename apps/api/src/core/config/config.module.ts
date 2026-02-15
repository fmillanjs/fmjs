import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';
import { validateEnv } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Load .env from project root (monorepo root)
      // When compiled: dist/apps/api/src/core/config -> ../../../../../../../../.env
      envFilePath: join(__dirname, '../../../../../../../../.env'),
    }),
  ],
})
export class ConfigModule {}
