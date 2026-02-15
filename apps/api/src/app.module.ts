import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule,    // Global config with env validation
    DatabaseModule,  // Global Prisma service
    // HealthModule will be added in Task 2
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // TODO: Add logging interceptor once rxjs duplication is resolved
  ],
})
export class AppModule {}
