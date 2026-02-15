import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { AbilityFactory, UserContext } from '../../core/rbac/ability.factory';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { TeamEvent } from '@repo/shared';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a team/organization with the creator as ADMIN member
   */
  async create(dto: CreateTeamDto, user: UserContext, metadata: { ipAddress: string; userAgent: string }) {
    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can('create', 'Organization')) {
      throw new ForbiddenException('Forbidden: You do not have permission to create organizations');
    }

    // Generate slug from name (lowercase, replace spaces with hyphens)
    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Create organization with creator as ADMIN member
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Emit team.created event for audit logging
    const teamEvent: TeamEvent = {
      entityType: 'Organization',
      entityId: organization.id,
      action: 'TEAM_CREATED',
      actorId: user.id,
      outcome: 'SUCCESS',
      metadata,
    };
    this.eventEmitter.emit('team.created', teamEvent);

    return organization;
  }

  /**
   * Find all organizations where user is a member
   */
  async findAllForUser(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations;
  }

  /**
   * Find organization by ID - verify user is member
   */
  async findById(orgId: string, userId: string) {
    // Check if user is member of this organization
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Get all members of an organization
   */
  async getMembers(orgId: string, userId: string) {
    // Verify user is member of this org
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    const members = await this.prisma.membership.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Invite a member to the organization
   * Only ADMIN or MANAGER can invite members
   */
  async inviteMember(
    orgId: string,
    dto: InviteMemberDto,
    currentUser: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    // Check if current user is ADMIN or MANAGER in this org
    const currentMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: currentUser.id,
          organizationId: orgId,
        },
      },
    });

    if (!currentMembership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    if (currentMembership.role !== 'ADMIN' && currentMembership.role !== 'MANAGER') {
      throw new ForbiddenException('Forbidden: Only admins and managers can invite members');
    }

    // Find user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found with this email');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUser.id,
          organizationId: orgId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Create membership
    const membership = await this.prisma.membership.create({
      data: {
        userId: targetUser.id,
        organizationId: orgId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Emit member.invited event for audit logging
    const memberEvent: TeamEvent = {
      entityType: 'Membership',
      entityId: membership.id,
      action: 'MEMBER_INVITED',
      actorId: currentUser.id,
      outcome: 'SUCCESS',
      metadata,
      changes: {
        targetUserId: targetUser.id,
        role: dto.role,
      },
    };
    this.eventEmitter.emit('team.member.invited', memberEvent);

    return membership;
  }

  /**
   * Remove a member from the organization
   * Only ADMIN can remove members
   */
  async removeMember(
    orgId: string,
    targetUserId: string,
    currentUser: UserContext,
    metadata: { ipAddress: string; userAgent: string },
  ) {
    // Check if current user is ADMIN in this org
    const currentMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: currentUser.id,
          organizationId: orgId,
        },
      },
    });

    if (!currentMembership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    if (currentMembership.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Only admins can remove members');
    }

    // Find target membership
    const targetMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Prevent removing self if last admin
    if (currentUser.id === targetUserId) {
      const adminCount = await this.prisma.membership.count({
        where: {
          organizationId: orgId,
          role: 'ADMIN',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException('Cannot remove the last admin from the organization');
      }
    }

    // Delete membership
    await this.prisma.membership.delete({
      where: {
        id: targetMembership.id,
      },
    });

    // Emit member.removed event for audit logging
    const memberEvent: TeamEvent = {
      entityType: 'Membership',
      entityId: targetMembership.id,
      action: 'MEMBER_REMOVED',
      actorId: currentUser.id,
      outcome: 'SUCCESS',
      metadata,
      changes: {
        targetUserId,
        role: targetMembership.role,
      },
    };
    this.eventEmitter.emit('team.member.removed', memberEvent);

    return { success: true };
  }
}
