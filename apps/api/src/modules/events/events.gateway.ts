import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  constructor(
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Validate token (defense in depth — guard already checked, but validate again)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('WS Connection rejected: No token');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Join user-specific room for targeted events
      client.join(`user:${payload.sub}`);

      console.log(`WS Connected: user ${payload.sub}`);
    } catch (error) {
      console.log('WS Connection rejected: Invalid token');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      console.log(`WS Disconnected: user ${client.data.user.id}`);
    }
  }

  // Placeholder for Phase 3 real-time events
  @SubscribeMessage('ping')
  handlePing(client: Socket): { event: string; data: string } {
    return { event: 'pong', data: 'connected' };
  }
}
