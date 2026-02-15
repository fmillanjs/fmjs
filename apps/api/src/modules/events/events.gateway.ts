import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { PrismaService } from '../../core/database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server!: Server;

  constructor(
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    // Create Redis clients for pub/sub
    const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    const subClient = pubClient.duplicate();

    // Set up Redis adapter for horizontal scaling
    server.adapter(createAdapter(pubClient, subClient));

    console.log('WebSocket server initialized with Redis adapter');
  }

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
      // Emit presence:leave for all project rooms the client was in
      const rooms = Array.from(client.rooms);
      const projectRooms = rooms.filter((room) => room.startsWith('project:'));

      for (const room of projectRooms) {
        const projectId = room.replace('project:', '');
        this.server.to(room).emit('presence:leave', {
          userId: client.data.user.id,
          email: client.data.user.email,
          projectId,
        });
      }

      console.log(`WS Disconnected: user ${client.data.user.id}`);
    }
  }

  @SubscribeMessage('join:project')
  async handleJoinProject(
    client: Socket,
    payload: { projectId: string },
  ): Promise<{ event: string; data: any }> {
    try {
      const { projectId } = payload;
      const user = client.data.user;

      if (!user || !projectId) {
        return {
          event: 'error',
          data: { message: 'Missing user or projectId' },
        };
      }

      // Verify user has access to project via organization membership
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) {
        return {
          event: 'error',
          data: { message: 'Project not found' },
        };
      }

      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: project.organizationId,
          },
        },
      });

      if (!membership) {
        return {
          event: 'error',
          data: { message: 'Forbidden: Not a member of this organization' },
        };
      }

      // Join project room
      const roomName = `project:${projectId}`;
      client.join(roomName);

      // Emit presence:join to room
      this.server.to(roomName).emit('presence:join', {
        userId: user.id,
        email: user.email,
        projectId,
      });

      return {
        event: 'joined',
        data: { projectId, room: roomName },
      };
    } catch (error) {
      console.error('Error joining project room:', error);
      return {
        event: 'error',
        data: { message: 'Failed to join project room' },
      };
    }
  }

  @SubscribeMessage('leave:project')
  async handleLeaveProject(
    client: Socket,
    payload: { projectId: string },
  ): Promise<{ event: string; data: any }> {
    try {
      const { projectId } = payload;
      const user = client.data.user;

      if (!user || !projectId) {
        return {
          event: 'error',
          data: { message: 'Missing user or projectId' },
        };
      }

      const roomName = `project:${projectId}`;

      // Emit presence:leave before leaving
      this.server.to(roomName).emit('presence:leave', {
        userId: user.id,
        email: user.email,
        projectId,
      });

      // Leave project room
      client.leave(roomName);

      return {
        event: 'left',
        data: { projectId },
      };
    } catch (error) {
      console.error('Error leaving project room:', error);
      return {
        event: 'error',
        data: { message: 'Failed to leave project room' },
      };
    }
  }

  // Placeholder for Phase 3 real-time events
  @SubscribeMessage('ping')
  handlePing(client: Socket): { event: string; data: string } {
    return { event: 'pong', data: 'connected' };
  }
}
