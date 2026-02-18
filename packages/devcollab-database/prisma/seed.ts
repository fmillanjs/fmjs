import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { prisma } from '../src/client';

async function main() {
  faker.seed(42); // MUST be first — sets deterministic PRNG state

  // Idempotency guard: if admin user exists, seed already ran
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@demo.devcollab' },
  });
  if (existing) {
    console.log('Seed already applied — skipping');
    return;
  }

  const password = await bcrypt.hash('Demo1234!', 12);

  // Create 3 users with fixed emails
  const admin = await prisma.user.create({
    data: { email: 'admin@demo.devcollab', name: 'Alex Admin', password },
  });
  const contributor = await prisma.user.create({
    data: { email: 'contributor@demo.devcollab', name: 'Casey Contributor', password },
  });
  const viewer = await prisma.user.create({
    data: { email: 'viewer@demo.devcollab', name: 'Victor Viewer', password },
  });

  // Create workspace with all three members
  const workspace = await prisma.workspace.create({
    data: {
      name: 'DevCollab Demo',
      slug: 'devcollab-demo',
      members: {
        create: [
          { userId: admin.id, role: 'Admin' },
          { userId: contributor.id, role: 'Contributor' },
          { userId: viewer.id, role: 'Viewer' },
        ],
      },
    },
  });

  // MemberJoined activity events for all three members
  for (const [userId] of [
    [admin.id],
    [contributor.id],
    [viewer.id],
  ]) {
    await prisma.activityEvent.create({
      data: {
        type: 'MemberJoined',
        workspaceId: workspace.id,
        actorId: userId as string,
        entityId: userId as string,
        entityType: 'User',
      },
    });
  }

  // Create 5 snippets with varied languages
  const LANGUAGES = ['typescript', 'python', 'rust', 'go', 'sql'];
  const SNIPPET_TITLES = [
    'Auth middleware pattern',
    'Fibonacci with memoization',
    'Async channel pattern',
    'HTTP server with graceful shutdown',
    'Workspace members query',
  ];
  const SNIPPET_CODE = [
    `// JWT middleware\nexport function requireAuth(req: Request, res: Response, next: NextFunction) {\n  const token = req.cookies['token'];\n  if (!token) return res.status(401).json({ message: 'Unauthorized' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET!);\n    next();\n  } catch {\n    res.status(401).json({ message: 'Invalid token' });\n  }\n}`,
    `def fib(n: int, memo: dict = {}) -> int:\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)\n    return memo[n]`,
    `use tokio::sync::mpsc;\n\n#[tokio::main]\nasync fn main() {\n    let (tx, mut rx) = mpsc::channel::<String>(32);\n    tokio::spawn(async move {\n        while let Some(msg) = rx.recv().await {\n            println!("received: {msg}");\n        }\n    });\n    tx.send("hello".to_string()).await.unwrap();\n}`,
    `package main\n\nimport (\n\t"context"\n\t"log"\n\t"net/http"\n\t"os/signal"\n)\n\nfunc main() {\n\tctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)\n\tdefer stop()\n\tsrv := &http.Server{Addr: ":8080"}\n\tgo srv.ListenAndServe()\n\t<-ctx.Done()\n\tsrv.Shutdown(context.Background())\n\tlog.Println("server stopped")\n}`,
    `SELECT u.name, wm.role, w.name AS workspace\nFROM workspace_members wm\nJOIN users u ON u.id = wm."userId"\nJOIN workspaces w ON w.id = wm."workspaceId"\nWHERE w.slug = 'devcollab-demo'\nORDER BY wm.role;`,
  ];

  for (let i = 0; i < 5; i++) {
    const authorId = i % 2 === 0 ? admin.id : contributor.id;
    const snippet = await prisma.snippet.create({
      data: {
        title: SNIPPET_TITLES[i],
        language: LANGUAGES[i],
        code: SNIPPET_CODE[i],
        authorId,
        workspaceId: workspace.id,
      },
    });
    await prisma.activityEvent.create({
      data: {
        type: 'SnippetCreated',
        workspaceId: workspace.id,
        actorId: authorId,
        entityId: snippet.id,
        entityType: 'Snippet',
      },
    });
  }

  // Create 3 published posts with comments including @mentions and reactions
  const POST_TITLES = [
    'Architecture Decision Record: Why We Chose Postgres tsvector',
    'Onboarding Guide for New Contributors',
    'Weekly Engineering Update — February 2026',
  ];
  const POST_CONTENT = [
    `# Architecture Decision Record: Why We Chose Postgres tsvector\n\n## Context\n\nDevCollab needed full-text search across snippets and posts. We evaluated Meilisearch, Elasticsearch, and Postgres tsvector.\n\n## Decision\n\nWe chose **Postgres tsvector** with GIN indexes and a trigger-based update pattern.\n\n## Rationale\n\n- Zero additional infrastructure: no extra Docker service, no managed service cost\n- Adequate performance at portfolio scale (< 10k documents)\n- The trigger pattern eliminates migration drift — a common pitfall with GENERATED ALWAYS AS columns in Prisma\n- ts_headline() provides highlighted search results out of the box\n\n## Consequences\n\nSearch quality is good for exact and prefix matches. Fuzzy matching requires pg_trgm (deferred). The GIN index lives in manual migration SQL, not in the Prisma schema, preventing index recreation on every migrate dev run.`,
    `# Onboarding Guide for New Contributors\n\nWelcome to DevCollab! This guide will get you up and running in under 30 minutes.\n\n## Prerequisites\n\n- Docker and Docker Compose v2\n- Node.js 20+\n- An understanding of TypeScript and React\n\n## Quick Start\n\n\`\`\`bash\ngit clone https://github.com/fernandomillan/devcollab\ncd devcollab\ndocker compose up\n\`\`\`\n\nThe seed script runs automatically on first launch. Log in with:\n- **Admin**: admin@demo.devcollab / Demo1234!\n- **Contributor**: contributor@demo.devcollab / Demo1234!\n- **Viewer**: viewer@demo.devcollab / Demo1234!\n\n## Architecture Overview\n\nDevCollab is a Turborepo monorepo with two apps: devcollab-web (Next.js 15, port 3002) and devcollab-api (NestJS 11, port 3003). The shared database package lives in packages/devcollab-database.`,
    `# Weekly Engineering Update — February 2026\n\nHere's what shipped this week across the DevCollab codebase.\n\n## Shipped\n\n- **Full-Text Search** (Phase 20): Cmd+K modal with debounced tsvector search, ts_headline() amber highlights, grouped results by type. Zero migration drift — verified with prisma migrate dev x3 ritual.\n- **Notifications** (Phase 19): @mention notifications with bell icon + unread badge. 60s polling. Cursor-paginated activity feed with 30s refresh.\n- **Reactions** (Phase 18): Emoji reactions on posts and snippets. toggleReaction idempotency with P2002 race condition guard.\n\n## Next Up\n\nPhase 21: Seed data + portfolio integration. Realistic demo workspace content. DevCollab card + case study on the portfolio site.\n\n## Notes\n\nThe tsvector trigger pattern (not GENERATED ALWAYS AS) is now the project standard for any future search fields. See the Phase 20 ADR for full context.`,
  ];

  for (let i = 0; i < 3; i++) {
    const authorId = i === 0 ? admin.id : contributor.id;
    const daysAgo = 3 - i;
    const post = await prisma.post.create({
      data: {
        title: POST_TITLES[i],
        content: POST_CONTENT[i],
        status: 'Published',
        publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        authorId,
        workspaceId: workspace.id,
      },
    });

    await prisma.activityEvent.create({
      data: {
        type: 'PostCreated',
        workspaceId: workspace.id,
        actorId: authorId,
        entityId: post.id,
        entityType: 'Post',
      },
    });

    // Comment with @mention (admin mentions contributor)
    const comment = await prisma.comment.create({
      data: {
        content: `@Casey Contributor great post! ${faker.lorem.sentence()}`,
        authorId: admin.id,
        postId: post.id,
      },
    });

    // Notification for @mention
    await prisma.notification.create({
      data: {
        type: 'mention',
        recipientId: contributor.id,
        actorId: admin.id,
        commentId: comment.id,
        workspaceId: workspace.id,
        read: false,
      },
    });

    // Viewer replies to the comment
    await prisma.comment.create({
      data: {
        content: `${faker.lorem.sentence()} +1 from me.`,
        authorId: viewer.id,
        postId: post.id,
        parentId: comment.id,
      },
    });

    // Reaction on the post
    await prisma.reaction.create({
      data: {
        emoji: i === 0 ? 'heart' : i === 1 ? 'thumbs_up' : 'plus_one',
        userId: contributor.id,
        postId: post.id,
      },
    });
  }

  console.log('Seed complete — DevCollab demo workspace ready');
  console.log('  Workspace URL: /w/devcollab-demo');
  console.log('  Admin:       admin@demo.devcollab / Demo1234!');
  console.log('  Contributor: contributor@demo.devcollab / Demo1234!');
  console.log('  Viewer:      viewer@demo.devcollab / Demo1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
