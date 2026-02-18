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

    return this.prisma.post.create({
      data: { ...dto, authorId, workspaceId: workspace.id, status: 'Draft' },
    });
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
      include: { author: { select: { id: true, name: true, email: true } } },
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

    return this.prisma.post.update({ where: { id }, data: dto });
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
