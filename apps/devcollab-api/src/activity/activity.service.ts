import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';

const PAGE_SIZE = 20;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findFeed(slug: string, cursor?: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const events = await this.prisma.activityEvent.findMany({
      where: {
        workspaceId: workspace.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    const lastEvent = events[events.length - 1];
    const nextCursor =
      events.length === PAGE_SIZE && lastEvent
        ? lastEvent.createdAt.toISOString()
        : null;

    return { events, nextCursor, workspaceSlug: workspace.slug };
  }
}
