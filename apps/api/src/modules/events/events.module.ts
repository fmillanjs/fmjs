import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { DatabaseModule } from '../../core/database/database.module';
import { TaskListener } from './listeners/task.listener';
import { CommentListener } from './listeners/comment.listener';

@Module({
  imports: [JwtModule, DatabaseModule],
  providers: [EventsGateway, WsAuthGuard, TaskListener, CommentListener],
  exports: [EventsGateway],
})
export class EventsModule {}
