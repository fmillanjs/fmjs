import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { UserContext } from '../../core/rbac/ability.factory';
import { CommentEvent } from '@repo/shared';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Verify user has access to task (via organization membership)
   */
  private async verifyTaskAccess(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user is member of task's organization
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: task.project.organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    return task;
  }

  /**
   * Create a comment on a task
   */
  async create(
    taskId: string,
    content: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    // Verify user has access to task's organization
    const task = await this.verifyTaskAccess(taskId, user.id);

    const comment = await this.prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Emit comment.created event
    const commentEvent: CommentEvent = {
      entityType: 'Comment',
      entityId: comment.id,
      action: 'COMMENT_CREATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: task.project.id,
      taskId,
      comment,
    };
    this.eventEmitter.emit('comment.created', commentEvent);

    return comment;
  }

  /**
   * Find all comments for a task
   */
  async findAllByTask(taskId: string, userId: string) {
    // Verify user has access to task's organization
    await this.verifyTaskAccess(taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return comments;
  }

  /**
   * Update a comment (author only or admin)
   */
  async update(
    commentId: string,
    content: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Verify user is author OR admin
    if (comment.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Emit comment.updated event
    const commentEvent: CommentEvent = {
      entityType: 'Comment',
      entityId: commentId,
      action: 'COMMENT_UPDATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: comment.task.project.id,
      taskId: comment.taskId,
      comment: updatedComment,
    };
    this.eventEmitter.emit('comment.updated', commentEvent);

    return updatedComment;
  }

  /**
   * Delete a comment (author only or admin)
   */
  async remove(
    commentId: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Verify user is author OR admin
    if (comment.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit comment.deleted event
    const commentEvent: CommentEvent = {
      entityType: 'Comment',
      entityId: commentId,
      action: 'COMMENT_DELETED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: comment.task.project.id,
      taskId: comment.taskId,
    };
    this.eventEmitter.emit('comment.deleted', commentEvent);

    return { success: true };
  }
}
