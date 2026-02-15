import { AuditAction, AuditOutcome } from './enums';

export interface AuditEventPayload {
  entityType: string;
  entityId?: string;
  action: AuditAction;
  actorId?: string;
  outcome: AuditOutcome;
  changes?: Record<string, unknown>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    requestId?: string;
  };
}

// Specific event types for type safety
export interface AuthEvent extends AuditEventPayload {
  entityType: 'User';
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'SIGNUP' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETE' | 'PASSWORD_CHANGED';
}

export interface RbacEvent extends AuditEventPayload {
  entityType: 'User';
  action: 'ROLE_CHANGED';
  changes: {
    field: 'role';
    from: string;
    to: string;
  };
}

export interface AuthorizationDeniedEvent extends AuditEventPayload {
  entityType: string;
  action: 'AUTHORIZATION_DENIED';
  outcome: 'DENIED';
  changes: {
    attemptedAction: string;
    requiredPermission: string;
  };
}
