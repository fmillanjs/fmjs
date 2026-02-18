import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';

@Injectable()
export class SnippetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreateSnippetDto, authorId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    return this.prisma.snippet.create({
      data: { ...dto, authorId, workspaceId: workspace.id },
    });
  }

  async findAll(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    return this.prisma.snippet.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async findOne(slug: string, id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const snippet = await this.prisma.snippet.findFirst({
      where: { id, workspaceId: workspace.id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!snippet) throw new NotFoundException('Snippet not found');
    return snippet;
  }

  async update(slug: string, id: string, dto: UpdateSnippetDto, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const snippet = await this.prisma.snippet.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!snippet) throw new NotFoundException('Snippet not found');

    // Owner-only check: Admins bypass (guard granted manage:all), Contributors must own
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
      select: { role: true },
    });
    if (snippet.authorId !== requesterId && membership?.role !== 'Admin') {
      throw new ForbiddenException('You can only edit your own snippets');
    }

    return this.prisma.snippet.update({ where: { id }, data: dto });
  }

  async remove(slug: string, id: string, requesterId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const snippet = await this.prisma.snippet.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!snippet) throw new NotFoundException('Snippet not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
      select: { role: true },
    });
    if (snippet.authorId !== requesterId && membership?.role !== 'Admin') {
      throw new ForbiddenException('You can only delete your own snippets');
    }

    return this.prisma.snippet.delete({ where: { id } });
  }
}
