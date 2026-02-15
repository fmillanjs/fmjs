import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [JwtModule, DatabaseModule],
  providers: [EventsGateway, WsAuthGuard],
  exports: [EventsGateway],
})
export class EventsModule {}
