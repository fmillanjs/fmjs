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
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || 'http://localhost:3000',
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
    // Redis adapter is configured via custom RedisIoAdapter in main.ts
    // This ensures proper initialization before Socket.IO server is created
    console.log('WebSocket server initialized with Redis adapter (configured in main.ts)');
  }

  async handleConnection(client: Socket) {
    try {
      console.log('\n========== WebSocket Connection Attempt ==========');

      // Log complete handshake structure
      console.log('[WS Handshake] Auth object:', {
        hasAuth: !!client.handshake.auth,
        authKeys: client.handshake.auth ? Object.keys(client.handshake.auth) : [],
        hasToken: !!client.handshake.auth?.token,
      });

      console.log('[WS Handshake] Headers:', {
        hasAuthorization: !!client.handshake.headers?.authorization,
        authHeader: client.handshake.headers?.authorization?.substring(0, 30) + '...',
      });

      console.log('[WS Handshake] Query params:', {
        queryKeys: Object.keys(client.handshake.query || {}),
      });

      // Validate token (defense in depth — guard already checked, but validate again)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('[WS Auth] REJECTED: No token found in auth or headers');
        console.log('================================================\n');
        client.disconnect();
        return;
      }

      // Log token details (without exposing full token)
      console.log('[WS Auth] Token received:', {
        present: !!token,
        type: typeof token,
        length: token.length,
        preview: token.substring(0, 20) + '...',
      });

      // Attempt to decode token WITHOUT verification to inspect structure
      try {
        const decoded = jwt.decode(token, { complete: true });
        console.log('[WS Auth] Decoded token (unverified):', {
          header: decoded?.header,
          payload: decoded?.payload,
          hasSignature: !!decoded?.signature,
        });
      } catch (decodeError: any) {
        console.error('[WS Auth] Token decode error:', {
          message: decodeError.message,
          name: decodeError.name,
        });
      }

      // Attempt verification
      console.log('[WS Auth] Attempting verification with algorithm: HS256');
      const payload = await this.jwtService.verifyAsync(token);

      console.log('[WS Auth] Verification SUCCESS:', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
      });

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Join user-specific room for targeted events
      client.join(`user:${payload.sub}`);

      console.log(`[WS Auth] CONNECTED: user ${payload.sub}`);
      console.log('================================================\n');
    } catch (error: any) {
      console.error('[WS Auth] Verification FAILED:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      console.log('[WS Auth] REJECTED: Invalid token');
      console.log('================================================\n');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      // Emit presence:leave for all project rooms the client was in
      const rooms = Array.from(client.rooms);
      const projectRooms = rooms.filter((room) => room.startsWith('project:'));

      // Fetch user name for presence (optional, since user is leaving anyway)
      const userData = await this.prisma.user.findUnique({
        where: { id: client.data.user.id },
        select: { name: true },
      });

      for (const room of projectRooms) {
        const projectId = room.replace('project:', '');
        this.server.to(room).emit('presence:leave', {
          userId: client.data.user.id,
          email: client.data.user.email,
          name: userData?.name || null,
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

      // Join room immediately so concurrent presence:request calls see this socket.
      // Auth check happens below — if it fails, we leave the room before returning.
      const roomName = `project:${projectId}`;
      client.join(roomName);

      // Verify user has access to project via organization membership
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) {
        client.leave(roomName);
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
        client.leave(roomName);
        return {
          event: 'error',
          data: { message: 'Forbidden: Not a member of this organization' },
        };
      }

      // [DEBUG] Log room join confirmation
      console.log(`[Room] Client ${client.id} (user: ${user.id}) joined ${roomName}`);
      console.log('[Room] Client rooms:', Array.from(client.rooms));

      // [DEBUG] Verify room membership with socket count
      const sockets = await this.server.in(roomName).fetchSockets();
      console.log(`[Room] Total sockets in ${roomName}:`, sockets.length);

      // Fetch user name for presence
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      // Emit presence:join to room
      this.server.to(roomName).emit('presence:join', {
        userId: user.id,
        email: user.email,
        name: userData?.name || null,
        projectId,
      });

      return {
        event: 'joined',
        data: { projectId, room: roomName, socketCount: sockets.length },
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

      // Fetch user name for presence
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      // Emit presence:leave before leaving
      this.server.to(roomName).emit('presence:leave', {
        userId: user.id,
        email: user.email,
        name: userData?.name || null,
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

  @SubscribeMessage('presence:request')
  async handlePresenceRequest(
    client: Socket,
    payload: { projectId: string },
  ): Promise<{ activeUsers: any[]; count: number }> {
    try {
      const { projectId } = payload;
      const roomName = `project:${projectId}`;

      // [DEBUG] Log presence request
      console.log('[Presence] Request for room:', roomName);

      // Get all sockets in the project room
      const socketsInRoom = await this.server.in(roomName).fetchSockets();

      // Extract user info from each socket, deduplicate by userId
      const userMap = new Map<string, { userId: string; email: string; name: string | null }>();

      for (const socket of socketsInRoom) {
        const userData = socket.data.user;
        if (userData?.id && !userMap.has(userData.id)) {
          // Fetch user name from database if not in socket data
          const user = await this.prisma.user.findUnique({
            where: { id: userData.id },
            select: { name: true, email: true },
          });

          userMap.set(userData.id, {
            userId: userData.id,
            email: userData.email || user?.email || '',
            name: user?.name || null,
          });
        }
      }

      const activeUsers = Array.from(userMap.values());

      // [DEBUG] Log results
      console.log(`[Presence] Found ${socketsInRoom.length} sockets in ${roomName}`);

      return {
        activeUsers,
        count: activeUsers.length,
      };
    } catch (error) {
      console.error('Error fetching presence:', error);
      return {
        activeUsers: [],
        count: 0,
      };
    }
  }

  // Placeholder for Phase 3 real-time events
  @SubscribeMessage('ping')
  handlePing(client: Socket): { event: string; data: string } {
    return { event: 'pong', data: 'connected' };
  }
}
