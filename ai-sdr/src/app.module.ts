import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ClaudeModule } from './claude/claude.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    HealthModule,
    ClaudeModule,
  ],
})
export class AppModule {}
