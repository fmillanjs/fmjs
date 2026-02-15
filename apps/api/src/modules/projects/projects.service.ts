import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { AbilityFactory, UserContext } from '../../core/rbac/ability.factory';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectEvent } from '@repo/shared';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Verify user is member of organization
   * Throws ForbiddenException if not a member
   */
  private async verifyMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    return membership;
  }

  /**
   * Create a project in the organization (scoped to team)
   */
  async create(
    organizationId: string,
    dto: CreateProjectDto,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    // Verify user is member of this organization
    await this.verifyMembership(user.id, organizationId);

    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can('create', 'Project')) {
      throw new ForbiddenException('Forbidden: You do not have permission to create projects');
    }

    // Create project with organization scoping
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    // Emit project.created event for audit logging
    const projectEvent: ProjectEvent = {
      entityType: 'Project',
      entityId: project.id,
      action: 'PROJECT_CREATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
    };
    this.eventEmitter.emit('project.created', projectEvent);

    return project;
  }

  /**
   * Find all projects in an organization
   */
  async findAllByOrg(organizationId: string, userId: string) {
    // Verify user is member of this organization
    await this.verifyMembership(userId, organizationId);

    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  /**
   * Find a project by ID - verify user is member of project's organization
   */
  async findById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user is member of this project's organization
    await this.verifyMembership(userId, project.organizationId);

    return project;
  }

  /**
   * Update a project
   */
  async update(
    projectId: string,
    dto: UpdateProjectDto,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user is member of this project's organization
    await this.verifyMembership(user.id, project.organizationId);

    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can('update', 'Project')) {
      throw new ForbiddenException('Forbidden: You do not have permission to update projects');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    // Emit project.updated event for audit logging
    const projectEvent: ProjectEvent = {
      entityType: 'Project',
      entityId: projectId,
      action: 'PROJECT_UPDATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
      changes: dto as Record<string, unknown>,
    };
    this.eventEmitter.emit('project.updated', projectEvent);

    return updatedProject;
  }

  /**
   * Archive a project (set status to ARCHIVED)
   */
  async archive(
    projectId: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user is member of this project's organization
    await this.verifyMembership(user.id, project.organizationId);

    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can('update', 'Project')) {
      throw new ForbiddenException('Forbidden: You do not have permission to archive projects');
    }

    const archivedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    // Emit project.archived event for audit logging
    const projectEvent: ProjectEvent = {
      entityType: 'Project',
      entityId: projectId,
      action: 'PROJECT_ARCHIVED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
    };
    this.eventEmitter.emit('project.archived', projectEvent);

    return archivedProject;
  }

  /**
   * Delete a project (admin only)
   */
  async remove(
    projectId: string,
    user: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user is member of this project's organization
    await this.verifyMembership(user.id, project.organizationId);

    // Only ADMIN can delete projects
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Only admins can delete projects');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    // Emit project.deleted event for audit logging
    const projectEvent: ProjectEvent = {
      entityType: 'Project',
      entityId: projectId,
      action: 'PROJECT_DELETED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
    };
    this.eventEmitter.emit('project.deleted', projectEvent);

    return { success: true };
  }
}
