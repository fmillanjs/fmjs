import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { RbacModule } from './core/rbac/rbac.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from './core/rbac/rbac.guard';

@Module({
  imports: [
    ConfigModule,    // Global config with env validation
    DatabaseModule,  // Global Prisma service
    RbacModule,      // Global RBAC with CASL
    HealthModule,    // Health check endpoints
    AuthModule,      // JWT authentication
    UsersModule,     // User management
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Global JWT authentication guard (runs first)
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard, // Global RBAC authorization guard (runs after JWT)
    },
    // TODO: Add logging interceptor once rxjs duplication is resolved
  ],
})
export class AppModule {}
