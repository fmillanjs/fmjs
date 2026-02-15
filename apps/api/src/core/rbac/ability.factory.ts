import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility, PrismaAbility } from '@casl/prisma';
import { PrismaClient } from '@repo/database';

// Define actions
type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Define subjects (Prisma models + 'all')
type Subject = 'User' | 'Organization' | 'Membership' | 'Project' | 'Task' | 'AuditLog' | 'all';

// PrismaAbility type for this application
export type AppAbility = PrismaAbility<[Action, Subject]>;

export interface UserContext {
  id: string;
  role: string;
  organizationId?: string;
}

@Injectable()
export class AbilityFactory {
  createForUser(user: UserContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    if (user.role === 'ADMIN') {
      // ADMIN: Full access to everything
      can('manage', 'all');
    } else if (user.role === 'MANAGER') {
      // MANAGER: Can manage projects and tasks, create teams, invite members, read users
      can('read', 'User'); // Can read all users (scoped by org in service layer)
      can('create', 'Organization'); // Can create teams/organizations
      can('read', 'Organization');
      can('update', 'Organization'); // Can update their own org (ownership check in service layer)
      can('create', 'Membership'); // Can invite members
      can('read', 'Membership');
      can('read', 'Project');
      can('create', 'Project');
      can('update', 'Project'); // Can update projects (ownership check in service layer)
      can('read', 'Task');
      can('create', 'Task');
      can('update', 'Task');

      // MANAGER cannot:
      cannot('delete', 'Organization'); // Cannot delete organizations
      cannot('delete', 'Membership'); // Cannot remove members (admin only)
      cannot('delete', 'Project'); // Cannot delete projects they don't own (service layer check)
      cannot('delete', 'Task');
      cannot('manage', 'AuditLog'); // Cannot access audit logs
      cannot('update', 'User'); // Cannot update other users
      cannot('delete', 'User');
    } else if (user.role === 'MEMBER') {
      // MEMBER: Read-only + own profile + assigned tasks
      can('read', 'User'); // Can read users (scoped by org in service layer)
      can('read', 'Organization');
      can('read', 'Membership');
      can('read', 'Project');
      can('read', 'Task');

      // MEMBER can update their own profile (condition checked in service layer)
      can('update', 'User');

      // MEMBER can update tasks assigned to them (assignment check in service layer)
      can('update', 'Task'); // Filtered by assignment in service

      // MEMBER cannot:
      cannot('create', 'Organization');
      cannot('delete', 'Organization');
      cannot('create', 'Membership');
      cannot('delete', 'Membership');
      cannot('create', 'Project');
      cannot('delete', 'Project');
      cannot('create', 'Task');
      cannot('delete', 'Task');
      cannot('manage', 'AuditLog');
      cannot('delete', 'User');
    } else {
      // Unknown role: no permissions
      cannot('manage', 'all');
    }

    return build();
  }
}
