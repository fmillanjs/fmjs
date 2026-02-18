import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreateCommentDto, authorId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, post: { workspaceId: workspace.id } },
        select: { id: true, parentId: true },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.parentId !== null) {
        throw new BadRequestException('Reply-to-reply is not allowed');
      }
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        postId: dto.postId,
        snippetId: dto.snippetId,
        parentId: dto.parentId,
      },
    });
  }

  async findAll(
    slug: string,
    requesterId: string,
    filter: { postId?: string; snippetId?: string },
  ) {
    // Query 1: workspace lookup
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const where: Record<string, unknown> = {};
    if (filter.postId) {
      where['postId'] = filter.postId;
    } else if (filter.snippetId) {
      where['snippetId'] = filter.snippetId;
    } else {
      // Return comments belonging to this workspace via post or snippet
      where['OR'] = [
        { post: { workspaceId: workspace.id } },
        { snippet: { workspaceId: workspace.id } },
      ];
    }

    // Query 2: flat fetch with author and reactions
    const flat = await this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        reactions: { select: { id: true, emoji: true, userId: true } },
      },
    });

    // In-memory tree assembly — no recursive Prisma include
    type CommentNode = (typeof flat)[number] & { replies: CommentNode[] };
    const map = new Map<string, CommentNode>(
      flat.map((c) => [c.id, { ...c, replies: [] }]),
    );

    const roots: CommentNode[] = [];
    for (const node of map.values()) {
      if (node.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.replies.push(node);
        } else {
          roots.push(node);
        }
      }
    }

    return roots;
  }

  async update(
    slug: string,
    id: string,
    dto: UpdateCommentDto,
    requesterId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const comment = await this.prisma.comment.findFirst({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // OWNER-ONLY CHECK: Admin role does NOT bypass — only the comment's author may edit
    if (comment.authorId !== requesterId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async remove(slug: string, id: string, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const comment = await this.prisma.comment.findFirst({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: requesterId, workspaceId: workspace.id },
      },
      select: { role: true },
    });

    const isOwner = comment.authorId === requesterId;
    const isAdmin = membership?.role === 'Admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    if (isAdmin && !isOwner) {
      // Hard-delete: Admin removing someone else's comment
      return this.prisma.comment.delete({ where: { id } });
    }

    // Soft-delete: owner deletes their own comment
    return this.prisma.comment.update({
      where: { id },
      data: { content: '[deleted]', deletedAt: new Date() },
    });
  }
}
