/**
 * API Response Validation Schemas
 *
 * Zod schemas matching Prisma models for runtime API response validation.
 * These differ from request validation schemas (which validate user input) -
 * they validate API responses match database schema.
 *
 * Key patterns:
 * - z.coerce.date() for all Date fields (handles JSON string serialization)
 * - .nullable() for Prisma optional fields that can be null
 * - .optional() for relations that might not be included
 * - z.string().cuid() for all ID fields matching Prisma @id @default(cuid())
 * - z.enum() for status/priority/role enums matching Prisma enums
 */

import { z } from 'zod';

// ============================================================================
// Enums (matching Prisma schema)
// ============================================================================

export const UserRoleEnum = z.enum(['ADMIN', 'MANAGER', 'MEMBER']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ProjectStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

// ============================================================================
// User Schema
// ============================================================================

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleEnum,
  emailVerified: z.coerce.date().nullable(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// ============================================================================
// Organization Schema
// ============================================================================

export const OrganizationSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// ============================================================================
// Membership Schema
// ============================================================================

export const MembershipSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  organizationId: z.string().cuid(),
  role: UserRoleEnum,
  joinedAt: z.coerce.date(),
  // Optional nested relations
  user: UserSchema.optional(),
  organization: OrganizationSchema.optional(),
});

export type Membership = z.infer<typeof MembershipSchema>;

// ============================================================================
// Project Schema
// ============================================================================

export const ProjectSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: ProjectStatusEnum,
  organizationId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // Optional nested relations
  organization: OrganizationSchema.optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

// ============================================================================
// Label Schema
// ============================================================================

export const LabelSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  color: z.string(),
  organizationId: z.string().cuid(),
  // Optional nested relations
  organization: OrganizationSchema.optional(),
});

export type Label = z.infer<typeof LabelSchema>;

// ============================================================================
// Task Schema
// ============================================================================

export const TaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  dueDate: z.coerce.date().nullable(),
  position: z.number().int(),
  version: z.number().int(),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().nullable(),
  createdById: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // Optional nested relations
  assignee: UserSchema.nullable().optional(),
  createdBy: UserSchema.optional(),
  project: ProjectSchema.optional(),
  labels: z.array(LabelSchema).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// ============================================================================
// Comment Schema
// ============================================================================

export const CommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string(),
  taskId: z.string().cuid(),
  authorId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // Optional nested relations
  author: UserSchema.optional(),
  task: TaskSchema.optional(),
});

export type Comment = z.infer<typeof CommentSchema>;

// ============================================================================
// AuditLog Schema
// ============================================================================

export const AuditLogSchema = z.object({
  id: z.string().cuid(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  action: z.string(),
  actorId: z.string().cuid().nullable(),
  outcome: z.string(),
  changes: z.any().nullable(), // JSON
  metadata: z.any().nullable(), // JSON
  timestamp: z.coerce.date(),
  // Optional nested relations
  actor: UserSchema.nullable().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
