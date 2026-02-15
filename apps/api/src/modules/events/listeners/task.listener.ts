import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '../events.gateway';
import type { TaskEvent } from '@repo/shared';
import type { WsTaskEvent } from '../dto/ws-events.dto';

@Injectable()
export class TaskListener {
  constructor(private readonly gateway: EventsGateway) {}

  @OnEvent('task.created', { async: true })
  async handleTaskCreated(event: TaskEvent) {
    const projectId = event.projectId;
    if (!projectId) {
      console.warn('task.created event missing projectId');
      return;
    }

    const wsEvent: WsTaskEvent = {
      type: 'task:created',
      task: event.task,
      taskId: event.entityId,
      userId: event.actorId || '',
      projectId,
      version: event.task?.version,
      timestamp: Date.now(),
    };

    this.gateway.server.to(`project:${projectId}`).emit('task:created', wsEvent);
  }

  @OnEvent('task.updated', { async: true })
  async handleTaskUpdated(event: TaskEvent) {
    const projectId = event.projectId;
    if (!projectId) {
      console.warn('task.updated event missing projectId');
      return;
    }

    const wsEvent: WsTaskEvent = {
      type: 'task:updated',
      task: event.task,
      taskId: event.entityId,
      userId: event.actorId || '',
      projectId,
      version: event.task?.version,
      timestamp: Date.now(),
    };

    this.gateway.server.to(`project:${projectId}`).emit('task:updated', wsEvent);
  }

  @OnEvent('task.status_changed', { async: true })
  async handleTaskStatusChanged(event: TaskEvent) {
    const projectId = event.projectId;
    if (!projectId) {
      console.warn('task.status_changed event missing projectId');
      return;
    }

    const wsEvent: WsTaskEvent = {
      type: 'task:status_changed',
      task: event.task,
      taskId: event.entityId,
      userId: event.actorId || '',
      projectId,
      version: event.task?.version,
      timestamp: Date.now(),
    };

    this.gateway.server
      .to(`project:${projectId}`)
      .emit('task:status_changed', wsEvent);
  }

  @OnEvent('task.deleted', { async: true })
  async handleTaskDeleted(event: TaskEvent) {
    const projectId = event.projectId;
    if (!projectId) {
      console.warn('task.deleted event missing projectId');
      return;
    }

    const wsEvent: WsTaskEvent = {
      type: 'task:deleted',
      taskId: event.entityId,
      userId: event.actorId || '',
      projectId,
      timestamp: Date.now(),
    };

    this.gateway.server.to(`project:${projectId}`).emit('task:deleted', wsEvent);
  }
}
