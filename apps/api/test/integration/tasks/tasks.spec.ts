import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '@repo/shared';
import { TaskStatus, TaskPriority } from '@repo/shared';

describe('Task API Validation', () => {
  describe('Create Task Validation', () => {
    it('should fail validation when title is missing', () => {
      const result = createTaskSchema.safeParse({
        projectId: 'cm123456789',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.errors.find(e => e.path[0] === 'title');
        expect(titleError).toBeDefined();
      }
    });

    it('should fail validation when title is empty', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        projectId: 'cm123456789',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.errors.find(e => e.path[0] === 'title');
        expect(titleError).toBeDefined();
        expect(titleError?.message).toContain('required');
      }
    });

    it('should fail validation when title exceeds 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const result = createTaskSchema.safeParse({
        title: longTitle,
        projectId: 'cm123456789',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.errors.find(e => e.path[0] === 'title');
        expect(titleError).toBeDefined();
        expect(titleError?.message).toContain('at most 200 characters');
      }
    });

    it('should pass validation with valid task data', () => {
      const result = createTaskSchema.safeParse({
        title: 'Valid task title',
        description: 'Task description',
        projectId: 'cm123456789',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Valid task title');
        expect(result.data.status).toBe(TaskStatus.TODO); // Default
        expect(result.data.priority).toBe(TaskPriority.MEDIUM); // Default
      }
    });

    it('should pass validation with minimal required fields', () => {
      const result = createTaskSchema.safeParse({
        title: 'Minimal task',
        projectId: 'cm123456789',
      });

      expect(result.success).toBe(true);
    });

    it('should fail validation when projectId is missing', () => {
      const result = createTaskSchema.safeParse({
        title: 'Valid task title',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const projectIdError = result.error.errors.find(e => e.path[0] === 'projectId');
        expect(projectIdError).toBeDefined();
      }
    });

    it('should accept valid CUID for assigneeId', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task with assignee',
        projectId: 'cm123456789',
        assigneeId: 'cm987654321',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Update Task Validation', () => {
    it('should fail validation with invalid status value', () => {
      const result = updateTaskStatusSchema.safeParse({
        status: 'INVALID_STATUS',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const statusError = result.error.errors.find(e => e.path[0] === 'status');
        expect(statusError).toBeDefined();
      }
    });

    it('should pass validation with valid status value', () => {
      const result = updateTaskStatusSchema.safeParse({
        status: TaskStatus.IN_PROGRESS,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TaskStatus.IN_PROGRESS);
      }
    });

    it('should fail validation with invalid priority in update', () => {
      const result = updateTaskSchema.safeParse({
        priority: 'INVALID_PRIORITY',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const priorityError = result.error.errors.find(e => e.path[0] === 'priority');
        expect(priorityError).toBeDefined();
      }
    });

    it('should pass validation with valid priority value', () => {
      const result = updateTaskSchema.safeParse({
        priority: TaskPriority.URGENT,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(TaskPriority.URGENT);
      }
    });

    it('should allow partial updates', () => {
      const result = updateTaskSchema.safeParse({
        title: 'Updated title only',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated title only');
      }
    });

    it('should not allow projectId in update', () => {
      const result = updateTaskSchema.safeParse({
        title: 'Updated title',
        projectId: 'cm123456789', // Should be omitted
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('projectId');
      }
    });

    it('should accept version for optimistic concurrency control', () => {
      const result = updateTaskSchema.safeParse({
        title: 'Updated with version',
        version: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(5);
      }
    });
  });

  describe('Task Status Enum Validation', () => {
    it('should accept all valid TaskStatus values', () => {
      const validStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED];

      validStatuses.forEach(status => {
        const result = updateTaskStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid TaskPriority values', () => {
      const validPriorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];

      validPriorities.forEach(priority => {
        const result = createTaskSchema.safeParse({
          title: 'Task',
          projectId: 'cm123456789',
          priority,
        });
        expect(result.success).toBe(true);
      });
    });
  });
});
