// Run with: docker exec -i <devcollab-api-container> node < scripts/seed-devcollab-live.js
// No tsx, no faker, no new containers needed. Uses bcrypt + Prisma already in the image.

const { PrismaClient } = require('/app/node_modules/.prisma/devcollab-client');
const bcrypt = require('/app/node_modules/bcrypt');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@demo.devcollab' } });
  if (existing) { console.log('Already seeded — skipping'); return; }

  const password = await bcrypt.hash('Demo1234!', 12);

  const admin       = await prisma.user.create({ data: { email: 'admin@demo.devcollab',       name: 'Alex Admin',        password } });
  const contributor = await prisma.user.create({ data: { email: 'contributor@demo.devcollab', name: 'Casey Contributor', password } });
  const viewer      = await prisma.user.create({ data: { email: 'viewer@demo.devcollab',      name: 'Victor Viewer',     password } });

  console.log('Users created');

  const workspace = await prisma.workspace.create({
    data: {
      name: 'DevCollab Demo',
      slug: 'devcollab-demo',
      members: {
        create: [
          { userId: admin.id,       role: 'Admin' },
          { userId: contributor.id, role: 'Contributor' },
          { userId: viewer.id,      role: 'Viewer' },
        ],
      },
    },
  });

  console.log('Workspace created');

  for (const userId of [admin.id, contributor.id, viewer.id]) {
    await prisma.activityEvent.create({
      data: { type: 'MemberJoined', workspaceId: workspace.id, actorId: userId, entityId: userId, entityType: 'User' },
    });
  }

  const SNIPPETS = [
    {
      title: 'Auth middleware pattern',
      language: 'typescript',
      code: `// JWT middleware
export function requireAuth(req, res, next) {
  const token = req.cookies['token'];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Invalid token' }); }
}`,
    },
    {
      title: 'Fibonacci with memoization',
      language: 'python',
      code: `def fib(n, memo={}):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]`,
    },
    {
      title: 'Async channel pattern',
      language: 'rust',
      code: `use tokio::sync::mpsc;
#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<String>(32);
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await { println!("{msg}"); }
    });
    tx.send("hello".to_string()).await.unwrap();
}`,
    },
    {
      title: 'HTTP server with graceful shutdown',
      language: 'go',
      code: `package main
import ("context"; "log"; "net/http"; "os/signal")
func main() {
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
    defer stop()
    srv := &http.Server{Addr: ":8080"}
    go srv.ListenAndServe()
    <-ctx.Done()
    srv.Shutdown(context.Background())
    log.Println("stopped")
}`,
    },
    {
      title: 'Workspace members query',
      language: 'sql',
      code: `SELECT u.name, wm.role, w.name AS workspace
FROM workspace_members wm
JOIN users u ON u.id = wm."userId"
JOIN workspaces w ON w.id = wm."workspaceId"
WHERE w.slug = 'devcollab-demo'
ORDER BY wm.role;`,
    },
  ];

  for (let i = 0; i < SNIPPETS.length; i++) {
    const authorId = i % 2 === 0 ? admin.id : contributor.id;
    const snippet = await prisma.snippet.create({
      data: { ...SNIPPETS[i], authorId, workspaceId: workspace.id },
    });
    await prisma.activityEvent.create({
      data: { type: 'SnippetCreated', workspaceId: workspace.id, actorId: authorId, entityId: snippet.id, entityType: 'Snippet' },
    });
  }

  console.log('Snippets created');

  const POSTS = [
    {
      title: 'Architecture Decision Record: Why We Chose Postgres tsvector',
      content: `# ADR: Postgres tsvector

## Context

DevCollab needed full-text search across snippets and posts. We evaluated Meilisearch, Elasticsearch, and Postgres tsvector.

## Decision

We chose **Postgres tsvector** with GIN indexes and a trigger-based update pattern.

## Rationale

- Zero additional infrastructure: no extra Docker service, no managed service cost
- Adequate performance at portfolio scale (< 10k documents)
- The trigger pattern eliminates migration drift
- ts_headline() provides highlighted search results out of the box`,
    },
    {
      title: 'Onboarding Guide for New Contributors',
      content: `# Onboarding Guide for New Contributors

Welcome to DevCollab! This guide will get you up and running in under 30 minutes.

## Prerequisites

- Docker and Docker Compose v2
- Node.js 20+

## Quick Start

\`\`\`bash
git clone https://github.com/fernandomillan/devcollab
cd devcollab
docker compose up
\`\`\`

Log in with:
- **Admin**: admin@demo.devcollab / Demo1234!
- **Contributor**: contributor@demo.devcollab / Demo1234!
- **Viewer**: viewer@demo.devcollab / Demo1234!`,
    },
    {
      title: 'Weekly Engineering Update — February 2026',
      content: `# Weekly Engineering Update — February 2026

## Shipped

- **Full-Text Search**: Cmd+K modal with debounced tsvector search and ts_headline() highlights
- **Notifications**: @mention notifications with bell icon + unread badge
- **Reactions**: Emoji reactions on posts and snippets with idempotency guard

## Next Up

Seed data + portfolio integration. Realistic demo workspace content.`,
    },
  ];

  const COMMENTS = [
    '@Casey Contributor great post! Really clear rationale here.',
    '@Casey Contributor this is exactly what I needed, thanks.',
    '@Casey Contributor solid update. Looking forward to the next phase.',
  ];

  const REPLY = [
    'Agreed, very useful reference.',
    'Same here, bookmarked.',
    'Thanks for the summary.',
  ];

  for (let i = 0; i < POSTS.length; i++) {
    const authorId = i === 0 ? admin.id : contributor.id;
    const post = await prisma.post.create({
      data: {
        ...POSTS[i],
        status: 'Published',
        publishedAt: new Date(Date.now() - (3 - i) * 86400000),
        authorId,
        workspaceId: workspace.id,
      },
    });
    await prisma.activityEvent.create({
      data: { type: 'PostCreated', workspaceId: workspace.id, actorId: authorId, entityId: post.id, entityType: 'Post' },
    });

    const comment = await prisma.comment.create({
      data: { content: COMMENTS[i], authorId: admin.id, postId: post.id },
    });
    await prisma.notification.create({
      data: { type: 'mention', recipientId: contributor.id, actorId: admin.id, commentId: comment.id, workspaceId: workspace.id, read: false },
    });
    await prisma.comment.create({
      data: { content: REPLY[i], authorId: viewer.id, postId: post.id, parentId: comment.id },
    });
    await prisma.reaction.create({
      data: { emoji: i === 0 ? 'heart' : i === 1 ? 'thumbs_up' : 'plus_one', userId: contributor.id, postId: post.id },
    });
  }

  console.log('Posts, comments, reactions created');
  console.log('');
  console.log('Seed complete — DevCollab demo workspace ready');
  console.log('  Workspace: /w/devcollab-demo');
  console.log('  Admin:       admin@demo.devcollab / Demo1234!');
  console.log('  Contributor: contributor@demo.devcollab / Demo1234!');
  console.log('  Viewer:      viewer@demo.devcollab / Demo1234!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
