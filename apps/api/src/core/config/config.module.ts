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
      // With webpack bundling, __dirname is apps/api/dist, so go up 3 levels to monorepo root
      envFilePath: join(__dirname, '../../../.env'),
    }),
  ],
})
export class ConfigModule {}
