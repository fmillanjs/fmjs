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
    try {
      const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
      const subClient = pubClient.duplicate();

      const connectWithTimeout = (client: Redis, name: string): Promise<void> =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`[Redis ${name}] Connection timeout after 8s`)),
            8000
          );
          client.once('connect', () => { clearTimeout(timer); resolve(); });
          client.once('error', (err) => { clearTimeout(timer); reject(err); });
        });

      await Promise.all([
        connectWithTimeout(pubClient, 'Pub'),
        connectWithTimeout(subClient, 'Sub'),
      ]);

      pubClient.on('error', (err) => console.error('[Redis Pub] Error:', err.message));
      subClient.on('error', (err) => console.error('[Redis Sub] Error:', err.message));

      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log('[Redis Adapter] Connected successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Redis Adapter] Failed to connect:', message);
      console.warn('[Redis Adapter] Running without cross-session WebSocket support');
      this.adapterConstructor = null;
    }
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
