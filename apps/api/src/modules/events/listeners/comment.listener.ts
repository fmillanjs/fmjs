import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '../events.gateway';
import type { CommentEvent } from '@repo/shared';
import type { WsCommentEvent } from '../dto/ws-events.dto';

@Injectable()
export class CommentListener {
  constructor(private readonly gateway: EventsGateway) {}

  @OnEvent('comment.created', { async: true })
  async handleCommentCreated(event: CommentEvent) {
    const projectId = event.projectId;
    const taskId = event.taskId;

    if (!projectId || !taskId) {
      console.warn('comment.created event missing projectId or taskId');
      return;
    }

    const wsEvent: WsCommentEvent = {
      type: 'comment:created',
      comment: event.comment,
      commentId: event.entityId,
      taskId,
      userId: event.actorId || '',
      projectId,
      timestamp: Date.now(),
    };

    this.gateway.server
      .to(`project:${projectId}`)
      .emit('comment:created', wsEvent);
  }

  @OnEvent('comment.updated', { async: true })
  async handleCommentUpdated(event: CommentEvent) {
    const projectId = event.projectId;
    const taskId = event.taskId;

    if (!projectId || !taskId) {
      console.warn('comment.updated event missing projectId or taskId');
      return;
    }

    const wsEvent: WsCommentEvent = {
      type: 'comment:updated',
      comment: event.comment,
      commentId: event.entityId,
      taskId,
      userId: event.actorId || '',
      projectId,
      timestamp: Date.now(),
    };

    this.gateway.server
      .to(`project:${projectId}`)
      .emit('comment:updated', wsEvent);
  }

  @OnEvent('comment.deleted', { async: true })
  async handleCommentDeleted(event: CommentEvent) {
    const projectId = event.projectId;
    const taskId = event.taskId;

    if (!projectId || !taskId) {
      console.warn('comment.deleted event missing projectId or taskId');
      return;
    }

    const wsEvent: WsCommentEvent = {
      type: 'comment:deleted',
      commentId: event.entityId,
      taskId,
      userId: event.actorId || '',
      projectId,
      timestamp: Date.now(),
    };

    this.gateway.server
      .to(`project:${projectId}`)
      .emit('comment:deleted', wsEvent);
  }
}
