import { AuditAction, AuditOutcome } from './enums';
import type { TaskWithRelations, CommentWithAuthor } from './task';

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

export interface TeamEvent extends AuditEventPayload {
  entityType: 'Organization' | 'Membership';
  action: 'TEAM_CREATED' | 'MEMBER_INVITED' | 'MEMBER_REMOVED';
}

export interface ProjectEvent extends AuditEventPayload {
  entityType: 'Project';
  action: 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_ARCHIVED' | 'PROJECT_DELETED';
}

export interface TaskEvent extends AuditEventPayload {
  entityType: 'Task';
  action: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_STATUS_CHANGED' | 'TASK_DELETED';
}

export interface CommentEvent extends AuditEventPayload {
  entityType: 'Comment';
  action: 'COMMENT_CREATED' | 'COMMENT_UPDATED' | 'COMMENT_DELETED';
}

// WebSocket event types (re-export for frontend access)
export type { TaskWithRelations, CommentWithAuthor };

export interface WsTaskEvent {
  type:
    | 'task:created'
    | 'task:updated'
    | 'task:status_changed'
    | 'task:deleted';
  task?: TaskWithRelations;
  taskId?: string;
  userId: string;
  projectId: string;
  version?: number;
  timestamp: number;
}

export interface WsCommentEvent {
  type: 'comment:created' | 'comment:updated' | 'comment:deleted';
  comment?: CommentWithAuthor;
  commentId?: string;
  taskId: string;
  userId: string;
  projectId: string;
  timestamp: number;
}

export interface WsPresenceEvent {
  userId: string;
  email: string;
  name?: string;
  projectId: string;
}
