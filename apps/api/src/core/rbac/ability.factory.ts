import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility, PrismaAbility } from '@casl/prisma';
import { PrismaClient } from '@repo/database';

// Define actions
type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Define subjects (Prisma models + 'all')
type Subject = 'User' | 'Project' | 'Task' | 'AuditLog' | 'all';

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
      // MANAGER: Can manage projects and tasks, read users
      can('read', 'User'); // Can read all users (will be scoped by org in Phase 2)
      can('read', 'Project');
      can('create', 'Project');
      can('update', 'Project'); // Can update projects (ownership check in service layer)
      can('read', 'Task');
      can('create', 'Task');
      can('update', 'Task');

      // MANAGER cannot:
      cannot('delete', 'Project'); // Cannot delete projects they don't own (service layer check)
      cannot('delete', 'Task');
      cannot('manage', 'AuditLog'); // Cannot access audit logs
      cannot('update', 'User'); // Cannot update other users
      cannot('delete', 'User');
    } else if (user.role === 'MEMBER') {
      // MEMBER: Read-only + own profile + assigned tasks
      can('read', 'User'); // Can read users (will be scoped by org in Phase 2)
      can('read', 'Project');
      can('read', 'Task');

      // MEMBER can update their own profile (condition checked in service layer)
      can('update', 'User');

      // MEMBER can update tasks assigned to them (assignment check in service layer)
      can('update', 'Task'); // Filtered by assignment in service

      // MEMBER cannot:
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
