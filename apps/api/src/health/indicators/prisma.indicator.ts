import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple database connectivity check
      await this.prisma.$queryRaw`SELECT 1`;

      return this.getStatus(key, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      throw new HealthCheckError(
        'PrismaHealthIndicator failed',
        this.getStatus(key, false, { error: errorMessage })
      );
    }
  }
}
