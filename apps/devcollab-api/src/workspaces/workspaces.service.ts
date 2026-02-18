import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../core/database/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  // WORK-01: Create workspace, creator becomes Admin
  async create(dto: CreateWorkspaceDto, creatorId: string) {
    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    try {
      return await this.prisma.workspace.create({
        data: {
          name: dto.name,
          slug,
          members: {
            create: {
              userId: creatorId,
              role: 'Admin',
            },
          },
        },
        include: { members: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(`Workspace slug '${slug}' is already taken`);
      }
      throw e;
    }
  }

  // WORK-01: List workspaces where user is a member
  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { members: { select: { role: true, userId: true } } },
    });
  }

  // WORK-01: Get workspace by slug (membership enforced by guard)
  async findOne(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);
    return workspace;
  }

  // WORK-02: Generate invite link — Admin only (guard enforces Admin via InviteLink ability)
  async generateInviteLink(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);

    return this.prisma.inviteLink.create({
      data: {
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        workspaceId: workspace.id,
      },
    });
  }

  // WORK-03: Join workspace via invite token
  async joinWorkspace(dto: JoinWorkspaceDto, userId: string) {
    const invite = await this.prisma.inviteLink.findUnique({ where: { token: dto.token } });

    if (!invite) throw new NotFoundException('Invite link not found');
    if (invite.usedAt !== null) throw new BadRequestException('Invite link already used');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite link has expired');

    // Mark as used before creating membership (prevents double-use; acceptable edge case per Phase 16 scope)
    await this.prisma.inviteLink.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    try {
      return await this.prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: 'Contributor',
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Already a member of this workspace');
      }
      throw e;
    }
  }

  // WORK-04: List members — guard enforces workspace membership read
  async listMembers(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // RBAC-01 / WORK-04: Update member role — guard enforces Admin (manage WorkspaceMember)
  // WORK-05: Cannot demote last Admin
  async updateMemberRole(slug: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId: workspace.id } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    // WORK-05: Last-admin protection on demotion
    if (membership.role === 'Admin' && dto.role !== 'Admin') {
      const adminCount = await this.prisma.workspaceMember.count({
        where: { workspaceId: workspace.id, role: 'Admin' },
      });
      if (adminCount === 1) {
        throw new BadRequestException('Cannot demote the last Admin of a workspace');
      }
    }

    return this.prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { role: dto.role },
    });
  }

  // WORK-04 / WORK-05: Remove member — guard enforces Admin (delete WorkspaceMember)
  async removeMember(slug: string, targetUserId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId: workspace.id } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    // WORK-05: Last-admin protection on removal
    if (membership.role === 'Admin') {
      const adminCount = await this.prisma.workspaceMember.count({
        where: { workspaceId: workspace.id, role: 'Admin' },
      });
      if (adminCount === 1) {
        throw new BadRequestException('Cannot remove the last Admin from a workspace');
      }
    }

    await this.prisma.workspaceMember.delete({ where: { id: membership.id } });
    return { success: true };
  }
}
