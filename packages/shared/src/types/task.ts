import type { TaskStatus, TaskPriority } from './enums';

export interface LabelBase {
  id: string;
  name: string;
  color: string;
  organizationId: string;
}

export interface CommentBase {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithAuthor extends CommentBase {
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface TaskBase {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  position: number;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TaskWithRelations extends TaskBase {
  assignee?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  labels: LabelBase[];
  _count: {
    comments: number;
  };
}

export interface TaskDetail extends TaskBase {
  assignee?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  labels: LabelBase[];
  comments: CommentWithAuthor[];
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
