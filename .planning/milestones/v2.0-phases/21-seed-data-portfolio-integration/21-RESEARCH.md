# Phase 21: Seed Data + Portfolio Integration - Research

**Researched:** 2026-02-18
**Domain:** Prisma seed scripting, @faker-js/faker, Next.js portfolio pages
**Confidence:** HIGH

---

## Summary

Phase 21 has two completely independent workstreams: (1) a deterministic seed script for the DevCollab demo workspace, and (2) adding a DevCollab project card + case study to the existing portfolio site. Neither requires new libraries beyond what is already installed.

The seed script lives in `packages/devcollab-database/prisma/seed.ts` and runs as a standalone Node/ts-node script. It imports the already-generated Prisma client directly (`@devcollab/database`) and `@faker-js/faker` (v10.3.0, already installed in node_modules). Idempotency is achieved by seeding with a fixed unique identifier (`email === 'admin@demo.devcollab'`) as the existence check — if the record exists, the script exits early.

The portfolio integration is additive: add a `DevCollab` card to `/apps/web/app/(portfolio)/projects/page.tsx`, create a new route at `/apps/web/app/(portfolio)/projects/devcollab/page.tsx` modeled exactly on the existing TeamFlow case study page, and add the DevCollab card to the homepage `page.tsx` Featured Projects section. The `ProjectCard` component and `CaseStudySection` component already exist and require no changes.

**Primary recommendation:** Write a single `packages/devcollab-database/prisma/seed.ts` file that creates all data in one transaction using `upsert` / `skipDuplicates` idioms and fixed faker seed, then add it to the `devcollab-database` package.json as `"seed": "ts-node --project tsconfig.json prisma/seed.ts"`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORT-01 | DevCollab project card on portfolio homepage | ProjectCard component exists; `/projects/page.tsx` pattern exists — add second card to grid |
| PORT-02 | Case study page at `/projects/devcollab` | TeamFlow case study at `/projects/teamflow/page.tsx` is the exact template — copy and adapt |
| PORT-03 | Portfolio links to DevCollab live demo | Live demo URL is `http://localhost:3002` locally; production URL to be set via env var or hardcoded once deployment target is known; use `NEXT_PUBLIC_DEVCOLLAB_URL` or hardcode placeholder |
| SEED-01 | Demo workspace on first launch with realistic content, deterministic faker seed | `@faker-js/faker` v10.3.0 already installed; `faker.seed(42)` produces identical output across runs; upsert by unique email is the idempotency guard |
| SEED-02 | Three roles demonstrated (Admin, Contributor, Viewer) | Schema has `WorkspaceRole` enum: `Admin`, `Contributor`, `Viewer`; `WorkspaceMember.role` field |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@faker-js/faker` | 10.3.0 (already installed) | Realistic names, words, code-like text | Already in node_modules; `faker.seed(N)` guarantees deterministic output |
| `@devcollab/database` | local package | Prisma client access | Already the import pattern used by devcollab-api |
| `bcrypt` | ^6.0.0 (already installed in devcollab-api) | Hash demo user passwords | Same library AuthService uses |
| `ts-node` | available in node_modules | Run seed.ts without build step | Standard Prisma seed runner |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | available (check node_modules) | Faster ts-node alternative | If ts-node has module resolution issues with the devcollab tsconfig |

**Installation:** No new packages needed. `@faker-js/faker` is already at `/home/doctor/fernandomillan/node_modules/@faker-js/faker` (v10.3.0).

---

## Architecture Patterns

### Recommended Project Structure

```
packages/devcollab-database/
├── prisma/
│   ├── schema.prisma          (existing)
│   ├── migrations/            (existing)
│   └── seed.ts                (NEW — created in this phase)
└── package.json               (add seed script entry)

apps/web/app/(portfolio)/
├── page.tsx                   (EDIT — add DevCollab card alongside TeamFlow)
├── projects/
│   ├── page.tsx               (EDIT — add DevCollab ProjectCard)
│   └── devcollab/
│       └── page.tsx           (NEW — case study)
```

### Pattern 1: Idempotent Seed with upsert + skipDuplicates

**What:** Check if demo workspace already exists before creating anything. Use `prisma.user.upsert` for users (by email) and `createMany({ skipDuplicates: true })` for content where possible.

**When to use:** Always — prevents duplicate entries on re-run (SEED-01 requirement).

**Example:**
```typescript
// Source: Prisma docs — upsert pattern
import { prisma } from '../src/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

faker.seed(42); // CRITICAL: fixed seed = deterministic output

async function main() {
  // Idempotency guard: if admin user exists, seed already ran
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@demo.devcollab' },
  });
  if (existing) {
    console.log('Seed already applied — skipping');
    return;
  }

  const password = await bcrypt.hash('Demo1234!', 12);

  // Create 3 users with fixed emails (deterministic)
  const admin = await prisma.user.create({
    data: { email: 'admin@demo.devcollab', name: 'Alex Admin', password },
  });
  const contributor = await prisma.user.create({
    data: { email: 'contributor@demo.devcollab', name: 'Casey Contributor', password },
  });
  const viewer = await prisma.user.create({
    data: { email: 'viewer@demo.devcollab', name: 'Victor Viewer', password },
  });

  // Create workspace
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

  // Create snippets (5+) with varied languages
  const LANGUAGES = ['typescript', 'python', 'rust', 'go', 'sql'];
  for (let i = 0; i < 5; i++) {
    const snippet = await prisma.snippet.create({
      data: {
        title: faker.hacker.phrase(),
        language: LANGUAGES[i % LANGUAGES.length],
        code: faker.lorem.paragraphs(2),
        authorId: [admin.id, contributor.id][i % 2],
        workspaceId: workspace.id,
      },
    });
    await prisma.activityEvent.create({
      data: {
        type: 'SnippetCreated',
        workspaceId: workspace.id,
        actorId: [admin.id, contributor.id][i % 2],
        entityId: snippet.id,
        entityType: 'Snippet',
      },
    });
  }

  // Create 3+ published posts with discussions including @mentions
  const POST_TITLES = [
    'Architecture Decision Record: Why We Chose tsvector',
    'Onboarding Guide for New Contributors',
    'Weekly Engineering Update',
  ];
  for (let i = 0; i < 3; i++) {
    const authorId = i === 0 ? admin.id : contributor.id;
    const post = await prisma.post.create({
      data: {
        title: POST_TITLES[i],
        content: `# ${POST_TITLES[i]}\n\n${faker.lorem.paragraphs(3)}`,
        status: 'Published',
        publishedAt: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000),
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
    // Add comment with @mention
    const comment = await prisma.comment.create({
      data: {
        content: `@"Casey Contributor" great post! ${faker.lorem.sentence()}`,
        authorId: admin.id,
        postId: post.id,
      },
    });
    // Create mention notification
    await prisma.notification.create({
      data: {
        type: 'mention',
        recipientId: contributor.id,
        actorId: admin.id,
        commentId: comment.id,
        workspaceId: workspace.id,
      },
    });
    // Add reaction on post
    await prisma.reaction.create({
      data: {
        emoji: 'heart',
        userId: contributor.id,
        postId: post.id,
      },
    });
  }

  // MemberJoined activity events for all three members
  for (const [userId, role] of [[admin.id, 'Admin'], [contributor.id, 'Contributor'], [viewer.id, 'Viewer']]) {
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

  console.log('Seed complete — DevCollab demo workspace ready');
  console.log('  Admin: admin@demo.devcollab / Demo1234!');
  console.log('  Contributor: contributor@demo.devcollab / Demo1234!');
  console.log('  Viewer: viewer@demo.devcollab / Demo1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Pattern 2: Seed Script Registration in package.json

**What:** Prisma looks for a `prisma.seed` entry in package.json to know what to run on `prisma db seed`.

**Example:**
```json
// packages/devcollab-database/package.json — add to "scripts" and "prisma" sections
{
  "scripts": {
    "seed": "ts-node --project tsconfig.json prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node --project tsconfig.json prisma/seed.ts"
  }
}
```

**Alternative:** If ts-node has resolution issues due to Turborepo module paths, use `npx tsx` instead: `"seed": "tsx prisma/seed.ts"`.

### Pattern 3: DevCollab Case Study Page (Portfolio)

**What:** Copy the TeamFlow case study structure exactly. The `CaseStudySection` component takes `title` and `children`. The back link, header, button layout, and section structure are all reusable as-is.

**Key difference from TeamFlow:** DevCollab live demo link points to the running devcollab-web instance. For recruiters, this is a full external URL (e.g., `https://devcollab.fernandomillan.dev`). Since deployment is deferred, use a placeholder that can be updated. A `NEXT_PUBLIC_DEVCOLLAB_URL` env var is cleaner than a hardcoded string.

**Demo workspace slug:** The seed creates `devcollab-demo`. Deep link to demo workspace: `${DEVCOLLAB_URL}/w/devcollab-demo`.

### Pattern 4: Portfolio Homepage Second Project Card

**What:** The homepage currently has one Featured Project section showing only TeamFlow. The requirement (PORT-01) adds DevCollab as a second card on the homepage. The current layout is a `max-w-4xl mx-auto` single-card layout — changing it to `grid grid-cols-1 md:grid-cols-2` with two cards is the correct approach.

The `/projects/page.tsx` already uses a `grid gap-6 md:grid-cols-2` layout with `ProjectCard` — just add a second `ProjectCard` for DevCollab.

### Anti-Patterns to Avoid

- **Calling API endpoints in seed script:** Don't use HTTP calls to devcollab-api to seed. Import `@devcollab/database` prisma client directly — no NestJS dependency injection needed.
- **Using `faker.date.recent()` for `publishedAt`:** This produces non-deterministic output (depends on current time). Use fixed offsets from a known base date: `new Date(Date.now() - N * 86400000)`. Wait — actually faker.seed() makes faker.date.recent() deterministic too. But using `Date.now()` minus offsets is cleaner and keeps dates meaningful relative to when run.
- **Not disconnecting prisma:** Always call `prisma.$disconnect()` in the finally block.
- **Creating seed as a NestJS module:** Seed does not need NestJS. A standalone ts-node script imports the prisma client directly and runs faster.
- **Purple in portfolio UI:** No purple anywhere in new components — use existing design tokens only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realistic text content | Custom lorem ipsum | `faker.hacker.phrase()`, `faker.lorem.paragraphs()` | Already installed; deterministic with seed |
| Password hashing | Custom hash | `bcrypt.hash(password, 12)` | Same library as AuthService, rounds match |
| Duplicate detection | Complex diffing | Simple `findUnique` by unique email field + early return | Prisma unique constraints are the source of truth |
| Idempotent creates | Custom upsert logic | `createMany({ skipDuplicates: true })` for bulk, `upsert` for individual | Prisma built-ins handle race conditions |

**Key insight:** The seed script is a throwaway admin tool, not production code. Simplicity beats elegance — a linear imperative script with `findUnique` guard is more debuggable than clever upsert abstractions.

---

## Common Pitfalls

### Pitfall 1: Notification Unique Constraint Violation
**What goes wrong:** `prisma.notification.createMany` fails with P2002 if the seed runs and a notification with same `(recipientId, actorId, commentId, type)` already exists. The schema has `@@unique([recipientId, actorId, commentId, type])`.
**Why it happens:** Seed uses deterministic IDs indirectly (same emails → same users found on re-run), but re-run is blocked by the early-exit idempotency guard, so this only occurs if the guard fails.
**How to avoid:** The `findUnique` idempotency guard (check `admin@demo.devcollab` user exists) makes all subsequent creates unreachable on re-run. Belt-and-suspenders: use `skipDuplicates: true` on notification createMany too.

### Pitfall 2: faker.seed() Must Be Called Before Any faker Usage
**What goes wrong:** If any faker call happens before `faker.seed(42)`, the sequence is offset and determinism breaks.
**Why it happens:** faker's internal PRNG state is seeded once. Any call before `seed()` consumes state.
**How to avoid:** Call `faker.seed(42)` as the very first line of `main()` before any faker calls.

### Pitfall 3: bcrypt hoisting — VERIFIED SAFE
**What goes wrong (hypothetical):** `import * as bcrypt from 'bcrypt'` in seed.ts fails because bcrypt is not a dependency of `packages/devcollab-database`.
**Actual status:** bcrypt IS hoisted to `/home/doctor/fernandomillan/node_modules/bcrypt` by npm workspaces. `import * as bcrypt from 'bcrypt'` in seed.ts will resolve correctly.
**How to avoid:** Nothing to avoid — import works. If hoisting ever breaks, fall back to a pre-computed hash constant or add bcrypt to devDependencies of the database package.

### Pitfall 4: ts-node Resolution in Turborepo
**What goes wrong:** `ts-node prisma/seed.ts` fails with module not found for `@devcollab/database` because Turborepo workspace resolution doesn't apply to ts-node child processes.
**Why it happens:** ts-node resolves modules from the tsconfig's `paths` but the package is referenced by workspace name.
**How to avoid:** Run the seed command from the monorepo root with `npx --prefix packages/devcollab-database ts-node prisma/seed.ts` OR use relative import in seed.ts: `import { prisma } from '../src/client'` (bypasses workspace alias). Verify with a dry-run before the plan assumes a specific invocation.

### Pitfall 5: Portfolio Live Demo URL Is Unknown Until Deployment
**What goes wrong:** Case study page hardcodes `http://localhost:3002` as the live demo link, which is useless for recruiters.
**Why it happens:** Deployment (Coolify) is deferred to after Phase 21.
**How to avoid:** Use `NEXT_PUBLIC_DEVCOLLAB_URL` env var with fallback `http://localhost:3002`. The plan notes this is a placeholder — update after Phase 22 (deployment) sets the real URL.

### Pitfall 6: Reaction Unique Constraint
**What goes wrong:** Re-running seed (if guard bypassed) creates duplicate reactions, failing `@@unique([userId, emoji, postId])`.
**Why it happens:** `prisma.reaction.create` has no skipDuplicates.
**How to avoid:** Use `prisma.reaction.upsert` with `where: { userId_emoji_postId: {...} }`, or rely on the early-exit guard.

### Pitfall 7: WorkspaceMember Activity Event entityType for User
**What goes wrong:** `MemberJoined` ActivityEvent uses `entityType: 'User'` but the schema defines `ActivityEventType` enum as `MemberJoined | PostCreated | PostUpdated | SnippetCreated | SnippetUpdated`. The `entityType` field is a plain `String`, not an enum — so any string is valid.
**Why it happens:** Easy to confuse the `type` (enum) with `entityType` (string). The `type` must be a valid `ActivityEventType` enum value.
**How to avoid:** Use `type: 'MemberJoined'` (valid enum) and `entityType: 'User'` (valid string).

---

## Code Examples

Verified patterns from codebase inspection:

### How ActivityEvent is created (from snippets.service.ts)
```typescript
// Source: apps/devcollab-api/src/snippets/snippets.service.ts
await this.prisma.activityEvent.create({
  data: {
    type: 'SnippetCreated',         // ActivityEventType enum
    workspaceId: workspace.id,
    actorId: authorId,
    entityId: snippet.id,
    entityType: 'Snippet',          // plain string
  },
});
```

### How Notification is created (from comments.service.ts)
```typescript
// Source: apps/devcollab-api/src/comments/comments.service.ts
await this.prisma.notification.createMany({
  data: recipients.map((recipientId) => ({
    recipientId,
    actorId: authorId,
    type: 'mention',
    commentId,
    workspaceId,
    read: false,
  })),
  skipDuplicates: true,
});
```

### Valid emoji values (from reactions DTO)
```typescript
// Source: apps/devcollab-api/src/reactions/dto/toggle-reaction.dto.ts
emoji!: string; // 'thumbs_up' | 'heart' | 'plus_one' | 'laugh'
```

### WorkspaceMember role creation (from workspaces.service.ts)
```typescript
// Source: apps/devcollab-api/src/workspaces/workspaces.service.ts
members: {
  create: {
    userId: creatorId,
    role: 'Admin',  // WorkspaceRole: 'Admin' | 'Contributor' | 'Viewer'
  },
},
```

### How portfolio ProjectCard is used (from apps/web/app/(portfolio)/projects/page.tsx)
```tsx
// Source: apps/web/app/(portfolio)/projects/page.tsx
<ProjectCard
  title="TeamFlow"
  description="A production-ready work management SaaS with real-time collaboration"
  techStack={['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSocket']}
  href="/projects/teamflow"
  featured
/>
```

### How CaseStudySection is used (from apps/web/app/(portfolio)/projects/teamflow/page.tsx)
```tsx
// Source: apps/web/app/(portfolio)/projects/teamflow/page.tsx
<CaseStudySection title="Overview">
  <p>...</p>
</CaseStudySection>

<CaseStudySection title="Architecture">
  <div className="bg-muted border border-border rounded-lg p-6 my-6">
    <div className="font-mono text-sm space-y-2">
      ...
    </div>
  </div>
</CaseStudySection>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma seed in NestJS bootstrap | Standalone ts-node script | Standard since Prisma 2+ | No NestJS DI overhead in seed |
| `faker` (v4/v5, no faker.seed) | `@faker-js/faker` v10 with `faker.seed()` | v8+ | Full determinism without global randomness override |

**Deprecated/outdated:**
- `import faker from 'faker'` (old package name): The current package is `@faker-js/faker`. Import as `import { faker } from '@faker-js/faker'`.

---

## Existing Codebase State (Critical for Planning)

### What Already Exists

| Item | Location | State |
|------|----------|-------|
| Prisma schema (all models) | `packages/devcollab-database/prisma/schema.prisma` | Complete — User, Workspace, WorkspaceMember, Snippet, Post, Comment, Reaction, Notification, ActivityEvent |
| `@devcollab/database` prisma client | `packages/devcollab-database/src/client.ts` | Singleton pattern with `devcollabPrisma` globalThis key |
| `@faker-js/faker` | `node_modules/@faker-js/faker` | v10.3.0 — installed, determinism verified |
| Portfolio homepage | `apps/web/app/(portfolio)/page.tsx` | Has TeamFlow "Featured Project" section — single card layout |
| Projects listing page | `apps/web/app/(portfolio)/projects/page.tsx` | Has TeamFlow ProjectCard — grid layout ready for second card |
| ProjectCard component | `apps/web/components/portfolio/project-card.tsx` | Accepts title, description, techStack, href, featured |
| CaseStudySection component | `apps/web/components/portfolio/case-study-section.tsx` | Accepts title and children |
| TeamFlow case study | `apps/web/app/(portfolio)/projects/teamflow/page.tsx` | Full template — copy and adapt for DevCollab |
| DevCollab workspace slug routing | `apps/devcollab-web/app/w/[slug]/page.tsx` | `devcollab-demo` slug will deep-link into the seeded workspace |
| DevCollab login page | `apps/devcollab-web/app/(auth)/login/page.tsx` | Plain HTML form — no demo credential hints yet |

### What Does NOT Exist Yet

| Item | Must Be Created |
|------|----------------|
| `packages/devcollab-database/prisma/seed.ts` | Seed script |
| Seed script entry in `packages/devcollab-database/package.json` | `scripts.seed` and `prisma.seed` |
| `apps/web/app/(portfolio)/projects/devcollab/page.tsx` | DevCollab case study |
| Second ProjectCard on `/projects` page | Edit existing `projects/page.tsx` |
| DevCollab card on homepage | Edit existing `page.tsx` Featured Projects section |
| Demo credential hint on login page | Edit `apps/devcollab-web/app/(auth)/login/page.tsx` |

---

## Open Questions

1. **Where to run seed — in Dockerfile.migrate or standalone?**
   - What we know: `devcollab-migrate` service in docker-compose.yml runs `prisma migrate deploy` then exits. The seed could run as a second CMD or a separate Docker service.
   - What's unclear: Should seed be part of the migrate container (same Dockerfile) or a separate `devcollab-seed` service?
   - Recommendation: Add seed as a second step in Dockerfile.migrate (copy seed.ts, install ts-node, run after migrate). Alternatively, add a `devcollab-seed` service that depends on `devcollab-migrate: service_completed_successfully`. Either works; the seed service approach is cleaner separation.

2. **Live demo URL for portfolio**
   - What we know: Deployment is deferred. The URL will be something like `https://devcollab.fernandomillan.dev` once Coolify is configured.
   - What's unclear: Exact URL unknown until deployment.
   - Recommendation: Use `NEXT_PUBLIC_DEVCOLLAB_URL` env var with `http://localhost:3002` fallback. Portfolio case study will show the correct URL once the env var is set in Coolify for the portfolio app.

3. **bcrypt in seed.ts — import source — RESOLVED**
   - Verified: `bcrypt` IS hoisted to `/home/doctor/fernandomillan/node_modules/bcrypt` (npm workspace hoisting).
   - `import * as bcrypt from 'bcrypt'` in seed.ts will resolve without any extra package.json changes.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `packages/devcollab-database/prisma/schema.prisma` — all model fields, types, and constraints verified directly
- Codebase inspection: `apps/devcollab-api/src/comments/comments.service.ts` — notification creation pattern verified
- Codebase inspection: `apps/devcollab-api/src/snippets/snippets.service.ts` — activityEvent creation pattern verified
- Codebase inspection: `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — case study template verified
- Codebase inspection: `apps/web/components/portfolio/project-card.tsx` — ProjectCard interface verified
- Live test: `faker.seed(42)` determinism verified — identical output on two consecutive calls confirmed

### Secondary (MEDIUM confidence)
- Prisma docs pattern: `createMany({ skipDuplicates: true })` for idempotent bulk inserts — standard Prisma feature
- Prisma seed convention: `prisma.seed` field in package.json triggers on `prisma db seed` — documented standard

### Tertiary (LOW confidence)
- ts-node resolution in Turborepo — not directly tested; recommendation to use relative import as fallback is prudent

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified present in node_modules; all Prisma model fields read directly from schema
- Architecture: HIGH — portfolio page structure verified from existing files; seed pattern derived from actual service code
- Pitfalls: HIGH for codebase-specific pitfalls (unique constraints from schema); MEDIUM for ts-node resolution

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable domain; Prisma schema changes would require re-check)
