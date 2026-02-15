import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { AbilityFactory, UserContext } from '../../core/rbac/ability.factory';
import { accessibleBy } from '@casl/prisma';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RbacEvent } from '@repo/shared';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(user: UserContext) {
    const ability = this.abilityFactory.createForUser(user);

    // Database-level filtering: only return users the current user can read
    const users = await this.prisma.user.findMany({
      where: {
        AND: [accessibleBy(ability, 'read').User],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return users;
  }

  async findById(id: string, user: UserContext) {
    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can('read', 'User')) {
      throw new ForbiddenException('Forbidden: You do not have permission to view users');
    }

    const foundUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    return foundUser;
  }

  async updateProfile(id: string, dto: UpdateProfileDto, user: UserContext) {
    const ability = this.abilityFactory.createForUser(user);

    // Check if user is updating their own profile or is an admin
    if (user.id !== id && !ability.can('manage', 'all')) {
      throw new ForbiddenException('Forbidden: You can only update your own profile');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        image: dto.image,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    });

    return updatedUser;
  }

  async updateRole(targetUserId: string, newRole: string, actor: UserContext, metadata?: { ipAddress: string; userAgent: string }) {
    const ability = this.abilityFactory.createForUser(actor);

    // Only ADMIN can change roles
    if (!ability.can('manage', 'User')) {
      throw new ForbiddenException('Forbidden: Only admins can change user roles');
    }

    // Validate role
    if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(newRole)) {
      throw new ForbiddenException('Invalid role');
    }

    // Get user before update to track from/to
    const beforeUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Emit role changed event
    if (beforeUser && metadata) {
      const roleChangedEvent: RbacEvent = {
        entityType: 'User',
        entityId: targetUserId,
        action: 'ROLE_CHANGED',
        actorId: actor.id,
        outcome: 'SUCCESS',
        metadata,
        changes: {
          field: 'role',
          from: beforeUser.role,
          to: newRole,
        },
      };
      this.eventEmitter.emit('rbac.role.changed', roleChangedEvent);
    }

    return updatedUser;
  }
}
