import type { TaskWithRelations, CommentWithAuthor } from '@repo/shared';

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
