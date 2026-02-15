export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  SIGNUP: 'SIGNUP',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditOutcome = {
  SUCCESS: 'SUCCESS',
  DENIED: 'DENIED',
  FAILURE: 'FAILURE',
} as const;
export type AuditOutcome = (typeof AuditOutcome)[keyof typeof AuditOutcome];
