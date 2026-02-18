import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CaslAuthGuard } from './guards/casl-auth.guard';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SnippetsModule } from './snippets/snippets.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
import { SearchModule } from './search/search.module';

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
    WorkspacesModule,
    SnippetsModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    NotificationsModule,
    ActivityModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaslAuthGuard,
    },
  ],
})
export class AppModule {}
