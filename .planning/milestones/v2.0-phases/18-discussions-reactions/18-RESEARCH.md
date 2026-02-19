# Phase 18: Discussions + Reactions — Research

**Researched:** 2026-02-17
**Domain:** Threaded comments (flat DB model + in-memory tree), emoji reactions (upsert/toggle), NestJS CRUD, Next.js 15 client-side fetch mutation, Prisma schema extension
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User can comment on a snippet or post | NestJS `CommentsController` nested under `/workspaces/:slug/comments`, self-referential Prisma `Comment` model with nullable `parentId`, `@CheckAbility('create', 'Comment')` guard |
| DISC-02 | User can reply to a comment (one level deep) | Same Comment model — replies have `parentId != null`; UI prevents reply-to-reply by not rendering reply button on depth-1 comments; API enforces depth by rejecting `parentId` that itself has a `parentId` |
| DISC-03 | User can edit and delete own comment; Admin can hard-delete | PATCH/DELETE endpoints with service-layer owner check (same pattern as snippets/posts); soft-delete (set `content = '[deleted]'`, `deletedAt` timestamp) preserves thread structure; hard-delete (Admin only) removes row |
| DISC-04 | User can react to a post or comment with 👍 ❤️ +1 😄; second click removes | `Reaction` model with separate nullable FKs (`postId`, `commentId`), `@@unique([userId, emoji, postId])` + `@@unique([userId, emoji, commentId])`; toggle via Prisma `upsert`/`delete`; count returned in comment/reaction fetch; client uses `useState` + `fetch` (no full reload) |
</phase_requirements>

---

## Summary

Phase 18 adds threaded discussions and emoji reactions to snippets and posts. The architecture is fully established: NestJS API (port 3003) handles all mutations; the Next.js 15 web app calls it via `fetch` with `credentials: 'include'` (cookie auth). No Next.js Server Actions are used — the project's existing pattern is direct REST calls from `'use client'` components. Both patterns must stay consistent with Phase 17.

The most consequential decision is the **flat-model comment approach** mandated by success criterion #5: "total Prisma queries per thread fetch < 5." A single `findMany` for all comments belonging to a resource (no recursive includes), followed by in-memory tree assembly, achieves this in 2 queries (1 workspace lookup + 1 flat fetch). Recursive `include` with `replies: { include: { replies: ... } }` N+1s badly and is prohibited.

Reactions target two entity types (Post, Comment). Prisma does not support native polymorphic associations. The standard workaround is **separate nullable FKs** (`postId?`, `commentId?`) with a `@@unique` constraint per combination and a Prisma-level check. This maintains referential integrity through real foreign keys while avoiding the polymorphic `targetType/targetId` anti-pattern that bypasses FK constraints.

**Primary recommendation:** Use a flat `Comment` model with optional `parentId` self-relation. Fetch all comments for a resource in one `findMany`, assemble tree in JS. Use separate nullable FK Reaction model. Expose endpoints following the existing `@CheckAbility` + service-layer owner-check pattern. Client components call the NestJS API with `fetch + credentials: 'include'`; use `useState` for optimistic count updates on reactions.

---

## Standard Stack

### Core (No New npm Packages Required)

The project already has everything needed. No new packages must be installed.

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|------------------|
| NestJS (`@nestjs/common`) | ^11.0.0 | Controller, service, DTO for comments and reactions | Yes — `devcollab-api` |
| `@casl/ability` | ^6.8.0 | RBAC guard + `@CheckAbility` decorator | Yes — `devcollab-api` |
| Prisma (via `@devcollab/database`) | ^5.x | ORM for Comment + Reaction models | Yes — `packages/devcollab-database` |
| React (`useState`) | ^19.0.0 | Client-side reaction toggle state | Yes — `devcollab-web` |
| Next.js 15 | ^15.0.0 | SSR for thread display, `'use client'` for forms | Yes — `devcollab-web` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` (`useRouter`, `useParams`) | built-in | Post-mutation navigation, reading slug/id | Already used in Phase 17 edit pages |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate nullable FK Reaction model | `targetType` + `targetId` string FK | Nullable FK preserves DB referential integrity; targetType/targetId cannot have real FK constraints in PostgreSQL |
| Flat fetch + in-memory tree | Recursive Prisma `include` | Flat fetch = O(n) JS; recursive include = N+1 queries and no depth limit |
| Service-layer owner check | CASL instance conditions in guard | Guard runs before DB fetch; service layer already has the fetched record to check ownership |
| Soft-delete (content = '[deleted]') | Hard-delete all comments | Hard-delete orphans replies; soft-delete preserves thread structure per success criterion |

**Installation:** No new packages needed. All required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/devcollab-database/prisma/
└── schema.prisma           # Add Comment + Reaction models

apps/devcollab-api/src/
├── comments/
│   ├── comments.module.ts
│   ├── comments.controller.ts  # @Controller('workspaces/:slug/comments')
│   ├── comments.service.ts
│   └── dto/
│       ├── create-comment.dto.ts
│       └── update-comment.dto.ts
├── reactions/
│   ├── reactions.module.ts
│   ├── reactions.controller.ts  # @Controller('workspaces/:slug/reactions')
│   ├── reactions.service.ts
│   └── dto/
│       └── toggle-reaction.dto.ts
└── app.module.ts           # Import CommentsModule + ReactionsModule

apps/devcollab-web/
├── app/w/[slug]/
│   ├── posts/[id]/
│   │   └── page.tsx        # Add ThreadedComments component + ReactionBar
│   └── snippets/[id]/
│       └── page.tsx        # Add ThreadedComments component + ReactionBar
└── components/
    ├── discussion/
    │   ├── ThreadedComments.tsx   # 'use client': renders comment tree, handles post/edit/delete
    │   ├── CommentForm.tsx        # 'use client': textarea + submit for top-level and replies
    │   └── CommentItem.tsx        # 'use client': renders one comment, edit/delete controls, reply button
    └── reaction/
        └── ReactionBar.tsx        # 'use client': emoji buttons with counts, toggle via fetch
```

### Pattern 1: Flat Comment Model with Self-Relation

**What:** All comments stored flat in one table. `parentId` nullable — null = top-level, non-null = reply. One `findMany` fetches all; JS assembles the tree.

**When to use:** The thread fetch endpoint. Required to stay below 5 Prisma queries.

**Prisma schema:**
```prisma
// Source: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations
model Comment {
  id        String    @id @default(cuid())
  content   String    @db.Text
  deletedAt DateTime?               // null = live; non-null = soft-deleted

  authorId    String
  parentId    String?               // null = top-level, non-null = reply
  postId      String?               // null if this comment is on a snippet
  snippetId   String?               // null if this comment is on a post

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies   Comment[] @relation("CommentReplies")
  post      Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  snippet   Snippet?  @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  reactions Reaction[]

  @@index([postId])
  @@index([snippetId])
  @@index([authorId])
  @@index([parentId])
  @@index([createdAt])
}
```

**In-memory tree assembly (service layer):**
```typescript
// Source: derived from codebase patterns + Prisma self-relation docs
// In CommentsService.findAll()
async findAll(slug: string, requesterId: string, filter: { postId?: string; snippetId?: string }) {
  const workspace = await this.prisma.workspace.findUnique({
    where: { slug }, select: { id: true },
  });
  if (!workspace) throw new NotFoundException('Workspace not found');

  // Query 1: workspace lookup (above)
  // Query 2: flat fetch — ALL comments for this resource, author info included
  const flat = await this.prisma.comment.findMany({
    where: filter.postId ? { postId: filter.postId } : { snippetId: filter.snippetId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, email: true } },
      reactions: { select: { id: true, emoji: true, userId: true } },
    },
  });

  // In-memory tree: O(n), no additional DB queries
  const byId = new Map(flat.map(c => [c.id, { ...c, replies: [] as typeof flat }]));
  const roots: typeof flat = [];
  for (const c of flat) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(byId.get(c.id)!);
    }
  }
  return roots; // top-level comments with .replies arrays
}
```

**Total queries: 2** (workspace lookup + flat comment fetch). Well below the 5-query limit.

### Pattern 2: Reaction Toggle via Upsert/Delete

**What:** A `Reaction` model with separate nullable FKs for each target type. Toggle = if reaction exists, delete; if not, create. The `@@unique` constraints ensure one reaction per user per emoji per target.

**When to use:** POST `/workspaces/:slug/reactions` with `{ emoji, postId? | commentId? }`.

**Prisma schema:**
```prisma
// Source: https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/
// and Prisma docs for unique constraints
model Reaction {
  id    String @id @default(cuid())
  emoji String // 'thumbs_up' | 'heart' | 'plus_one' | 'laugh'

  userId    String
  postId    String?
  commentId String?

  createdAt DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, emoji, postId])    // one thumbs_up per user per post
  @@unique([userId, emoji, commentId]) // one thumbs_up per user per comment
  @@index([postId])
  @@index([commentId])
  @@index([userId])
}
```

**Toggle service method:**
```typescript
// Source: Prisma docs upsert pattern + project service conventions
async toggleReaction(slug: string, dto: ToggleReactionDto, userId: string) {
  const workspace = await this.prisma.workspace.findUnique({
    where: { slug }, select: { id: true },
  });
  if (!workspace) throw new NotFoundException('Workspace not found');

  const { emoji, postId, commentId } = dto;
  if (!postId && !commentId) throw new BadRequestException('postId or commentId required');

  // Check if reaction already exists
  const where = postId
    ? { userId_emoji_postId: { userId, emoji, postId } }
    : { userId_emoji_commentId: { userId, emoji, commentId: commentId! } };

  const existing = await this.prisma.reaction.findUnique({ where });

  if (existing) {
    await this.prisma.reaction.delete({ where });
    return { action: 'removed', emoji };
  } else {
    await this.prisma.reaction.create({
      data: { emoji, userId, ...(postId ? { postId } : { commentId }) },
    });
    return { action: 'added', emoji };
  }
}
```

### Pattern 3: Depth Enforcement (One Level Only)

**What:** The API rejects a comment creation where `parentId` refers to a comment that itself has a non-null `parentId`. This enforces the "one level deep" constraint at the API layer.

**When to use:** In `CommentsService.create()`.

```typescript
// Source: project conventions (service-layer business rules)
async create(slug: string, dto: CreateCommentDto, authorId: string) {
  const workspace = await this.prisma.workspace.findUnique({
    where: { slug }, select: { id: true },
  });
  if (!workspace) throw new NotFoundException('Workspace not found');

  if (dto.parentId) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: dto.parentId }, select: { parentId: true },
    });
    if (!parent) throw new NotFoundException('Parent comment not found');
    if (parent.parentId) {
      throw new BadRequestException('Reply-to-reply is not allowed (max one level deep)');
    }
  }

  return this.prisma.comment.create({
    data: {
      content: dto.content,
      authorId,
      parentId: dto.parentId ?? null,
      postId: dto.postId ?? null,
      snippetId: dto.snippetId ?? null,
    },
  });
}
```

### Pattern 4: Soft-Delete vs Hard-Delete for Comments

**What:** Regular users soft-delete (set `content = '[deleted]'` + `deletedAt = now()`). Admins hard-delete (remove the row). Soft-delete preserves thread structure.

**When to use:** `DELETE /workspaces/:slug/comments/:id`. Service checks role.

```typescript
// Source: project service conventions (ForbiddenException pattern from snippets.service.ts)
async remove(slug: string, id: string, requesterId: string) {
  const workspace = await this.prisma.workspace.findUnique({
    where: { slug }, select: { id: true },
  });
  if (!workspace) throw new NotFoundException('Workspace not found');

  const comment = await this.prisma.comment.findFirst({
    where: { id },
  });
  if (!comment) throw new NotFoundException('Comment not found');

  const membership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace.id } },
    select: { role: true },
  });

  const isOwner = comment.authorId === requesterId;
  const isAdmin = membership?.role === 'Admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You can only delete your own comments');
  }

  if (isAdmin && !isOwner) {
    // Hard-delete: Admin removing someone else's comment
    return this.prisma.comment.delete({ where: { id } });
  } else {
    // Soft-delete: owner or admin deleting their own
    return this.prisma.comment.update({
      where: { id },
      data: { content: '[deleted]', deletedAt: new Date() },
    });
  }
}
```

### Pattern 5: Client-Side Reaction Toggle (No Full Reload)

**What:** A `'use client'` React component that calls the NestJS API directly. Uses `useState` to update reaction counts optimistically. Follows the existing pattern in `EditPostPage` and `NewSnippetPage`.

**When to use:** `ReactionBar.tsx` rendered on post/snippet detail pages.

```typescript
// Source: project patterns (edit/new pages use credentials: 'include' fetch)
// apps/devcollab-web/components/reaction/ReactionBar.tsx
'use client';
import { useState } from 'react';

const EMOJI_MAP: Record<string, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  plus_one: '+1',
  laugh: '😄',
};

interface Reaction { emoji: string; userId: string; }

interface Props {
  postId?: string;
  commentId?: string;
  initialReactions: Reaction[];
  currentUserId: string;
  workspaceSlug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function ReactionBar({ postId, commentId, initialReactions, currentUserId, workspaceSlug }: Props) {
  const [reactions, setReactions] = useState(initialReactions);

  const toggle = async (emoji: string) => {
    // Optimistic update
    const alreadyReacted = reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
    setReactions(prev =>
      alreadyReacted
        ? prev.filter(r => !(r.emoji === emoji && r.userId === currentUserId))
        : [...prev, { emoji, userId: currentUserId }]
    );

    await fetch(`${API_URL}/workspaces/${workspaceSlug}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emoji, postId, commentId }),
    });
    // On failure: could refetch to reconcile; for simplicity, optimistic stays
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {Object.entries(EMOJI_MAP).map(([key, emoji]) => {
        const count = reactions.filter(r => r.emoji === key).length;
        const active = reactions.some(r => r.emoji === key && r.userId === currentUserId);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              padding: '4px 10px',
              border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '999px',
              background: active ? '#eff6ff' : 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {emoji} {count > 0 ? count : ''}
          </button>
        );
      })}
    </div>
  );
}
```

### Pattern 6: Controller URL Design

The `Comment` model touches both Posts and Snippets. The cleanest URL scheme follows the resource nesting principle:

```
POST   /workspaces/:slug/comments          — create comment (body has postId or snippetId)
GET    /workspaces/:slug/comments?postId=  — fetch thread for a post
GET    /workspaces/:slug/comments?snippetId= — fetch thread for a snippet
PATCH  /workspaces/:slug/comments/:id     — edit own comment
DELETE /workspaces/:slug/comments/:id     — soft/hard-delete own comment

POST   /workspaces/:slug/reactions        — toggle reaction (body has postId or commentId)
```

Alternative: nest under `/workspaces/:slug/posts/:id/comments`. This is more RESTful but creates duplicate controllers for snippets. Flat `/comments` with a query param is simpler and consistent with the project's pattern (Snippets module uses `@Controller('workspaces/:slug/snippets')` not nested under workspaces controller).

### Pattern 7: CASL Ability — No Changes Needed

The `WorkspaceAbilityFactory` already declares Comment permissions for all roles (verified by reading the existing source code). No changes needed to the ability factory for Phase 18.

From the existing `workspace-ability.factory.ts` (verified by reading):
- `Admin`: `can('manage', 'all')` — already covers Comment
- `Contributor`: already has `can('create'/'update'/'delete', 'Comment')`
- `Viewer`: `can('read', 'all')` — cannot create/update/delete

The `Comment` subject is already declared in the `Subject` type union. No factory changes needed.

### Pattern 8: Getting currentUserId in SSR Pages

**What:** Detail pages are Server Components. They need the current user's `sub` (userId) to pass to `ReactionBar` so it can highlight "my" reactions. The confirmed approach: call `GET /auth/me` from the SSR page (verified: this endpoint exists and returns `{ user: { sub, email } }`).

**When to use:** Post detail page and Snippet detail page SSR setup.

```typescript
// Source: existing codebase — auth.controller.ts confirmed GET /auth/me exists
// and Phase 17 SSR pattern for cookie forwarding
async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as { sub: string; email: string };
}

// In the detail page Server Component:
const cookieStore = await cookies();
const token = cookieStore.get('devcollab_token')?.value;
const currentUser = token ? await getCurrentUser(token) : null;
// Pass currentUser.sub to ThreadedComments and ReactionBar
```

### Anti-Patterns to Avoid

- **Recursive Prisma include for comments:** `replies: { include: { replies: { include: { replies: ... } } } }` causes N+1 and exceeds the 5-query limit. Use flat fetch + in-memory assembly.
- **Hard-deleting comments with replies:** Deleting a parent comment hard removes the row and orphans or cascade-deletes replies. Soft-delete preserves thread structure.
- **Using `targetType` + `targetId` for reactions:** Cannot enforce referential integrity in PostgreSQL. Nullable FK approach gives real FK constraints.
- **Passing `currentUserId` from client-side state without server verification:** The `currentUserId` for the ReactionBar must come from the SSR page (which reads the JWT cookie and calls `/auth/me`) — never from client-side localStorage or guessing.
- **Reply button on depth-1 comments in the UI:** The UI must check `comment.parentId !== null` and not render the Reply button in that case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree assembly from flat list | Recursive function with DB calls | Single `findMany` + in-memory `Map` assembly | DB recursion = N+1; in-memory Map is O(n) |
| Reaction uniqueness | Custom uniqueness check | Prisma `@@unique` constraint + `findUnique` before `create` | Race condition safe; DB enforces atomicity |
| Depth limit enforcement | Client-side only check | Service-layer `parentId` depth check | Client can be bypassed; API must validate |
| Soft-delete | Custom `isDeleted` boolean | `content = '[deleted]'` + `deletedAt` timestamp | `deletedAt` gives audit trail; content placeholder preserves thread UI |
| Auth cookie passing (SSR) | Manually forwarding headers | `cookies()` from `next/headers` + `Cookie: devcollab_token=${token}` in fetch (already established pattern) | Same as Phase 17 SSR pages |
| Getting current user in SSR | JWT manual decode | Call `GET /auth/me` with forwarded cookie | `/auth/me` endpoint confirmed present; avoids base64 decoding JWT in web app |

**Key insight:** The project's established patterns already solve every hard problem. Follow the service-layer owner check (Phase 17 pattern), follow the SSR cookie forwarding (Phase 17 pattern), follow the `@CheckAbility` decorator (Phase 16 pattern). Phase 18 adds models and modules, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: N+1 from Recursive Comment Includes

**What goes wrong:** Developer writes `include: { replies: { include: { replies: true } } }` — this generates one query per level per comment, easily hitting 5+ queries for a modest thread.

**Why it happens:** Natural instinct to model the tree relationally in Prisma's include API.

**How to avoid:** Fetch flat. The success criterion explicitly states "flat model + in-memory tree assembly."

**Warning signs:** Prisma query log shows more than 2 queries when fetching a comment thread.

---

### Pitfall 2: Hard-Deleting Comments Breaks Thread Structure

**What goes wrong:** Deleting a top-level comment with `prisma.comment.delete` either (a) cascade-deletes all replies (losing user content) or (b) fails due to FK constraint from replies.

**Why it happens:** The Prisma schema has `parent Comment? @relation(...)` with `onDelete: NoAction` — the correct setting to prevent cascade — but then a hard delete needs explicit reply handling.

**How to avoid:** Use soft-delete for owner-initiated deletion: set `content = '[deleted]'` and `deletedAt = now()`. Only Admins hard-delete, and only leaf comments or when accepting cascade. The UI renders `[deleted]` for soft-deleted comments.

**Warning signs:** DELETE on a comment with replies returns a FK constraint violation error from PostgreSQL.

---

### Pitfall 3: Reply-to-Reply via API Bypass

**What goes wrong:** A client (or curl) sends `POST /comments` with a `parentId` that points to a reply (depth 1). The API creates a depth-2 comment. The tree assembler then breaks (or nests infinitely).

**Why it happens:** UI blocks reply-to-reply, but the API is not validated.

**How to avoid:** In `CommentsService.create()`, after fetching the parent comment, check `if (parent.parentId) throw BadRequestException(...)`.

**Warning signs:** Manual API test: POST with `parentId` of a reply should return 400 Bad Request.

---

### Pitfall 4: Reaction Unique Constraint Violation on Race Condition

**What goes wrong:** User double-clicks reaction button before the first request returns. Two `create` calls race — one succeeds, one throws a Prisma unique constraint violation (P2002).

**Why it happens:** Optimistic UI sends requests immediately; no debounce.

**How to avoid:** (a) Disable the reaction button while the request is in-flight (`loading` state), OR (b) catch P2002 on the server and return success (idempotent). Recommended: both.

**Warning signs:** Console shows `PrismaClientKnownRequestError P2002` on rapid double-clicks.

---

### Pitfall 5: Missing `workspaceId` Scope on Comment Fetch

**What goes wrong:** `GET /comments?postId=X` returns comments for that post even if the user is not a member of the post's workspace (because postId alone scopes to the right post, not to the workspace).

**Why it happens:** The CaslAuthGuard already validates workspace membership via `slug`, but the service query uses only `postId`.

**How to avoid:** The guard handles this correctly if the route includes `:slug`. Since the controller is `@Controller('workspaces/:slug/comments')`, the guard will check membership. The service still resolves workspace from slug (standard project pattern — see snippets.service.ts).

**Warning signs:** Security test: request comment thread for a post in workspace A while authenticated to workspace B — should return 403.

---

### Pitfall 6: SSR Pages Cannot Read `currentUserId` Without Cookie Forwarding

**What goes wrong:** The post/snippet detail page (Server Component) needs to pass `currentUserId` to `ReactionBar` so it knows which reactions are "mine." Without reading the JWT cookie server-side, it cannot determine the user ID.

**Why it happens:** Server Component has no browser context; must read JWT from `cookies()`.

**How to avoid:** Follow Phase 17 established pattern: `const token = cookieStore.get('devcollab_token')?.value`, then call `GET /auth/me` with the forwarded cookie to get `{ sub, email }`. Pass `sub` as `currentUserId` prop to client components. The `GET /auth/me` endpoint is confirmed present in the codebase (`auth.controller.ts`, line 53-57).

**Warning signs:** `ReactionBar` shows no reactions as "active" even when the user has reacted.

---

## Code Examples

### Prisma Schema — Comment + Reaction Models

```prisma
// Source: Prisma self-relations docs + project schema conventions
// Add to packages/devcollab-database/prisma/schema.prisma

model Comment {
  id        String    @id @default(cuid())
  content   String    @db.Text
  deletedAt DateTime?

  authorId  String
  parentId  String?
  postId    String?
  snippetId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies   Comment[] @relation("CommentReplies")
  post      Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  snippet   Snippet?  @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  reactions Reaction[]

  @@index([postId])
  @@index([snippetId])
  @@index([authorId])
  @@index([parentId])
  @@index([createdAt])
}

model Reaction {
  id    String @id @default(cuid())
  emoji String // 'thumbs_up' | 'heart' | 'plus_one' | 'laugh'

  userId    String
  postId    String?
  commentId String?

  createdAt DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, emoji, postId])
  @@unique([userId, emoji, commentId])
  @@index([postId])
  @@index([commentId])
  @@index([userId])
}
```

### Back-References Required on Existing Models

The `Post`, `Snippet`, `User` models must get back-reference relations. These are required by Prisma when adding relations from new models:

```prisma
// Add to existing User model:
  comments  Comment[]
  reactions Reaction[]

// Add to existing Post model:
  comments  Comment[]
  reactions Reaction[]

// Add to existing Snippet model:
  comments  Comment[]
```

### Migration Command

```bash
cd /home/doctor/fernandomillan
npx prisma migrate dev --name add-comments-reactions \
  --schema=packages/devcollab-database/prisma/schema.prisma
```

### NestJS CommentsModule Registration

```typescript
// Source: project app.module.ts pattern
// apps/devcollab-api/src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
```

```typescript
// apps/devcollab-api/src/app.module.ts — add to imports:
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
// ...
CommentsModule,
ReactionsModule,
```

### PrismaService — New Getters

```typescript
// Source: existing prisma.service.ts pattern
// Add to apps/devcollab-api/src/core/database/prisma.service.ts:
get comment() {
  return this.client.comment;
}

get reaction() {
  return this.client.reaction;
}
```

### CommentsController

```typescript
// Source: snippets.controller.ts pattern
// apps/devcollab-api/src/comments/comments.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @CheckAbility('create', 'Comment')
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.create(slug, dto, user.sub);
  }

  @CheckAbility('read', 'Comment')
  @Get()
  findAll(
    @Param('slug') slug: string,
    @Query('postId') postId?: string,
    @Query('snippetId') snippetId?: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.findAll(slug, user.sub, { postId, snippetId });
  }

  @CheckAbility('update', 'Comment')
  @Patch(':id')
  update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.update(slug, id, dto, user.sub);
  }

  @CheckAbility('delete', 'Comment')
  @Delete(':id')
  remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.remove(slug, id, user.sub);
  }
}
```

### CreateCommentDto

```typescript
// apps/devcollab-api/src/comments/dto/create-comment.dto.ts
export class CreateCommentDto {
  content!: string;
  postId?: string;
  snippetId?: string;
  parentId?: string;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recursive `include` for comment trees | Flat fetch + in-memory tree assembly | Always best practice; Prisma issues/tree-structures#4562 open since 2020 | Constant DB queries regardless of thread depth |
| `execCommand` for clipboard | `navigator.clipboard.writeText` | 2020+ (already done in Phase 17) | N/A — already in codebase |
| Polymorphic `targetType/targetId` | Separate nullable FKs + `@@unique` per type | Well-established PostgreSQL pattern | Real FK constraints; cascade deletes work correctly |
| Optimistic UI via `useOptimistic` hook | Direct `useState` update before `fetch` returns | React 19 has `useOptimistic` but project uses simpler `useState` approach | `useState` is consistent with existing edit pages; `useOptimistic` adds complexity without benefit for this use case |

**Note on `useOptimistic`:** React 19 and Next.js 15 both support `useOptimistic` with Server Actions. However, the project does NOT use Server Actions — it calls the NestJS API directly via `fetch`. Using `useOptimistic` would require wrapping in `startTransition`, adding complexity. The simpler `useState` + `fetch` pattern (used in all Phase 17 pages) is consistent and sufficient. `useOptimistic` is a future enhancement if the project moves to Server Actions.

---

## Open Questions

1. **Where to render the comment thread on detail pages**
   - What we know: Post detail pages and Snippet detail pages are currently Server Components that call the NestJS API. They do not have comment sections.
   - What's unclear: Should the thread be server-rendered (initial fetch in Server Component, then client for mutations) or fully client-rendered?
   - Recommendation: Server-render the initial thread data (SSR fetch in the detail page), pass it as props to a `'use client' ThreadedComments` component. This gives fast initial load + allows client-side add/edit/delete without full page reload. Follows the same hybrid pattern as other detail pages.

2. **How to pass `currentUserId` to client components**
   - What we know: `GET /auth/me` exists and returns `{ user: { sub: string, email: string } }` (verified from `auth.controller.ts`). The SSR page reads the JWT cookie via `cookies()` and forwards it. This is already established by Phase 17 pages.
   - Resolution: In the detail page Server Component, call `GET /auth/me` with the forwarded cookie to get `sub`. Pass it as `currentUserId` prop to `ThreadedComments` and `ReactionBar`. No JWT decoding in the web app needed.

3. **Emoji representation: string keys vs Unicode**
   - What we know: The requirement specifies 👍 ❤️ +1 😄. The DB can store string keys (e.g., `'thumbs_up'`, `'heart'`, `'plus_one'`, `'laugh'`) or raw emoji characters.
   - Recommendation: Store string keys in DB (predictable, database-safe). Map to display emoji in the client component. This avoids encoding issues with emoji in PostgreSQL and makes querying/filtering by emoji type reliable.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis — `packages/devcollab-database/prisma/schema.prisma`, `apps/devcollab-api/src/snippets/snippets.service.ts`, `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts`, `apps/devcollab-api/src/guards/casl-auth.guard.ts`, `apps/devcollab-api/src/core/database/prisma.service.ts`, `apps/devcollab-api/src/auth/auth.controller.ts` — all read directly; patterns confirmed
- `https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations` — Self-referential Comment schema with `@relation("CommentReplies")` pattern verified
- `https://react.dev/reference/react/useOptimistic` — `useOptimistic` hook behavior verified; decision to use simpler `useState` is documented

### Secondary (MEDIUM confidence)
- `https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/` — Separate nullable FK approach for polymorphic associations; `@@unique` constraint enforcement; PostgreSQL check constraint recommendation
- `https://nextjs.org/docs/app/getting-started/updating-data` — Next.js 15 mutation patterns (Server Actions vs direct fetch); confirmed project uses direct `fetch` not Server Actions
- Phase 17 RESEARCH.md — Established patterns for NestJS module structure, service-layer owner check, SSR cookie forwarding — all directly applicable

### Tertiary (LOW confidence — validate before implementing)
- `num_nonnulls("postId", "commentId") = 1` PostgreSQL check constraint for reactions — mentioned in Wanago article; not verified via Prisma migration output. May need to be added via raw SQL migration. Skipping this and relying on application-layer validation (`if (!postId && !commentId) throw BadRequestException`) is acceptable for this scope.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages needed; existing stack confirmed via direct codebase read
- Architecture: HIGH — flat comment model + Prisma self-relation verified against official docs; reaction nullable FK pattern verified against PostgreSQL/Prisma docs; `GET /auth/me` confirmed present in codebase
- Pitfalls: HIGH — soft-delete thread preservation, N+1 avoidance, and race condition patterns derived from direct reading of existing service files and Prisma docs
- Open questions: LOW — all major questions resolved; only emoji storage format choice remains (string key vs raw emoji, both acceptable)

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Prisma and NestJS are stable; re-verify if major version bumps occur)
