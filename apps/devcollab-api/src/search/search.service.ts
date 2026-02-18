import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@devcollab/database';
import { PrismaService } from '../core/database/prisma.service';

type PostSearchResult = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  authorId: string;
  workspaceId: string;
  headline: string;
};

type SnippetSearchResult = {
  id: string;
  title: string;
  language: string;
  createdAt: Date;
  authorId: string;
  workspaceId: string;
  headline: string;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(slug: string, rawQuery: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Sanitize user input: strip tsquery special chars that cause syntax errors
    const clean = rawQuery
      .trim()
      .replace(/[|&!<>()'":]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Guard: empty query returns empty results (to_tsquery('') throws a Postgres error)
    if (!clean) return { posts: [], snippets: [] };

    // Build prefix tsquery: "react hooks" -> "react:* & hooks:*"
    const term = clean
      .split(' ')
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(' & ');

    const workspaceId = workspace.id;

    const [posts, snippets] = await Promise.all([
      this.prisma.$queryRaw<PostSearchResult[]>(Prisma.sql`
        SELECT
          p.id,
          p.title,
          p.status,
          p."createdAt",
          p."authorId",
          p."workspaceId",
          ts_headline(
            'english',
            p.title || ' ' || p.content,
            to_tsquery('english', ${term}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5, MaxFragments=2'
          ) AS headline
        FROM "Post" p
        WHERE p."workspaceId" = ${workspaceId}
          AND p."searchVector" @@ to_tsquery('english', ${term})
          AND (p.status = 'Published' OR p."authorId" = ${userId})
        ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${term})) DESC
        LIMIT 10
      `),
      this.prisma.$queryRaw<SnippetSearchResult[]>(Prisma.sql`
        SELECT
          s.id,
          s.title,
          s.language,
          s."createdAt",
          s."authorId",
          s."workspaceId",
          ts_headline(
            'english',
            s.title || ' ' || s.code,
            to_tsquery('english', ${term}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10, MaxFragments=2'
          ) AS headline
        FROM "Snippet" s
        WHERE s."workspaceId" = ${workspaceId}
          AND s."searchVector" @@ to_tsquery('english', ${term})
        ORDER BY ts_rank(s."searchVector", to_tsquery('english', ${term})) DESC
        LIMIT 10
      `),
    ]);

    return { posts, snippets };
  }
}
