import { AuditAction, AuditOutcome } from './enums';

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  actorId: string | null;
  outcome: AuditOutcome;
  changes: Record<string, unknown> | null;
  metadata: AuditMetadata | null;
  timestamp: Date;
}

export interface AuditMetadata {
  ipAddress: string;
  userAgent: string;
  requestId?: string;
}
