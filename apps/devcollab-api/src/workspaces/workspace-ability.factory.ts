import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaService } from '../core/database/prisma.service';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subject =
  | 'Workspace'
  | 'WorkspaceMember'
  | 'InviteLink'
  | 'Post'
  | 'Snippet'
  | 'Comment'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

@Injectable()
export class WorkspaceAbilityFactory {
  constructor(private readonly prisma: PrismaService) {}

  async createForUserInWorkspace(
    userId: string,
    workspaceSlug: string,
  ): Promise<AppAbility | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    });

    if (!workspace) return null;

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: workspace.id },
      },
      select: { role: true },
    });

    if (!membership) return null;

    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (membership.role === 'Admin') {
      can('manage', 'all');
    } else if (membership.role === 'Contributor') {
      can('read', 'all');
      can('create', 'Post');
      can('create', 'Snippet');
      can('create', 'Comment');
      can('update', 'Post');
      can('update', 'Snippet');
      can('update', 'Comment');
      can('delete', 'Post');
      can('delete', 'Snippet');
      can('delete', 'Comment');
      cannot('manage', 'Workspace');
      cannot('manage', 'WorkspaceMember');
      cannot('create', 'InviteLink');
      // Owner-only enforcement (authorId check) is in service layer — guard passes,
      // service fetches record and throws ForbiddenException if requester is not author
    } else if (membership.role === 'Viewer') {
      can('read', 'all');
      cannot('create', 'all');
      cannot('update', 'all');
      cannot('delete', 'all');
    } else {
      cannot('manage', 'all');
    }

    return build();
  }
}
