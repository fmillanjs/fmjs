import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { AbilityFactory, UserContext } from '../../core/rbac/ability.factory';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateTaskStatusDto } from './dto/update-task.dto';
import { TaskEvent, TaskStatus } from '@repo/shared';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Verify user has access to project and return project with organizationId
   */
  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user is member of project's organization
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    return project;
  }

  /**
   * Verify user has access to task and return task
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
   * Create a task in a project
   */
  async create(
    dto: CreateTaskDto,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    // Verify project access
    const project = await this.verifyProjectAccess(dto.projectId, user.id);

    const ability = this.abilityFactory.createForUser(user);
    if (!ability.can('create', 'Task')) {
      throw new ForbiddenException('Forbidden: You do not have permission to create tasks');
    }

    // If assigneeId provided, verify assignee is member of same organization
    if (dto.assigneeId) {
      const assigneeMembership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: dto.assigneeId,
            organizationId: project.organizationId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new ForbiddenException('Assignee is not a member of this organization');
      }
    }

    // If labelIds provided, verify labels belong to same organization
    if (dto.labelIds && dto.labelIds.length > 0) {
      const labels = await this.prisma.label.findMany({
        where: {
          id: { in: dto.labelIds },
          organizationId: project.organizationId,
        },
      });

      if (labels.length !== dto.labelIds.length) {
        throw new ForbiddenException('One or more labels do not belong to this organization');
      }
    }

    // Calculate position: count of tasks with same status in project
    const taskCount = await this.prisma.task.count({
      where: {
        projectId: dto.projectId,
        status: dto.status,
      },
    });

    // Create task
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate,
        position: taskCount,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
        createdById: user.id,
        labels: dto.labelIds?.length
          ? {
              connect: dto.labelIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        labels: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Emit task.created event
    const taskEvent: TaskEvent = {
      entityType: 'Task',
      entityId: task.id,
      action: 'TASK_CREATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: dto.projectId,
      task,
    };
    this.eventEmitter.emit('task.created', taskEvent);

    return task;
  }

  /**
   * Find all tasks in a project with optional filters
   */
  async findAllByProject(
    projectId: string,
    userId: string,
    filters: {
      status?: TaskStatus;
      priority?: string;
      assigneeId?: string;
      labelIds?: string[];
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    // Verify project access
    const project = await this.verifyProjectAccess(projectId, userId);

    // Build WHERE clause
    const where: any = {
      projectId,
      project: {
        organizationId: project.organizationId, // CRITICAL: prevent cross-tenant
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.labelIds && filters.labelIds.length > 0) {
      where.labels = {
        some: {
          id: {
            in: filters.labelIds,
          },
        },
      };
    }

    if (filters.search) {
      where.OR = [
        {
          title: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        labels: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy,
    });

    return tasks;
  }

  /**
   * Find task by ID with full details
   */
  async findById(taskId: string, userId: string) {
    const task = await this.verifyTaskAccess(taskId, userId);

    const fullTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        labels: true,
        comments: {
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        project: true,
      },
    });

    return fullTask;
  }

  /**
   * Update a task
   */
  async update(
    taskId: string,
    dto: UpdateTaskDto,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const task = await this.verifyTaskAccess(taskId, user.id);

    const ability = this.abilityFactory.createForUser(user);
    if (!ability.can('update', 'Task')) {
      throw new ForbiddenException('Forbidden: You do not have permission to update tasks');
    }

    // Capture previous state for audit diff
    const previous = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
    };

    // If assigneeId changed, verify new assignee is org member
    if (dto.assigneeId && dto.assigneeId !== task.assigneeId) {
      const assigneeMembership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: dto.assigneeId,
            organizationId: task.project.organizationId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new ForbiddenException('Assignee is not a member of this organization');
      }
    }

    // If labelIds provided, verify labels belong to same organization
    if (dto.labelIds && dto.labelIds.length > 0) {
      const labels = await this.prisma.label.findMany({
        where: {
          id: { in: dto.labelIds },
          organizationId: task.project.organizationId,
        },
      });

      if (labels.length !== dto.labelIds.length) {
        throw new ForbiddenException('One or more labels do not belong to this organization');
      }
    }

    // Optimistic concurrency control with version field
    let updatedTask;
    if (dto.version !== undefined) {
      // Client provided version - use atomic updateMany for conflict detection
      const result = await this.prisma.task.updateMany({
        where: {
          id: taskId,
          version: dto.version, // Only update if version matches
        },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: dto.dueDate,
          assigneeId: dto.assigneeId,
          version: { increment: 1 }, // Atomic increment
        },
      });

      // Conflict detection - updateMany returns count of affected rows
      if (result.count === 0) {
        // Version mismatch = concurrent edit detected
        const currentTask = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { version: true },
        });

        throw new ConflictException({
          message: 'Task was modified by another user',
          code: 'CONCURRENT_MODIFICATION',
          expectedVersion: dto.version,
          currentVersion: currentTask?.version,
        });
      }

      // Fetch updated task with relations (updateMany doesn't return data)
      const fetchedTask = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          labels: true,
        },
      });

      if (!fetchedTask) {
        throw new NotFoundException('Task not found after update');
      }

      // Update labels separately (updateMany doesn't support relation operations)
      if (dto.labelIds) {
        updatedTask = await this.prisma.task.update({
          where: { id: taskId },
          data: {
            labels: {
              set: [], // Disconnect all
              connect: dto.labelIds.map((id) => ({ id })),
            },
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            labels: true,
          },
        });
      } else {
        updatedTask = fetchedTask;
      }
    } else {
      // No version provided - fall back to regular update without conflict detection
      updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: dto.dueDate,
          assigneeId: dto.assigneeId,
          version: { increment: 1 },
          labels: dto.labelIds
            ? {
                set: [], // Disconnect all
                connect: dto.labelIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          labels: true,
        },
      });
    }

    // Emit task.updated event
    const taskEvent: TaskEvent = {
      entityType: 'Task',
      entityId: taskId,
      action: 'TASK_UPDATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: task.project.id,
      task: updatedTask,
      changes: {
        previous,
        current: {
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          dueDate: updatedTask.dueDate,
          assigneeId: updatedTask.assigneeId,
        },
      },
    };
    this.eventEmitter.emit('task.updated', taskEvent);

    return updatedTask;
  }

  /**
   * Update task status (optimized for Kanban drag-drop)
   */
  async updateStatus(
    taskId: string,
    dto: UpdateTaskStatusDto,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const task = await this.verifyTaskAccess(taskId, user.id);

    const ability = this.abilityFactory.createForUser(user);
    if (!ability.can('update', 'Task')) {
      throw new ForbiddenException('Forbidden: You do not have permission to update tasks');
    }

    const previousStatus = task.status;

    // Optimistic concurrency control with version field
    let updatedTask;
    if (dto.version !== undefined) {
      // Client provided version - use atomic updateMany for conflict detection
      const result = await this.prisma.task.updateMany({
        where: {
          id: taskId,
          version: dto.version, // Only update if version matches
        },
        data: {
          status: dto.status,
          version: { increment: 1 }, // Atomic increment
        },
      });

      // Conflict detection - updateMany returns count of affected rows
      if (result.count === 0) {
        // Version mismatch = concurrent edit detected
        const currentTask = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { version: true },
        });

        throw new ConflictException({
          message: 'Task was modified by another user',
          code: 'CONCURRENT_MODIFICATION',
          expectedVersion: dto.version,
          currentVersion: currentTask?.version,
        });
      }

      // Fetch updated task with relations (updateMany doesn't return data)
      const fetchedTask = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          labels: true,
        },
      });

      if (!fetchedTask) {
        throw new NotFoundException('Task not found after update');
      }

      updatedTask = fetchedTask;
    } else {
      // No version provided - fall back to regular update without conflict detection
      updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: dto.status,
          version: { increment: 1 },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          labels: true,
        },
      });
    }

    // Emit task.status_changed event
    const taskEvent: TaskEvent = {
      entityType: 'Task',
      entityId: taskId,
      action: 'TASK_STATUS_CHANGED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: task.project.id,
      task: updatedTask,
      changes: {
        previousStatus,
        newStatus: dto.status,
      },
    };
    this.eventEmitter.emit('task.status_changed', taskEvent);

    return updatedTask;
  }

  /**
   * Delete a task
   */
  async remove(
    taskId: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const task = await this.verifyTaskAccess(taskId, user.id);

    const ability = this.abilityFactory.createForUser(user);
    if (!ability.can('delete', 'Task')) {
      throw new ForbiddenException('Forbidden: You do not have permission to delete tasks');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    // Emit task.deleted event
    const taskEvent: TaskEvent = {
      entityType: 'Task',
      entityId: taskId,
      action: 'TASK_DELETED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      projectId: task.project.id,
    };
    this.eventEmitter.emit('task.deleted', taskEvent);

    return { success: true };
  }

  /**
   * Get project activity feed (audit log for tasks, comments, projects)
   */
  async getProjectActivity(
    projectId: string,
    userId: string,
    offset: number = 0,
    limit: number = 20,
  ) {
    // Verify project access
    const project = await this.verifyProjectAccess(projectId, userId);

    // Query audit log for entities related to this project
    const activities = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          {
            // Project-level events
            entityType: 'Project',
            entityId: projectId,
          },
          {
            // Task events (need to check if task belongs to project via entityId)
            entityType: 'Task',
          },
          {
            // Comment events (need to check if comment's task belongs to project)
            entityType: 'Comment',
          },
        ],
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Filter tasks and comments to only those belonging to this project
    // (This is a simplified approach - in production, you'd denormalize or use a join)
    const filteredActivities = [];
    for (const activity of activities) {
      if (activity.entityType === 'Project') {
        filteredActivities.push(activity);
      } else if (activity.entityType === 'Task' && activity.entityId) {
        const task = await this.prisma.task.findUnique({
          where: { id: activity.entityId },
          select: { projectId: true },
        });
        if (task?.projectId === projectId) {
          filteredActivities.push(activity);
        }
      } else if (activity.entityType === 'Comment' && activity.entityId) {
        const comment = await this.prisma.comment.findUnique({
          where: { id: activity.entityId },
          include: { task: { select: { projectId: true } } },
        });
        if (comment?.task.projectId === projectId) {
          filteredActivities.push(activity);
        }
      }
    }

    return {
      activities: filteredActivities,
      offset,
      limit,
      total: filteredActivities.length,
    };
  }
}
