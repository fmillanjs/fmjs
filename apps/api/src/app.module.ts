import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { RbacModule } from './core/rbac/rbac.module';
import { AuditModule } from './core/audit/audit.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { LabelsModule } from './modules/labels/labels.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { EventsModule } from './modules/events/events.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from './core/rbac/rbac.guard';
import { AuditInterceptor } from './core/audit/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule,    // Global config with env validation
    DatabaseModule,  // Global Prisma service
    RbacModule,      // Global RBAC with CASL
    AuditModule,     // Global audit logging with event-driven architecture
    HealthModule,    // Health check endpoints
    AuthModule,      // JWT authentication
    UsersModule,     // User management
    TeamsModule,     // Team/Organization management
    ProjectsModule,  // Project management
    LabelsModule,    // Label management
    TasksModule,     // Task management with CRUD and filtering
    CommentsModule,  // Comment management with author restrictions
    EventsModule,    // WebSocket real-time events
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor, // Extracts IP and user agent for audit events
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
