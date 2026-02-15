import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { DatabaseModule } from '../../core/database/database.module';
import { TaskListener } from './listeners/task.listener';
import { CommentListener } from './listeners/comment.listener';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
    DatabaseModule,
  ],
  providers: [EventsGateway, WsAuthGuard, TaskListener, CommentListener],
  exports: [EventsGateway],
})
export class EventsModule {}
