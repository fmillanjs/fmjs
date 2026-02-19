---
phase: 19-notifications-activity-feed
plan: 02
subsystem: api
tags: [nestjs, prisma, notifications, activity-feed, cursor-pagination, casl]

requires:
  - phase: 19-01
    provides: Notification + ActivityEvent Prisma models, migration applied to devcollab-postgres, PrismaService getters (notification, activityEvent), CASL Subject union extended

provides:
  - NotificationsModule with 4 endpoints (list, unread-count, read-all, :id/read) and correct static-before-param route order
  - ActivityModule with GET /workspaces/:slug/activity endpoint and cursor pagination (nextCursor)
  - @mention notification side-effects in CommentsService (create + update)
  - ActivityEvent logging in WorkspacesService.joinWorkspace, PostsService.create/update, SnippetsService.create/update
  - AppModule registers NotificationsModule + ActivityModule
  - Meta-test expanded to 9 controllers, 34 tests all passing

affects: [19-03, 19-04, 20-search, frontend-notifications]

tech-stack:
  added: []
  patterns:
    - Static-before-param NestJS route order for GET unread-count / PATCH read-all before :id variants
    - Cursor pagination pattern using createdAt ISO string as cursor, PAGE_SIZE=20, nextCursor in response
    - notifyMentions private helper: regex @mention extraction + workspace-scoped user lookup + notification.createMany with skipDuplicates
    - ActivityEvent write-after-create pattern in service layer (fire-and-forget style, no transaction needed)

key-files:
  created:
    - apps/devcollab-api/src/notifications/notifications.controller.ts
    - apps/devcollab-api/src/notifications/notifications.service.ts
    - apps/devcollab-api/src/notifications/notifications.module.ts
    - apps/devcollab-api/src/notifications/dto/mark-read.dto.ts
    - apps/devcollab-api/src/activity/activity.controller.ts
    - apps/devcollab-api/src/activity/activity.service.ts
    - apps/devcollab-api/src/activity/activity.module.ts
    - apps/devcollab-api/src/activity/dto/feed-query.dto.ts
  modified:
    - apps/devcollab-api/src/comments/comments.service.ts
    - apps/devcollab-api/src/workspaces/workspaces.service.ts
    - apps/devcollab-api/src/posts/posts.service.ts
    - apps/devcollab-api/src/snippets/snippets.service.ts
    - apps/devcollab-api/src/app.module.ts
    - apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts

key-decisions:
  - "JwtPayload imported from current-user.decorator.ts in NotificationsController — single source of truth, avoids local redefinition"
  - "notifyMentions uses skipDuplicates:true in notification.createMany — prevents duplicate notifications on comment edits"
  - "extractMentionedNames uses Set deduplication + type-guard filter for string | undefined from regex match groups"
  - "ActivityService.findFeed returns workspaceSlug in response — enables frontend deep-links without secondary lookup"
  - "Renamed update() local result vars (updated) to avoid TS2451 redeclaration errors with existing findFirst variables"

patterns-established:
  - "Static route declared before parameterized route in NestJS controllers to prevent route shadowing"
  - "Private service helpers (extractMentionedNames, notifyMentions) added above public methods in service class"
  - "Write-after-create for activity events: capture primary result, create event, return primary result"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03, FEED-01]

duration: 2min
completed: 2026-02-18
---

# Phase 19 Plan 02: Notifications + Activity Feed Backend Summary

**NotificationsModule (4 endpoints) + ActivityModule (cursor-paginated feed) created; @mention notifications wired into CommentsService; ActivityEvent logging added to 5 service operations; meta-test expanded to 9 controllers (34 tests)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T08:14:13Z
- **Completed:** 2026-02-18T08:16:32Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Created NotificationsController with 4 endpoints in correct static-before-param order (GET unread-count, GET /, PATCH read-all, PATCH :id/read) — all decorated with @CheckAbility
- Created ActivityController scoped to GET /workspaces/:slug/activity with cursor pagination returning {events, nextCursor, workspaceSlug}
- Wired @mention notifications into CommentsService.create() and CommentsService.update() via private notifyMentions() helper using workspace-scoped user resolution
- Added ActivityEvent rows after WorkspacesService.joinWorkspace, PostsService.create, PostsService.update, SnippetsService.create, SnippetsService.update
- AppModule now imports NotificationsModule and ActivityModule; meta-test expanded from 24 to 34 tests covering all 9 controllers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create NotificationsModule + ActivityModule** - `4ce4f69` (feat)
2. **Task 2: Wire mention notifications + activity logging + expand meta-test** - `3cec0f9` (feat)

## Files Created/Modified

- `apps/devcollab-api/src/notifications/notifications.controller.ts` - 4 CRUD endpoints with static-before-param route order
- `apps/devcollab-api/src/notifications/notifications.service.ts` - list, unreadCount, markRead, markAllRead methods
- `apps/devcollab-api/src/notifications/notifications.module.ts` - imports DatabaseModule
- `apps/devcollab-api/src/notifications/dto/mark-read.dto.ts` - empty DTO (param only)
- `apps/devcollab-api/src/activity/activity.controller.ts` - GET /workspaces/:slug/activity
- `apps/devcollab-api/src/activity/activity.service.ts` - findFeed with PAGE_SIZE=20 cursor pagination
- `apps/devcollab-api/src/activity/activity.module.ts` - imports DatabaseModule
- `apps/devcollab-api/src/activity/dto/feed-query.dto.ts` - optional cursor field
- `apps/devcollab-api/src/comments/comments.service.ts` - added extractMentionedNames + notifyMentions; called in create + update
- `apps/devcollab-api/src/workspaces/workspaces.service.ts` - MemberJoined ActivityEvent written in joinWorkspace
- `apps/devcollab-api/src/posts/posts.service.ts` - PostCreated/PostUpdated ActivityEvent written in create/update
- `apps/devcollab-api/src/snippets/snippets.service.ts` - SnippetCreated/SnippetUpdated ActivityEvent written in create/update
- `apps/devcollab-api/src/app.module.ts` - NotificationsModule + ActivityModule added to imports
- `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` - CommentsController, ReactionsController, NotificationsController, ActivityController added; 34 tests pass

## Decisions Made

- JwtPayload imported from `current-user.decorator.ts` in NotificationsController — per Phase 16 pattern (single source of truth)
- `notifyMentions` uses `skipDuplicates: true` in `notification.createMany` to prevent duplicate notifications when a comment is edited with the same mentions
- `extractMentionedNames` uses type-guard filter `(n): n is string` to satisfy TypeScript strict mode on `RegExpMatchArray[1]` being `string | undefined`
- `ActivityService.findFeed` returns `workspaceSlug` alongside events/nextCursor to enable frontend deep-links without requiring a secondary API call
- Update method local variables renamed to `updated` where `snippet`/`post`/`comment` was already declared from a `findFirst` guard in the same scope — avoids TS2451 block-scoped redeclaration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict index access on array in ActivityService**
- **Found during:** Task 1 (Create ActivityModule)
- **Issue:** `events[events.length - 1]` typed as `T | undefined` under noUncheckedIndexedAccess — TS2532 error
- **Fix:** Added `const lastEvent = events[events.length - 1]` with null guard `lastEvent &&` before accessing `.createdAt`
- **Files modified:** apps/devcollab-api/src/activity/activity.service.ts
- **Verification:** `tsc --noEmit` exits 0
- **Committed in:** 4ce4f69 (Task 1 commit)

**2. [Rule 1 - Bug] TypeScript strict type on regex match group in CommentsService**
- **Found during:** Task 2 (Wire CommentsService)
- **Issue:** `m[1]` from `RegExpMatchArray` is `string | undefined`, not `string[]` — TS2322 error in extractMentionedNames
- **Fix:** Added `.filter((n): n is string => n !== undefined)` type-guard after `.map`
- **Files modified:** apps/devcollab-api/src/comments/comments.service.ts
- **Verification:** `tsc --noEmit` exits 0
- **Committed in:** 3cec0f9 (Task 2 commit)

**3. [Rule 1 - Bug] Variable name conflicts in update() methods across 3 services**
- **Found during:** Task 2 (Wire PostsService, SnippetsService, CommentsService)
- **Issue:** Plan instructed `const comment/post/snippet =` for the update result, but all three methods already use that variable name for the `findFirst` guard — TS2451 redeclaration errors
- **Fix:** Renamed update result to `updated` in CommentsService.update, PostsService.update, SnippetsService.update
- **Files modified:** comments.service.ts, posts.service.ts, snippets.service.ts
- **Verification:** `tsc --noEmit` exits 0; meta-test 34/34 passes
- **Committed in:** 3cec0f9 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3x Rule 1 - Bug)
**Impact on plan:** All fixes were TypeScript strict mode correctness issues. No behavioral impact. No scope creep.

## Issues Encountered

None beyond the auto-fixed TypeScript strict mode errors documented above.

## Next Phase Readiness

- Backend API is complete: 4 notification endpoints + 1 activity feed endpoint all authenticated via CASL
- ActivityEvent rows are now written on workspace join, post create/update, snippet create/update
- Notification rows are created on @mention in comments (create + update, deduplicated)
- Phase 19 Plan 03 (frontend notification bell + unread badge) can consume GET /notifications/unread-count and PATCH /notifications/read-all immediately
- Phase 19 Plan 04 (activity feed UI) can consume GET /workspaces/:slug/activity with cursor param

---
*Phase: 19-notifications-activity-feed*
*Completed: 2026-02-18*
