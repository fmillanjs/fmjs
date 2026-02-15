import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator implements OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    super();

    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redisClient.ping();

      if (result === 'PONG') {
        return this.getStatus(key, true);
      } else {
        throw new Error(`Unexpected ping response: ${result}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
      throw new HealthCheckError(
        'RedisHealthIndicator failed',
        this.getStatus(key, false, { error: errorMessage })
      );
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
