import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

/**
 * Decorator to automatically emit an audit event after successful execution
 * @param eventName - The name of the event to emit (e.g., 'auth.login')
 */
export const AuditLog = (eventName: string) =>
  SetMetadata(AUDIT_LOG_KEY, eventName);
