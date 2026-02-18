---
phase: 17-content-creation-snippets-posts
plan: 02
subsystem: api
tags: [nestjs, prisma, casl, rbac, snippets, posts, crud]

# Dependency graph
requires:
  - phase: 17-01
    provides: Prisma Snippet/Post models with authorId, migration applied, PrismaService snippet/post getters, CASL Contributor delete ability
  - phase: 16-workspaces-membership-rbac
    provides: CaslAuthGuard APP_GUARD, CheckAbility decorator, WorkspacesModule pattern, DatabaseModule, JwtPayload
provides:
  - SnippetsController with 5 CRUD endpoints (POST, GET list, GET single, PATCH, DELETE) all @CheckAbility decorated
  - SnippetsService with owner-scoped update/delete (ForbiddenException if not author and not Admin)
  - PostsController with 6 endpoints (POST, GET list, GET single, PATCH edit, PATCH status, DELETE) all @CheckAbility decorated
  - PostsService with draft-visibility filter and owner-scoped update/delete/setStatus
  - AppModule wired with SnippetsModule and PostsModule
  - Meta-test covering 24 deny-by-default invariant checks across 5 controllers
affects: [17-03, 17-04, 17-05, frontend-snippet-ui, frontend-post-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Owner-scoped service pattern: service layer throws ForbiddenException if requester is not author AND not Admin"
    - "Draft-visibility pattern: findAll/findOne only return Draft posts to their own author, Published to all"
    - "NestJS module pattern: imports DatabaseModule, provides Service, declares Controller"

key-files:
  created:
    - apps/devcollab-api/src/snippets/snippets.module.ts
    - apps/devcollab-api/src/snippets/snippets.controller.ts
    - apps/devcollab-api/src/snippets/snippets.service.ts
    - apps/devcollab-api/src/snippets/dto/create-snippet.dto.ts
    - apps/devcollab-api/src/snippets/dto/update-snippet.dto.ts
    - apps/devcollab-api/src/posts/posts.module.ts
    - apps/devcollab-api/src/posts/posts.controller.ts
    - apps/devcollab-api/src/posts/posts.service.ts
    - apps/devcollab-api/src/posts/dto/create-post.dto.ts
    - apps/devcollab-api/src/posts/dto/update-post.dto.ts
  modified:
    - apps/devcollab-api/src/app.module.ts
    - apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts

key-decisions:
  - "[Phase 17]: SnippetsController routes use @Controller('workspaces/:slug/snippets') — workspace-scoped URL pattern consistent with WorkspacesController"
  - "[Phase 17]: PostsService setStatus sets publishedAt to new Date() when transitioning to Published, null when reverting to Draft"
  - "[Phase 17]: PostsController PATCH :id/status declared after PATCH :id — NestJS resolves specific paths before dynamic when using distinct segments"
  - "[Phase 17]: Meta-test expanded from 3 to 5 controllers; test count grows from 13 to 24 as each handler is checked individually"

patterns-established:
  - "Owner-check pattern: service fetches workspaceMember role for requester, throws ForbiddenException if authorId !== requesterId AND role !== Admin"
  - "Draft-visibility pattern: OR: [{ status: Published }, { authorId: requesterId }] filter on post queries"

requirements-completed: [SNIP-01, SNIP-04, POST-01, POST-02, POST-03, RBAC-02, RBAC-03]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 02: Snippets and Posts CRUD API Summary

**NestJS SnippetsModule and PostsModule with RBAC-enforced controllers, owner-scoped service-layer checks, and draft-visibility filtering wired into AppModule**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T04:18:28Z
- **Completed:** 2026-02-18T04:20:22Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- SnippetsController: 5 route handlers (create, findAll, findOne, update, remove) each decorated with @CheckAbility enforcing CASL guard
- PostsController: 6 route handlers (create, findAll, findOne, update, setStatus, remove) each decorated with @CheckAbility; setStatus toggles Draft/Published with publishedAt timestamp
- SnippetsService and PostsService both enforce owner-only mutations via workspaceMember role check; Admin bypass is implicit (guard granted manage:all)
- PostsService findAll/findOne filter Draft posts so only the author can see their own unpublished content
- AppModule imports SnippetsModule and PostsModule; deny-by-default meta-test expanded to 24 tests across 5 controllers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SnippetsModule (module, controller, service, DTOs)** - `3e0dc2c` (feat)
2. **Task 2: Create PostsModule + wire both modules into AppModule + update meta-test** - `472875e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-api/src/snippets/snippets.controller.ts` - 5 CRUD endpoints, all @CheckAbility decorated
- `apps/devcollab-api/src/snippets/snippets.service.ts` - CRUD with owner-scoped update/delete
- `apps/devcollab-api/src/snippets/snippets.module.ts` - Module wiring DatabaseModule
- `apps/devcollab-api/src/snippets/dto/create-snippet.dto.ts` - title, language, code fields
- `apps/devcollab-api/src/snippets/dto/update-snippet.dto.ts` - optional title, language, code
- `apps/devcollab-api/src/posts/posts.controller.ts` - 6 endpoints including PATCH status toggle
- `apps/devcollab-api/src/posts/posts.service.ts` - CRUD with draft-visibility and owner-scoped mutations
- `apps/devcollab-api/src/posts/posts.module.ts` - Module wiring DatabaseModule
- `apps/devcollab-api/src/posts/dto/create-post.dto.ts` - title, content fields
- `apps/devcollab-api/src/posts/dto/update-post.dto.ts` - optional title, content
- `apps/devcollab-api/src/app.module.ts` - Added SnippetsModule and PostsModule imports
- `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` - Added SnippetsController and PostsController to ALL_CONTROLLERS; 24 tests all pass

## Decisions Made
- PostsService.setStatus sets `publishedAt: new Date()` when transitioning to Published and `publishedAt: null` when reverting to Draft — tracks publication timestamps
- PostsController declares `PATCH :id/status` as a separate handler after `PATCH :id` — NestJS resolves routes in declaration order, specific `status` segment prevents collision with generic `:id` patch
- Meta-test count grew from 13 to 24 as each new handler on both new controllers is individually verified for @Public or @CheckAbility presence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SnippetsModule and PostsModule are fully functional backend APIs ready for frontend integration in Phase 17 Plans 03-05
- All RBAC requirements enforced: Viewer gets 403 on mutations (guard level), Contributor can only edit/delete own content (service level)
- Meta-test passing confirms deny-by-default invariant is maintained across all 5 controllers (24 handler-level checks)

---
*Phase: 17-content-creation-snippets-posts*
*Completed: 2026-02-18*
