/**
 * API Schema Validation Tests
 *
 * Validates that Zod schemas correctly handle API response data patterns:
 * - Date serialization (JSON string to Date via z.coerce.date())
 * - Nullable field handling (null vs undefined)
 * - Optional relation inclusion
 * - Enum value consistency
 * - CUID format ID validation
 *
 * These tests prove the schemas are correctly designed to validate
 * API responses without requiring a full running application.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  UserSchema,
  OrganizationSchema,
  MembershipSchema,
  ProjectSchema,
  TaskSchema,
  CommentSchema,
  AuditLogSchema,
  TaskStatusEnum,
  TaskPriorityEnum,
  UserRoleEnum,
  ProjectStatusEnum,
} from '../../../web/lib/validators/api-schemas';

describe('API Schema Validation', () => {
  describe('UserSchema', () => {
    it('should validate a complete user object', () => {
      const userData = {
        id: 'cm123456789abcdef',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        emailVerified: '2024-01-15T10:30:00.000Z',
        image: 'https://example.com/avatar.jpg',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = UserSchema.safeParse(userData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should handle nullable fields correctly', () => {
      const userData = {
        id: 'cm123456789abcdef',
        email: 'test@example.com',
        name: null,
        role: 'MEMBER',
        emailVerified: null,
        image: null,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = UserSchema.safeParse(userData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe(null);
        expect(result.data.emailVerified).toBe(null);
        expect(result.data.image).toBe(null);
      }
    });

    it('should coerce Date strings to Date objects', () => {
      const userData = {
        id: 'cm123456789abcdef',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
        emailVerified: null,
        image: null,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = UserSchema.safeParse(userData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      }
    });

    it('should validate enum values', () => {
      const validRoles = ['ADMIN', 'MANAGER', 'MEMBER'];

      validRoles.forEach(role => {
        const userData = {
          id: 'cm123456789abcdef',
          email: 'test@example.com',
          name: 'Test User',
          role,
          emailVerified: null,
          image: null,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        };

        const result = UserSchema.safeParse(userData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid enum values', () => {
      const userData = {
        id: 'cm123456789abcdef',
        email: 'test@example.com',
        name: 'Test User',
        role: 'INVALID_ROLE',
        emailVerified: null,
        image: null,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = UserSchema.safeParse(userData);
      expect(result.success).toBe(false);
    });
  });

  describe('OrganizationSchema', () => {
    it('should validate organization data', () => {
      const orgData = {
        id: 'cm123456789abcdef',
        name: 'Test Organization',
        slug: 'test-organization',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = OrganizationSchema.safeParse(orgData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.slug).toBe('test-organization');
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('ProjectSchema', () => {
    it('should validate project with nullable description', () => {
      const projectData = {
        id: 'cm123456789abcdef',
        name: 'Test Project',
        description: null,
        status: 'ACTIVE',
        organizationId: 'cm987654321fedcba',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = ProjectSchema.safeParse(projectData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.description).toBe(null);
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('should validate project status enum', () => {
      const statuses = ['ACTIVE', 'ARCHIVED'];

      statuses.forEach(status => {
        const projectData = {
          id: 'cm123456789abcdef',
          name: 'Test Project',
          description: 'Test description',
          status,
          organizationId: 'cm987654321fedcba',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        };

        const result = ProjectSchema.safeParse(projectData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('TaskSchema', () => {
    it('should validate complete task with all fields', () => {
      const taskData = {
        id: 'cm123456789abcdef',
        title: 'Test Task',
        description: 'Task description',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2024-02-20T00:00:00.000Z',
        position: 0,
        version: 1,
        projectId: 'cm987654321fedcba',
        assigneeId: 'cm111111111111111',
        createdById: 'cm222222222222222',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = TaskSchema.safeParse(taskData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.title).toBe('Test Task');
        expect(result.data.status).toBe('TODO');
        expect(result.data.priority).toBe('HIGH');
        expect(result.data.dueDate).toBeInstanceOf(Date);
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should handle nullable fields (description, dueDate, assigneeId)', () => {
      const taskData = {
        id: 'cm123456789abcdef',
        title: 'Test Task',
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        position: 0,
        version: 1,
        projectId: 'cm987654321fedcba',
        assigneeId: null,
        createdById: 'cm222222222222222',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = TaskSchema.safeParse(taskData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.description).toBe(null);
        expect(result.data.dueDate).toBe(null);
        expect(result.data.assigneeId).toBe(null);
      }
    });

    it('should validate task status enum values', () => {
      const statuses = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

      statuses.forEach(status => {
        const taskData = {
          id: 'cm123456789abcdef',
          title: 'Test Task',
          description: null,
          status,
          priority: 'MEDIUM',
          dueDate: null,
          position: 0,
          version: 1,
          projectId: 'cm987654321fedcba',
          assigneeId: null,
          createdById: 'cm222222222222222',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        };

        const result = TaskSchema.safeParse(taskData);
        expect(result.success).toBe(true);
      });
    });

    it('should validate task priority enum values', () => {
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

      priorities.forEach(priority => {
        const taskData = {
          id: 'cm123456789abcdef',
          title: 'Test Task',
          description: null,
          status: 'TODO',
          priority,
          dueDate: null,
          position: 0,
          version: 1,
          projectId: 'cm987654321fedcba',
          assigneeId: null,
          createdById: 'cm222222222222222',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        };

        const result = TaskSchema.safeParse(taskData);
        expect(result.success).toBe(true);
      });
    });

    it('should handle optional nested relations', () => {
      const taskData = {
        id: 'cm123456789abcdef',
        title: 'Test Task',
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        position: 0,
        version: 1,
        projectId: 'cm987654321fedcba',
        assigneeId: 'cm111111111111111',
        createdById: 'cm222222222222222',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        assignee: {
          id: 'cm111111111111111',
          email: 'assignee@example.com',
          name: 'Assignee User',
          role: 'MEMBER',
          emailVerified: null,
          image: null,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        labels: [
          {
            id: 'cm333333333333333',
            name: 'Bug',
            color: '#ff0000',
            organizationId: 'cm987654321fedcba',
          },
        ],
      };

      const result = TaskSchema.safeParse(taskData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.assignee).toBeDefined();
        expect(result.data.assignee?.email).toBe('assignee@example.com');
        expect(result.data.labels).toBeDefined();
        expect(result.data.labels?.length).toBe(1);
      }
    });
  });

  describe('CommentSchema', () => {
    it('should validate comment data', () => {
      const commentData = {
        id: 'cm123456789abcdef',
        content: 'This is a test comment',
        taskId: 'cm987654321fedcba',
        authorId: 'cm111111111111111',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = CommentSchema.safeParse(commentData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.content).toBe('This is a test comment');
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should handle optional author relation', () => {
      const commentData = {
        id: 'cm123456789abcdef',
        content: 'This is a test comment',
        taskId: 'cm987654321fedcba',
        authorId: 'cm111111111111111',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        author: {
          id: 'cm111111111111111',
          email: 'author@example.com',
          name: 'Comment Author',
          role: 'MEMBER',
          emailVerified: null,
          image: null,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      };

      const result = CommentSchema.safeParse(commentData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.author).toBeDefined();
        expect(result.data.author?.email).toBe('author@example.com');
      }
    });
  });

  describe('AuditLogSchema', () => {
    it('should validate audit log with nullable fields', () => {
      const auditData = {
        id: 'cm123456789abcdef',
        entityType: 'Task',
        entityId: 'cm987654321fedcba',
        action: 'TASK_CREATED',
        actorId: 'cm111111111111111',
        outcome: 'SUCCESS',
        changes: { field: 'status', from: 'TODO', to: 'DONE' },
        metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' },
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      const result = AuditLogSchema.safeParse(auditData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.action).toBe('TASK_CREATED');
        expect(result.data.outcome).toBe('SUCCESS');
        expect(result.data.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should handle null JSON fields', () => {
      const auditData = {
        id: 'cm123456789abcdef',
        entityType: 'User',
        entityId: null,
        action: 'LOGIN',
        actorId: null,
        outcome: 'SUCCESS',
        changes: null,
        metadata: null,
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      const result = AuditLogSchema.safeParse(auditData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.entityId).toBe(null);
        expect(result.data.changes).toBe(null);
        expect(result.data.metadata).toBe(null);
      }
    });
  });

  describe('Array Schema Validation', () => {
    it('should validate arrays of tasks', () => {
      const tasksData = [
        {
          id: 'cm123456789abcdef',
          title: 'Task 1',
          description: null,
          status: 'TODO',
          priority: 'HIGH',
          dueDate: null,
          position: 0,
          version: 1,
          projectId: 'cm987654321fedcba',
          assigneeId: null,
          createdById: 'cm222222222222222',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 'cm123456789abcdeg',
          title: 'Task 2',
          description: 'Second task',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: '2024-02-20T00:00:00.000Z',
          position: 1,
          version: 1,
          projectId: 'cm987654321fedcba',
          assigneeId: 'cm111111111111111',
          createdById: 'cm222222222222222',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ];

      const result = z.array(TaskSchema).safeParse(tasksData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data[0].title).toBe('Task 1');
        expect(result.data[1].title).toBe('Task 2');
      }
    });
  });

  describe('CUID Validation', () => {
    it('should accept valid CUID format', () => {
      const validCUIDs = [
        'cm123456789abcdef',
        'cl9876543210zyxwv',
        'ck5555555555aaaaa',
      ];

      validCUIDs.forEach(cuid => {
        const result = z.string().cuid().safeParse(cuid);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid CUID format', () => {
      const invalidCUIDs = [
        '123',
        'invalid-id',
        'not-a-cuid',
      ];

      invalidCUIDs.forEach(cuid => {
        const result = z.string().cuid().safeParse(cuid);
        expect(result.success).toBe(false);
      });
    });
  });
});
