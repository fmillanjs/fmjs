import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditEventPayload } from '@repo/shared';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(payload: AuditEventPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: payload.entityType,
          entityId: payload.entityId,
          action: payload.action,
          actorId: payload.actorId,
          outcome: payload.outcome,
          changes: payload.changes as any,
          metadata: payload.metadata as any,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Audit logging should NEVER crash the main operation
      console.error('Failed to write audit log:', error);
    }
  }
}
