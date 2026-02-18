---
phase: 18-discussions-reactions
plan: 02
subsystem: api
tags: [nestjs, comments, reactions, casl, prisma, soft-delete, tree-assembly]

# Dependency graph
requires:
  - phase: 18-discussions-reactions
    plan: 01
    provides: Comment and Reaction Prisma models with self-relation, PrismaService .comment/.reaction getters

provides:
  - CommentsModule with service (create, findAll flat+tree, update owner-only, remove soft/hard), controller (POST/GET/PATCH/DELETE), DTOs
  - ReactionsModule with service (toggleReaction with P2002 handling), controller (POST), DTO
  - AppModule updated to import CommentsModule and ReactionsModule
  - All 5 discussion API endpoints active and guarded under /workspaces/:slug/*

affects: [18-03, 18-04, 19-search, 20-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - In-memory comment tree assembly using Map (flat Prisma fetch + loop, no recursive include)
    - Owner-only update guard: Admin role cannot bypass ForbiddenException on comment edit
    - Soft-delete vs hard-delete: owner gets soft-delete (content='[deleted]'), Admin on others gets hard-delete
    - P2002 race condition handling in ReactionsService create via try/catch PrismaClientKnownRequestError

key-files:
  created:
    - apps/devcollab-api/src/comments/dto/create-comment.dto.ts
    - apps/devcollab-api/src/comments/dto/update-comment.dto.ts
    - apps/devcollab-api/src/comments/comments.service.ts
    - apps/devcollab-api/src/comments/comments.controller.ts
    - apps/devcollab-api/src/comments/comments.module.ts
    - apps/devcollab-api/src/reactions/dto/toggle-reaction.dto.ts
    - apps/devcollab-api/src/reactions/reactions.service.ts
    - apps/devcollab-api/src/reactions/reactions.controller.ts
    - apps/devcollab-api/src/reactions/reactions.module.ts
  modified:
    - apps/devcollab-api/src/app.module.ts

key-decisions:
  - "CommentsService.update is owner-only unconditionally — Admin role does NOT bypass; only comment.authorId === requesterId may edit"
  - "CommentsService.remove: soft-delete for owner (content='[deleted]', deletedAt=new Date()); hard-delete for Admin on others' comments"
  - "In-memory tree assembly: flat findMany (max 2 DB queries total), Map<id, node>, iterate once to assign replies — no recursive Prisma include"
  - "ReactionsService toggleReaction: findUnique first, delete if exists or create if not; catch P2002 for race condition idempotency"
  - "webpack bundle rebuilt (nest build) to update main.js after watch mode compiled only incremental tsc output to dist/apps/"

patterns-established:
  - "Workspace-first pattern extended to CommentsService and ReactionsService — same as SnippetsService/PostsService"
  - "Flat fetch + in-memory tree: use Map(flat.map(c => [c.id, {...c, replies:[]}])), iterate to push into parent, collect roots"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 18 Plan 02: Discussions + Reactions — API Layer Summary

**CommentsModule (create/findAll-tree/update-owner-only/remove-soft-hard) and ReactionsModule (toggle-with-P2002) wired into AppModule; all 5 discussion endpoints active and guarded**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T06:17:42Z
- **Completed:** 2026-02-18T06:22:17Z
- **Tasks:** 2
- **Files modified:** 10 (9 created, 1 modified)

## Accomplishments
- CommentsService with reply-to-reply guard (BadRequestException if parent.parentId non-null), flat Prisma fetch + in-memory Map tree assembly (max 2 DB queries), strict owner-only update (ForbiddenException regardless of Admin role), and soft/hard-delete logic
- ReactionsService with findUnique/delete/create toggle pattern, P2002 race condition caught via PrismaClientKnownRequestError
- CommentsController (POST/GET/PATCH/DELETE) and ReactionsController (POST) with @CheckAbility decorators and @CurrentUser extraction
- AppModule updated with CommentsModule and ReactionsModule — API boots without errors
- All endpoints return 401 for unauthenticated requests (CASL guard active)

## Task Commits

Each task was committed atomically:

1. **Task 1: CommentsModule — DTOs, service, controller, module file** - `b58d6e6` (feat)
2. **Task 2: ReactionsModule + AppModule wiring** - `71dd778` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-api/src/comments/dto/create-comment.dto.ts` - content, postId, snippetId, parentId fields
- `apps/devcollab-api/src/comments/dto/update-comment.dto.ts` - content field only
- `apps/devcollab-api/src/comments/comments.service.ts` - create (reply-to-reply guard), findAll (flat+tree), update (owner-only), remove (soft/hard-delete)
- `apps/devcollab-api/src/comments/comments.controller.ts` - POST/GET/PATCH/DELETE under workspaces/:slug/comments
- `apps/devcollab-api/src/comments/comments.module.ts` - DatabaseModule + CommentsService + CommentsController
- `apps/devcollab-api/src/reactions/dto/toggle-reaction.dto.ts` - emoji, postId, commentId fields
- `apps/devcollab-api/src/reactions/reactions.service.ts` - toggleReaction (findUnique/delete/create + P2002 catch)
- `apps/devcollab-api/src/reactions/reactions.controller.ts` - POST /workspaces/:slug/reactions
- `apps/devcollab-api/src/reactions/reactions.module.ts` - DatabaseModule + ReactionsService + ReactionsController
- `apps/devcollab-api/src/app.module.ts` - added CommentsModule and ReactionsModule to imports array

## Decisions Made
- CommentsService.update is strictly owner-only — the plan explicitly states Admin cannot bypass the ForbiddenException check on edit; only hard-delete is Admin's privilege
- In-memory tree assembly uses a single-pass Map loop rather than recursive Prisma include — keeps DB queries at 2 maximum regardless of tree depth
- ReactionsService uses `userId_emoji_postId` and `userId_emoji_commentId` named unique indexes matching the Prisma schema @@unique constraints
- webpack bundle rebuilt via `nest build` — the running `nest start --watch` process was not regenerating the root main.js (it compiled incremental tsc output only); rebuild was needed to include new modules in the running server

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt webpack bundle after nest start --watch did not update running main.js**
- **Found during:** Task 2 verification (smoke test returned 404 instead of 401)
- **Issue:** `nest start --watch` (PID 51304) compiled incremental tsc output to `dist/apps/` but did not regenerate `dist/main.js` (the webpack bundle). The API process (PID 67041) was running the old webpack bundle which lacked CommentsModule and ReactionsModule.
- **Fix:** Ran `npm run build` in apps/devcollab-api to regenerate `dist/main.js` via webpack, confirmed both modules appear in bundle (12 matches for CommentsModule/ReactionsModule), then restarted the API process with correct env vars.
- **Files modified:** `dist/main.js` (runtime artifact, not committed)
- **Verification:** `curl http://localhost:3003/health` returns 200; both /comments and /reactions endpoints return 401
- **Committed in:** Not committed (dist is gitignored runtime artifact)

---

**Total deviations:** 1 auto-fixed (1 blocking — webpack bundle rebuild)
**Impact on plan:** The webpack rebuild was necessary for the running server to include the new modules. No scope creep; this is standard NestJS workflow when watch mode is running but not regenerating the webpack bundle.

## Issues Encountered
- `nest start --watch` compiled incremental JS files to `dist/apps/devcollab-api/src/` but did not update the webpack-bundled `dist/main.js` that the API process was actually executing. Resolved by running `nest build` to regenerate the webpack bundle and restarting the API process.

## User Setup Required
None - no external service configuration required. The API process runs locally.

## Next Phase Readiness
- CommentsModule and ReactionsModule are live with correct CASL guards
- Plan 18-03 (frontend comment/reaction components) can call these endpoints directly
- Plan 18-04 (e2e tests) can test all 5 endpoints

---
*Phase: 18-discussions-reactions*
*Completed: 2026-02-18*
