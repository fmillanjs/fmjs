import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplicationContext } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    const subClient = pubClient.duplicate();

    // Wait for both clients to connect
    await Promise.all([
      new Promise<void>((resolve) => {
        pubClient.on('connect', () => resolve());
      }),
      new Promise<void>((resolve) => {
        subClient.on('connect', () => resolve());
      }),
    ]);

    // Error handling
    pubClient.on('error', (err) => {
      console.error('[Redis Pub] Connection error:', err.message);
    });
    subClient.on('error', (err) => {
      console.error('[Redis Sub] Connection error:', err.message);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
    console.log('[Redis Adapter] Connected successfully');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      console.log('[Redis Adapter] Enabled for WebSocket server');
    } else {
      console.warn('[Redis Adapter] Not initialized - running without cross-session support');
    }

    return server;
  }
}
