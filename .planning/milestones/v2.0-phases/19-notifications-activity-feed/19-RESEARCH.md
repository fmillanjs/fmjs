# Phase 19: Notifications + Activity Feed — Research

**Researched:** 2026-02-18
**Domain:** @mention detection in comment text, polling-based notification delivery, unread badge state, cursor-paginated activity feed, NestJS service layer + Next.js 15 client hooks
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTF-01 | User is notified when mentioned with @name in a comment | @mention regex on comment content during `CommentsService.create` and `update`; `Notification` model stores recipientId, sourceCommentId, sourceWorkspaceId; created after comment save |
| NOTF-02 | User sees unread notification count in bell icon | `GET /notifications/unread-count` returns `{ count: number }`; workspace layout Client Component polls every 60 s via `setInterval`; bell icon shows badge when count > 0 |
| NOTF-03 | User can mark notifications as read | `PATCH /notifications/:id/read` marks individual; `PATCH /notifications/read-all` marks all; client updates badge count immediately via `useState` (no full reload) |
| FEED-01 | User can view workspace activity feed (reverse-chronological, paginated) | `ActivityEvent` model on workspace; feed endpoint returns 20 items with cursor pagination; events created on member-join, post/snippet create/update; web page polls every 30 s |
</phase_requirements>

---

## Summary

Phase 19 adds two independent features: **@mention notifications** and a **workspace activity feed**. Both are built on Postgres (no new infrastructure — no Redis, no WebSockets, no queues). Notifications are triggered synchronously inside existing service methods at comment-create/update time. The activity feed is an append-only event log written by existing services. Both surfaces poll on the client: 60 s for notifications, 30 s for the feed.

The codebase pattern is firmly established after Phase 18: NestJS modules with `@CheckAbility` guard, `PrismaService` getters, `'use client'` React components that call the API directly via `fetch(..., { credentials: 'include' })`, SSR pages that forward the JWT cookie. Phase 19 follows this pattern exactly — new modules (`notifications`, `activity`) wired into `AppModule`, new Prisma models, new client-side hooks using `setInterval`.

The most consequential design decision is **synchronous mention notification creation**: after `this.prisma.comment.create(...)` succeeds, the service immediately calls `this.prisma.notification.createMany(...)` for each mentioned user. No queue, no event emitter — this is correct at portfolio scale. The risk is a slow notification write delays the comment response (acceptable: mention detection + DB insert is ~5 ms at portfolio scale).

**Primary recommendation:** Parse @mentions with a simple regex (`/@(\w+)/g`) in `CommentsService`, resolve mentioned names to user IDs in the same workspace via a single `prisma.user.findMany` call, then `createMany` notifications. Use a separate `notifications` NestJS module. Use `ActivityEvent` model (type enum + workspaceId + actorId + entityId + entityType) for the feed. Both features require zero new npm packages.

---

## Standard Stack

### Core (No New npm Packages Required)

All required tools already exist in the project.

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|------------------|
| NestJS (`@nestjs/common`) | ^11.0.0 | Controller + Service + DTO for notifications + activity | Yes — `devcollab-api` |
| `@casl/ability` | ^6.8.0 | `@CheckAbility` guard — Notification + ActivityEvent subjects | Yes — `devcollab-api` |
| Prisma (via `@devcollab/database`) | ^5.x | `Notification` + `ActivityEvent` Prisma models | Yes — `packages/devcollab-database` |
| React (`useState`, `useEffect`) | ^19.0.0 | Polling hook via `setInterval` in `useEffect`; badge state | Yes — `devcollab-web` |
| Next.js 15 App Router | ^15.0.0 | Workspace layout for bell icon; feed page | Yes — `devcollab-web` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/headers` (`cookies`) | built-in | SSR pages forward JWT cookie to API for feed initial load | Already used in Phase 17-18 detail pages |
| `useCallback` + `useEffect` | built-in React | Polling hook cleanup; stable `refresh` reference | Already used in `ThreadedComments.tsx` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synchronous mention notification in service | Bull queue / event emitter | Synchronous is simpler, zero deps, correct at portfolio scale; queue adds Redis dep and async complexity |
| Polling (`setInterval`) | WebSockets / SSE | Project has locked in polling-only; no WebSockets per prior decisions |
| `ActivityEvent` table (append-only log) | Postgres LISTEN/NOTIFY | Polling every 30 s with cursor pagination is simpler; LISTEN/NOTIFY requires persistent connection |
| Simple regex `/@(\w+)/g` for @mention | Tiptap mention extension | Comments are plain text in phase 18 (textarea, not Tiptap); regex is correct |
| Cursor pagination (`cursor` param) | Offset pagination (`page`/`skip`) | Cursor pagination is stable under concurrent inserts (no row-drift); offset drifts when new events inserted between polls |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/devcollab-database/prisma/
└── schema.prisma              # Add Notification + ActivityEvent models

apps/devcollab-api/src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts  # @Controller('notifications')
│   ├── notifications.service.ts     # list, unread-count, mark-read, mark-all-read
│   └── dto/
│       └── mark-read.dto.ts
├── activity/
│   ├── activity.module.ts
│   ├── activity.controller.ts       # @Controller('workspaces/:slug/activity')
│   ├── activity.service.ts          # findFeed (cursor-paginated)
│   └── dto/
│       └── feed-query.dto.ts
├── comments/
│   └── comments.service.ts          # + extractMentions() + notifyMentions() helper
├── workspaces/
│   └── workspaces.service.ts        # + logActivity() helper call in joinWorkspace()
├── posts/
│   └── posts.service.ts             # + logActivity() helper call in create/update
├── snippets/
│   └── snippets.service.ts          # + logActivity() helper call in create/update
└── app.module.ts                    # Import NotificationsModule + ActivityModule

apps/devcollab-web/
├── app/w/[slug]/
│   ├── layout.tsx                   # Convert to 'use client'; add BellIcon + polling
│   └── activity/
│       └── page.tsx                 # Activity feed page with cursor pagination
└── components/
    ├── notifications/
    │   ├── BellIcon.tsx             # 'use client': bell + badge; opens NotificationList
    │   └── NotificationList.tsx     # 'use client': list of notifications; mark read
    └── activity/
        └── ActivityFeed.tsx         # 'use client': activity feed with Load More
```

### Pattern 1: @Mention Detection in CommentsService

**What:** After saving a comment, extract `@name` tokens from the content, resolve them to workspace members, create `Notification` rows.

**When to use:** In `CommentsService.create()` and `CommentsService.update()`.

**Implementation:**
```typescript
// Source: project service conventions (same prisma access pattern as reactions.service.ts)
// apps/devcollab-api/src/comments/comments.service.ts

private extractMentionedNames(content: string): string[] {
  const matches = content.matchAll(/@(\w+)/g);
  return [...new Set([...matches].map(m => m[1]))];
}

private async notifyMentions(
  content: string,
  workspaceId: string,
  authorId: string,
  commentId: string,
): Promise<void> {
  const names = this.extractMentionedNames(content);
  if (names.length === 0) return;

  // Resolve mentioned names to user IDs who are workspace members
  const mentioned = await this.prisma.user.findMany({
    where: {
      name: { in: names },
      workspaceMemberships: { some: { workspaceId } },
    },
    select: { id: true },
  });

  // Exclude the author (don't notify yourself)
  const recipients = mentioned
    .map(u => u.id)
    .filter(id => id !== authorId);

  if (recipients.length === 0) return;

  await this.prisma.notification.createMany({
    data: recipients.map(recipientId => ({
      recipientId,
      actorId: authorId,
      type: 'mention',
      commentId,
      workspaceId,
      read: false,
    })),
    skipDuplicates: true,
  });
}
```

**Call site in `create()`:**
```typescript
// After prisma.comment.create() succeeds:
const comment = await this.prisma.comment.create({ ... });
// Fire mention notifications — synchronous but fast at portfolio scale
await this.notifyMentions(dto.content, workspace.id, authorId, comment.id);
return comment;
```

**Call site in `update()`:**
```typescript
// After prisma.comment.update() succeeds:
const comment = await this.prisma.comment.update({ ... });
await this.notifyMentions(dto.content, workspace.id, requesterId, id);
return comment;
```

### Pattern 2: Notification Prisma Model

**What:** `Notification` stores one row per mention event per recipient. `read` boolean tracks read state. `commentId` is the source — used to link back to the comment.

```prisma
// Source: project schema conventions (nullable FKs + index pattern from Comment/Reaction)
model Notification {
  id          String   @id @default(cuid())
  type        String   // 'mention' (only type in this phase)
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  recipientId String
  actorId     String       // user who wrote the @mention
  commentId   String?      // source comment (nullable: future types may not link to comment)
  workspaceId String

  recipient   User      @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor       User      @relation("NotificationActor", fields: [actorId], references: [id], onDelete: Cascade)
  comment     Comment?  @relation(fields: [commentId], references: [id], onDelete: SetNull)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([recipientId, read])        // fast unread count + list queries
  @@index([recipientId, createdAt])   // ordered list for notification panel
  @@index([workspaceId])
}
```

**Back-references required on existing models:**
```prisma
// User model: add
  notificationsReceived Notification[] @relation("NotificationRecipient")
  notificationsSent     Notification[] @relation("NotificationActor")

// Comment model: add
  notifications         Notification[]

// Workspace model: add
  notifications         Notification[]
  activityEvents        ActivityEvent[]
```

### Pattern 3: Notifications Controller (User-Scoped, NOT Workspace-Scoped)

**What:** Notifications belong to a user, not a workspace. The controller has no `:slug` param — the guard falls through to "workspace-agnostic" path (line 60 of `casl-auth.guard.ts`: `if (!workspaceSlug) return true`), and `@CheckAbility` satisfies the deny-by-default rule.

**Key insight from the guard:** `CaslAuthGuard` only does CASL ability evaluation when the route has `:slug`. Without `:slug`, the guard just verifies JWT + `@CheckAbility` presence, then returns `true`. This is already how `GET /auth/me` works and how `POST /workspaces/join` works.

```typescript
// Source: workspaces.controller.ts pattern for non-:slug routes
// apps/devcollab-api/src/notifications/notifications.controller.ts
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // List current user's notifications (newest first, limit 50)
  @CheckAbility('read', 'Notification')
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.list(user.sub);
  }

  // Unread count — polled every 60 s by BellIcon
  @CheckAbility('read', 'Notification')
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.unreadCount(user.sub);
  }

  // Mark individual notification as read
  @CheckAbility('update', 'Notification')
  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(id, user.sub);
  }

  // Mark all as read
  @CheckAbility('update', 'Notification')
  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }
}
```

**CRITICAL — Route Order:** `GET /notifications/unread-count` MUST be declared before `PATCH /notifications/:id/read` in the controller, otherwise NestJS may match `unread-count` as `:id` on PATCH routes. Since PATCH and GET are different HTTP methods this is not an issue — but for the `GET unread-count` vs `GET :id` case, always declare static segments (`unread-count`) before param segments (`:id`).

### Pattern 4: Notifications Service

```typescript
// Source: project service conventions (prisma.notification pattern)
// apps/devcollab-api/src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        comment: { select: { id: true, postId: true, snippetId: true } },
        workspace: { select: { id: true, slug: true, name: true } },
      },
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, read: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    // Owner check: can only mark your own notifications
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }
}
```

### Pattern 5: ActivityEvent Model

**What:** Append-only event log scoped to a workspace. Each significant workspace action writes a row. The feed endpoint reads these in reverse-chronological order with cursor pagination.

```prisma
// Source: project schema conventions
enum ActivityEventType {
  MemberJoined
  PostCreated
  PostUpdated
  SnippetCreated
  SnippetUpdated
}

model ActivityEvent {
  id          String            @id @default(cuid())
  type        ActivityEventType
  createdAt   DateTime          @default(now())

  workspaceId String
  actorId     String
  entityId    String            // ID of the affected entity (postId, snippetId, userId)
  entityType  String            // 'Post' | 'Snippet' | 'User'

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actor       User      @relation(fields: [actorId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])   // primary feed query index
  @@index([actorId])
}
```

**Back-reference on User model:**
```prisma
  activityEvents ActivityEvent[]
```

### Pattern 6: Activity Feed — Cursor Pagination

**What:** The feed returns 20 events per page. The cursor is the `createdAt` timestamp of the last item received. On next poll/page, the client sends `?cursor=<ISO-string>` to get items older than that cursor.

**Why cursor not offset:** New events appear constantly. With offset-based pagination, new events shift rows causing duplicates or gaps. Cursor pagination uses a stable position.

```typescript
// Source: Prisma cursor pagination docs + project service conventions
// apps/devcollab-api/src/activity/activity.service.ts
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findFeed(slug: string, cursor?: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const PAGE_SIZE = 20;

    const events = await this.prisma.activityEvent.findMany({
      where: {
        workspaceId: workspace.id,
        // If cursor provided, fetch events OLDER than cursor
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    const nextCursor =
      events.length === PAGE_SIZE
        ? events[events.length - 1].createdAt.toISOString()
        : null;

    return { events, nextCursor };
  }
}
```

**Feed Controller:**
```typescript
// apps/devcollab-api/src/activity/activity.controller.ts
@Controller('workspaces/:slug/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @CheckAbility('read', 'ActivityEvent')
  @Get()
  findFeed(
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.activityService.findFeed(slug, cursor);
  }
}
```

### Pattern 7: Activity Event Logging in Existing Services

**What:** Existing services (`WorkspacesService`, `PostsService`, `SnippetsService`) need to write `ActivityEvent` rows when workspace-significant actions occur. The cleanest approach at this scale: inject `PrismaService` directly (already injected) and call `prisma.activityEvent.create()` after the primary operation succeeds.

**Which actions to log (per FEED-01 success criteria):**
- Member joins workspace (`WorkspacesService.joinWorkspace`)
- Post created (`PostsService.create`)
- Post updated (`PostsService.update`)
- Snippet created (`SnippetsService.create`)
- Snippet updated (`SnippetsService.update`)

**Implementation pattern (replicated in each service):**
```typescript
// After the primary operation (e.g., after this.prisma.post.create()):
await this.prisma.activityEvent.create({
  data: {
    type: 'PostCreated',
    workspaceId: workspace.id,
    actorId: authorId,
    entityId: post.id,
    entityType: 'Post',
  },
});
```

**Why not a shared ActivityService:** Injecting the ActivityService into CommentsService, PostsService, WorkspacesService creates circular module dependencies (all depend on DatabaseModule). Calling `prisma.activityEvent.create()` directly avoids this — `PrismaService` is already injected in all service constructors. This is the same pattern as `notifyMentions()` in CommentsService.

### Pattern 8: CASL Ability Factory — New Subjects

The `WorkspaceAbilityFactory` `Subject` type union must be extended to include `Notification` and `ActivityEvent`. Also, permissions must be granted:

```typescript
// Source: workspace-ability.factory.ts (verified by reading)
// apps/devcollab-api/src/workspaces/workspace-ability.factory.ts

export type Subject =
  | 'Workspace'
  | 'WorkspaceMember'
  | 'InviteLink'
  | 'Post'
  | 'Snippet'
  | 'Comment'
  | 'Reaction'          // add if not already present
  | 'Notification'      // NEW
  | 'ActivityEvent'     // NEW
  | 'User'              // needed for /auth/me CheckAbility('read','User')
  | 'all';

// In the ability builder, Notification and ActivityEvent:
// Admin: already gets can('manage', 'all') — covers both
// Contributor: add can('read', 'ActivityEvent') + can('read','Notification') + can('update','Notification')
// Viewer: already has can('read', 'all') — covers ActivityEvent read
```

**Important caveat:** Notifications endpoint has NO `:slug` param. The guard's CASL check is bypassed for non-workspace routes (guard returns `true` at line 61 of `casl-auth.guard.ts`). `@CheckAbility('read', 'Notification')` on a non-slug route merely satisfies the "must declare @CheckAbility" invariant — the factory is NOT called. No ability factory changes are strictly required for notifications. They ARE required for `ActivityEvent` since that endpoint has `:slug`.

### Pattern 9: Polling Hook in Next.js Client Component

**What:** The bell icon polls `GET /notifications/unread-count` every 60 s. The activity feed polls `GET /workspaces/:slug/activity` every 30 s for new events at the top.

**When to use:** `BellIcon.tsx` (60 s poll) and `ActivityFeed.tsx` (30 s refresh of first page).

```typescript
// Source: project pattern (ThreadedComments.tsx uses useCallback + useEffect for refresh)
// apps/devcollab-web/components/notifications/BellIcon.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
const POLL_INTERVAL_MS = 60_000; // 60 seconds — success criterion: within 60 s

export default function BellIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // Network error — keep last count
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount(); // immediate on mount
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval); // cleanup on unmount
  }, [fetchUnreadCount]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
        aria-label="Notifications"
      >
        {'\uD83D\uDD14'} {/* Bell emoji — no purple colors */}
      </button>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#ef4444',    // red — NOT purple
          color: 'white',
          borderRadius: '999px',
          fontSize: '11px',
          minWidth: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 3px',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {open && (
        <NotificationPanel
          onRead={() => fetchUnreadCount()}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
```

**Activity feed 30 s polling (for new items at top):**
```typescript
// The feed starts with initial SSR-fetched events. Client then polls the first page
// (no cursor) every 30 s to pick up new events. "Load More" appends older events.
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${API_URL}/workspaces/${slug}/activity`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events); // replace first page with fresh data
      setNextCursor(data.nextCursor);
    }
  }, 30_000);
  return () => clearInterval(interval);
}, [slug]);
```

### Pattern 10: Workspace Layout — Adding Bell Icon

The current workspace layout (`app/w/[slug]/layout.tsx`) is a Server Component (no `'use client'` directive). Adding a polling bell icon requires a Client Component. The cleanest approach: keep the layout as a Server Component but extract the nav bar into a `'use client'` `WorkspaceNav.tsx` component.

**Current layout (Server Component):**
```tsx
// app/w/[slug]/layout.tsx — currently Server Component
// Must add BellIcon which requires client state
```

**Recommended approach:**
```tsx
// app/w/[slug]/layout.tsx — stays Server Component
import WorkspaceNav from '../../../components/WorkspaceNav';

export default async function WorkspaceLayout({ children, params }) {
  const { slug } = await params;
  return (
    <div>
      <WorkspaceNav slug={slug} />  {/* Client Component with BellIcon */}
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}

// components/WorkspaceNav.tsx — 'use client'
'use client';
import BellIcon from './notifications/BellIcon';

export default function WorkspaceNav({ slug }: { slug: string }) {
  return (
    <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 600 }}>Workspace: {slug}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a href={`/w/${slug}/activity`} style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Activity</a>
        <BellIcon />
        <a href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>Dashboard</a>
      </div>
    </nav>
  );
}
```

### Pattern 11: PrismaService — New Getters

The `PrismaService` proxy getter pattern (verified in `prisma.service.ts`):
```typescript
// Add to apps/devcollab-api/src/core/database/prisma.service.ts:
get notification() {
  return this.client.notification;
}

get activityEvent() {
  return this.client.activityEvent;
}
```

### Anti-Patterns to Avoid

- **Bull queue for mention notifications:** Over-engineering at portfolio scale. Synchronous `createMany` after comment save is correct and simple.
- **Polling the full notification list for the badge:** Poll only `GET /notifications/unread-count` (returns `{ count: number }`) — not the full list. The full list is fetched only when the user opens the bell panel.
- **Passing `workspaceId` from the client in mention resolution:** The service must resolve `workspaceId` from `slug` itself (same workspace-scope pattern as all other services). Never trust workspaceId from the request body.
- **Offset pagination for the activity feed:** `skip`/`take` with `skip` drifts when new events arrive during pagination. Use cursor (`createdAt: { lt: cursor }`) for stable pagination.
- **Creating notifications for the comment author:** The `notifyMentions` helper must exclude the author from the recipient list (`filter(id => id !== authorId)`).
- **Matching @mentions by email instead of name:** Users type `@Fernando` (display name), not `@fernando@example.com`. Match against `user.name`, not `user.email`.
- **Using `'use client'` on the workspace layout itself:** Layout must stay a Server Component to handle async `params`. Extract only the nav (which needs client state for the bell) into a sub-component.
- **No `clearInterval` cleanup:** Every `setInterval` in a `useEffect` must be cleaned up with `return () => clearInterval(id)` to prevent memory leaks and duplicate polls after remount.
- **Purple colors anywhere in the UI:** Bell badge must use red (`#ef4444`), not blue, not purple. Activity feed items: use gray/blue palette only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| @mention parsing | Custom lexer/AST | `content.matchAll(/@(\w+)/g)` | Comments are plain textarea text; regex is sufficient and fast |
| Notification delivery | WebSocket push / SSE | `setInterval` polling every 60 s | Project has locked in polling-only per prior decisions |
| User name resolution for @mentions | Fuzzy matching / NLP | Exact `user.name` match via `prisma.user.findMany({ where: { name: { in: names } } })` | Portfolio scale; exact match is correct and simple |
| Deduplication of mention notifications | Custom logic | `createMany({ skipDuplicates: true })` | Prisma handles at DB level; prevents duplicate notifications on comment edit with same @mention |
| Cursor pagination | Custom offset logic | Prisma `{ where: { createdAt: { lt: cursor } }, orderBy: { createdAt: 'desc' }, take: 20 }` | Well-understood pattern; handles concurrent inserts correctly |
| Mark-all-read | Loop over IDs | `prisma.notification.updateMany({ where: { recipientId, read: false } })` | Single DB query; no N+1 |
| Activity event writing across services | Event bus / EventEmitter | Direct `prisma.activityEvent.create()` in each service | EventEmitter adds indirection without benefit at this scale; direct call is testable and obvious |

**Key insight:** Phase 19 builds on the exact same infrastructure as Phases 16-18. The challenge is not the technology — it is the placement of side-effect calls (notification creation, activity logging) within existing service methods and keeping those methods clean.

---

## Common Pitfalls

### Pitfall 1: @Mention Resolution Matches Users Outside the Workspace

**What goes wrong:** `prisma.user.findMany({ where: { name: { in: names } } })` without workspace scope returns users from ALL workspaces. A user named "Alice" in Workspace B gets a notification for a mention in Workspace A's comment.

**Why it happens:** Forgetting to scope the user lookup to workspace members.

**How to avoid:** Always include the workspace membership filter:
```typescript
where: {
  name: { in: names },
  workspaceMemberships: { some: { workspaceId } },
}
```

**Warning signs:** Notification recipient is not a member of the workspace.

---

### Pitfall 2: Duplicate Notifications on Comment Edit

**What goes wrong:** A user edits a comment to change `"Hello @Alice"` to `"Hello @Alice and @Bob"`. The service creates a new mention notification for Alice (who was already notified on the original create). Alice gets two notifications.

**Why it happens:** `notifyMentions` is called on both `create` and `update` without deduplication.

**How to avoid:** Use `skipDuplicates: true` on `createMany`. Requires that the `Notification` model has a `@@unique` constraint on `[recipientId, actorId, commentId]` — if a notification already exists for that combo, it is skipped. Add this unique constraint to the schema.

```prisma
@@unique([recipientId, actorId, commentId, type])  // prevents duplicate mention notifications
```

---

### Pitfall 3: Route Conflict — Static Segment vs Param Segment

**What goes wrong:** `GET /notifications/unread-count` is interpreted as `GET /notifications/:id` where `id = 'unread-count'`. The service then tries to look up a notification with ID `'unread-count'` and returns 404.

**Why it happens:** NestJS routes are matched in declaration order. If `@Get(':id')` is declared before `@Get('unread-count')`, the param route wins.

**How to avoid:** Declare static segment routes BEFORE param segment routes in the controller:
```typescript
@Get('unread-count')   // FIRST
unreadCount() { ... }

@Get(':id')            // AFTER
findOne() { ... }

@Patch('read-all')     // FIRST — before :id/read
markAllRead() { ... }

@Patch(':id/read')     // AFTER
markRead() { ... }
```

**Warning signs:** `GET /notifications/unread-count` returns 404 or "notification not found" instead of `{ count: N }`.

---

### Pitfall 4: setInterval Leak on Component Remount

**What goes wrong:** User navigates away from workspace and back. The workspace layout remounts. A second `setInterval` is created but the first was never cleared. Now two polls fire every 60 s — eventually many intervals stack up.

**Why it happens:** `setInterval` without cleanup in `useEffect`.

**How to avoid:** Always return a cleanup function:
```typescript
useEffect(() => {
  fetchUnreadCount();
  const id = setInterval(fetchUnreadCount, 60_000);
  return () => clearInterval(id);  // REQUIRED
}, [fetchUnreadCount]);
```

**Warning signs:** Network tab shows doubling requests over time.

---

### Pitfall 5: Activity Feed Polling Replaces "Load More" Pages

**What goes wrong:** The 30 s poll fetches the first page and `setEvents(data.events)` — this replaces the entire feed including older items the user loaded via "Load More". User sees the feed collapse to 20 items.

**Why it happens:** Naive replacement of state array on refresh.

**How to avoid:** On the 30 s refresh, merge new items at the TOP:
```typescript
setEvents(prev => {
  // New events have IDs not in prev
  const existingIds = new Set(prev.map(e => e.id));
  const newEvents = data.events.filter(e => !existingIds.has(e.id));
  return [...newEvents, ...prev];
});
// Do NOT replace nextCursor on a refresh-only poll — keep the existing cursor
```

**Warning signs:** "Load More" shows items that already appear in the feed; feed jumps to 20 items every 30 s.

---

### Pitfall 6: `CommentsService` Can't Access `NotificationsService` Without Circular Dependency

**What goes wrong:** Developer creates a `NotificationsModule` that exports `NotificationsService`. Developer imports `NotificationsModule` into `CommentsModule`. If `CommentsModule` is also used inside some dependency of `NotificationsModule`, a circular dependency occurs.

**How to avoid:** Don't inject `NotificationsService` into `CommentsService`. Instead, call `this.prisma.notification.createMany()` directly in `CommentsService` — `PrismaService` is already injected. Same for activity logging in other services. No cross-module service injection needed.

**Warning signs:** NestJS startup error: `Circular dependency detected`.

---

### Pitfall 7: The `'Reaction'` and `'User'` Subjects are Missing from WorkspaceAbilityFactory

**What goes wrong:** `@CheckAbility('read', 'Notification')` triggers the guard's CASL check for a non-slug route (guard returns early, so this is fine). But `@CheckAbility('read', 'ActivityEvent')` for the workspace-scoped feed endpoint triggers a real CASL check. If `'ActivityEvent'` is not in the `Subject` type union and not granted in the ability builder, the guard throws `ForbiddenException`.

**How to avoid:** Add `'Notification'` and `'ActivityEvent'` to the `Subject` type. Grant `can('read', 'ActivityEvent')` to Contributor and Viewer roles.

**Warning signs:** `GET /workspaces/:slug/activity` returns 403 for Contributor role users.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### Prisma Schema — Notification + ActivityEvent

```prisma
// Source: project schema conventions (packages/devcollab-database/prisma/schema.prisma)
// Add these models:

enum ActivityEventType {
  MemberJoined
  PostCreated
  PostUpdated
  SnippetCreated
  SnippetUpdated
}

model Notification {
  id          String   @id @default(cuid())
  type        String   @default("mention")
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  recipientId String
  actorId     String
  commentId   String?
  workspaceId String

  recipient   User      @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor       User      @relation("NotificationActor", fields: [actorId], references: [id], onDelete: Cascade)
  comment     Comment?  @relation(fields: [commentId], references: [id], onDelete: SetNull)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([recipientId, actorId, commentId, type])  // prevent duplicate mention notifications
  @@index([recipientId, read])
  @@index([recipientId, createdAt])
  @@index([workspaceId])
}

model ActivityEvent {
  id          String            @id @default(cuid())
  type        ActivityEventType
  entityId    String
  entityType  String            // 'Post' | 'Snippet' | 'User'
  createdAt   DateTime          @default(now())

  workspaceId String
  actorId     String

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actor       User      @relation(fields: [actorId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([actorId])
}
```

### Migration Command

```bash
cd /home/doctor/fernandomillan
npx prisma migrate dev --name add-notifications-activity \
  --schema=packages/devcollab-database/prisma/schema.prisma
```

### NotificationsModule Registration

```typescript
// Source: app.module.ts pattern (same as CommentsModule, ReactionsModule in Phase 18)
// apps/devcollab-api/src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],  // NOT needed — no cross-module injection
})
export class NotificationsModule {}

// apps/devcollab-api/src/app.module.ts — add:
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
// In @Module imports array:
NotificationsModule,
ActivityModule,
```

### Notification List Item — Link Back to Source Comment

The notification `list` endpoint returns `commentId`, `postId` (from comment), `snippetId` (from comment), and workspace `slug`. The frontend constructs the deep link:

```typescript
// Source: project URL conventions (app/w/[slug]/posts/[id]/page.tsx pattern)
function notificationLink(n: Notification): string {
  if (n.comment?.postId) return `/w/${n.workspace.slug}/posts/${n.comment.postId}`;
  if (n.comment?.snippetId) return `/w/${n.workspace.slug}/snippets/${n.comment.snippetId}`;
  return `/w/${n.workspace.slug}`;
}
```

### Activity Feed Item — Human-Readable Label

```typescript
// Source: project conventions (no external i18n library used)
function activityLabel(event: ActivityEvent): string {
  const actor = event.actor.name ?? event.actor.email;
  switch (event.type) {
    case 'MemberJoined':    return `${actor} joined the workspace`;
    case 'PostCreated':     return `${actor} created a post`;
    case 'PostUpdated':     return `${actor} updated a post`;
    case 'SnippetCreated':  return `${actor} created a snippet`;
    case 'SnippetUpdated':  return `${actor} updated a snippet`;
    default:                return `${actor} performed an action`;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket push for notifications | Polling every 60 s | Locked decision (this project) | No socket.io needed; Postgres is the source of truth |
| Server-Sent Events (SSE) for live feed | 30 s polling | Locked decision (this project) | Simpler; no persistent connection handling |
| Offset pagination (`skip`/`take`) | Cursor pagination (`createdAt: { lt: cursor }`) | Best practice since ~2019 | Stable under concurrent inserts — no row drift |
| `EventEmitter` / Bull queue for activity logging | Direct Prisma write in service methods | Portfolio-scale decision | Simpler, no queue infra, synchronous = easier to reason about |
| `useOptimistic` (React 19) for mark-as-read | `useState` direct update | Project does not use Server Actions | Consistent with Phase 18 reaction toggle pattern |

**Deprecated/outdated:**
- `Long polling` (repeated HTTP with held connections): Not needed — 60 s and 30 s short-interval polling is correct here.
- `Notification` browser API: This is an in-app notification panel, not OS push notifications. No browser Notification API used.

---

## Open Questions

1. **What happens when `user.name` is null for @mention matching?**
   - What we know: `User.name` is nullable in the schema (`name String?`). A user without a name set cannot be @mentioned by name.
   - What's unclear: Should we fall back to email-based matching? E.g., `@user@example.com`?
   - Recommendation: For Phase 19, only match against non-null `user.name`. The requirement says `@name` — if a user has no name set, they cannot be mentioned. Add `where: { name: { in: names, not: null } }` to the query. This is acceptable at portfolio scale.

2. **Should the notification bell live in the workspace layout or the global app layout?**
   - What we know: The current workspace layout (`app/w/[slug]/layout.tsx`) is the closest "always visible" surface inside a workspace. The global `app/layout.tsx` is outside the workspace context.
   - Recommendation: Place the bell in the workspace layout (`app/w/[slug]/layout.tsx`) — notifications are scoped to workspace membership. The bell polls `/notifications/unread-count` which is user-scoped (no slug needed), so it works anywhere. Placing it in the workspace layout is consistent with where the user is doing workspace work.

3. **Should activity events link to the entity (post/snippet)?**
   - What we know: `ActivityEvent` stores `entityId` + `entityType`. The feed response includes this data. Linking requires the workspace slug.
   - Recommendation: Return `workspace.slug` in the activity feed response. Construct links client-side: `entityType === 'Post' ? /w/${slug}/posts/${entityId} : /w/${slug}/snippets/${entityId}`.

4. **What is the `@@unique` constraint impact on mention notifications when `commentId` is null?**
   - What we know: `@@unique([recipientId, actorId, commentId, type])` — if `commentId` is null, PostgreSQL treats NULLs as distinct in unique constraints. So two rows with `recipientId=A, actorId=B, commentId=null, type='mention'` are NOT considered duplicates by the `@@unique` constraint.
   - Resolution: For Phase 19, `commentId` is always set for mention notifications (they always come from a comment). The constraint works correctly. If future notification types have no `commentId`, this needs revisiting. For now, this is fine.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase direct read — `packages/devcollab-database/prisma/schema.prisma` (lines 1-170, confirmed current state), `apps/devcollab-api/src/guards/casl-auth.guard.ts` (confirmed non-slug route behavior at line 60-61), `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` (confirmed Subject union + role grants), `apps/devcollab-api/src/core/database/prisma.service.ts` (confirmed getter pattern), `apps/devcollab-api/src/comments/comments.service.ts` (confirmed service pattern), `apps/devcollab-api/src/reactions/reactions.service.ts` (confirmed PrismaClientKnownRequestError handling), `apps/devcollab-web/components/discussion/ThreadedComments.tsx` (confirmed useCallback+useEffect polling pattern), `apps/devcollab-web/app/w/[slug]/layout.tsx` (confirmed Server Component — no 'use client')
- Phase 18 RESEARCH.md + VERIFICATION.md — confirmed all established patterns (flat comment fetch, service-layer owner check, SSR cookie forwarding, `@CheckAbility` guard behavior)
- Phase 18 migration SQL — confirmed Prisma migration format and table structure

### Secondary (MEDIUM confidence)
- Prisma cursor pagination documentation — `prisma.model.findMany({ where: { createdAt: { lt: cursor } }, orderBy: { createdAt: 'desc' }, take: N })` pattern; consistent with Prisma v5 behavior
- NestJS controller route ordering behavior — static segments before param segments in same HTTP method; confirmed as NestJS standard behavior (matches Express routing rules)
- `prisma.notification.createMany({ skipDuplicates: true })` — standard Prisma `createMany` option; available since Prisma 2.26.0; project uses Prisma ^5.x which is confirmed to support it

### Tertiary (LOW confidence — validate before implementing)
- PostgreSQL behavior of `@@unique` with NULL columns: "NULLs are distinct" means two rows with `NULL` in the same unique column are NOT considered duplicates. This is standard PostgreSQL behavior but verify the `@@unique([recipientId, actorId, commentId, type])` works as expected when commentId is always non-null for mention notifications.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all confirmed via direct codebase read
- Architecture patterns: HIGH — all patterns derived from confirmed codebase conventions; guard behavior for non-slug routes confirmed by reading `casl-auth.guard.ts` source
- Pitfalls: HIGH — derived from reading existing service code and established Phase 18 patterns; route ordering pitfall is confirmed NestJS behavior
- Prisma schema additions: HIGH — follows exact schema conventions of existing models (cuid IDs, @default(now()), cascade deletes, named relation strings for multi-FK models)
- Open questions: LOW — all have reasonable answers but none are verified by running code

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (Prisma 5, NestJS 11, Next.js 15 are all stable; re-verify if major version bumps)
