import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    try {
      // Extract JWT from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token);

      // Attach user to client data
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      console.log(`WS Auth: User ${payload.sub} authenticated`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('WS Auth failed:', message);
      throw new WsException('Unauthorized');
    }
  }
}
