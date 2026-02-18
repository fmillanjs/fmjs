import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreatePostDto, authorId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const post = await this.prisma.post.create({
      data: { ...dto, authorId, workspaceId: workspace.id, status: 'Draft' },
    });

    await this.prisma.activityEvent.create({
      data: {
        type: 'PostCreated',
        workspaceId: workspace.id,
        actorId: authorId,
        entityId: post.id,
        entityType: 'Post',
      },
    });

    return post;
  }

  async findAll(slug: string, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Authors see their own drafts; others see only Published
    return this.prisma.post.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [{ status: 'Published' }, { authorId: requesterId }],
      },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async findOne(slug: string, id: string, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const post = await this.prisma.post.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
        OR: [{ status: 'Published' }, { authorId: requesterId }],
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        reactions: { select: { id: true, emoji: true, userId: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found or not accessible');
    return post;
  }

  async update(slug: string, id: string, dto: UpdatePostDto, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const post = await this.prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!post) throw new NotFoundException('Post not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
      select: { role: true },
    });
    if (post.authorId !== requesterId && membership?.role !== 'Admin') {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updated = await this.prisma.post.update({ where: { id }, data: dto });

    await this.prisma.activityEvent.create({
      data: {
        type: 'PostUpdated',
        workspaceId: workspace.id,
        actorId: requesterId,
        entityId: id,
        entityType: 'Post',
      },
    });

    return updated;
  }

  async setStatus(slug: string, id: string, status: 'Draft' | 'Published', requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const post = await this.prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!post) throw new NotFoundException('Post not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
      select: { role: true },
    });
    if (post.authorId !== requesterId && membership?.role !== 'Admin') {
      throw new ForbiddenException('You can only change status of your own posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'Published' ? new Date() : null,
      },
    });
  }

  async remove(slug: string, id: string, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const post = await this.prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!post) throw new NotFoundException('Post not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
      select: { role: true },
    });
    if (post.authorId !== requesterId && membership?.role !== 'Admin') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    return this.prisma.post.delete({ where: { id } });
  }
}
