import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../types/enums';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional(),
  labelIds: z.array(z.string().cuid()).default([]),
  projectId: z.string().cuid(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment must be at most 5000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
