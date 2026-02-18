---
phase: 16-workspaces-membership-rbac
plan: "02"
subsystem: api

tags: [casl, rbac, nestjs, guards, workspaces]

requires:
  - phase: 16-01
    provides: Prisma schema with Workspace/WorkspaceMember/InviteLink models and PrismaService accessors
  - phase: 15-02
    provides: CaslAuthGuard base implementation with deny-by-default, @CheckAbility decorator, CHECK_ABILITY_KEY

provides:
  - WorkspaceAbilityFactory: loads membership role from DB, builds CASL ability per Admin/Contributor/Viewer role
  - WorkspacesModule skeleton: imports DatabaseModule, provides and exports WorkspaceAbilityFactory
  - Upgraded async CaslAuthGuard: workspace-scoped ability evaluation via :slug param
  - AppModule imports WorkspacesModule so guard can inject WorkspaceAbilityFactory

affects:
  - 16-03 (WorkspacesController uses WorkspacesModule)
  - 17-workspaces-content (Contributor own-content-only authorId condition deferred here)

tech-stack:
  added: []
  patterns:
    - CASL ability builder per role (Admin/Contributor/Viewer) using AbilityBuilder + createMongoAbility
    - Workspace-scoped guard: :slug param triggers DB membership lookup; no :slug bypasses to service layer
    - WorkspacesModule skeleton pattern: exported before controller added (Plan 03 adds controller)

key-files:
  created:
    - apps/devcollab-api/src/workspaces/workspace-ability.factory.ts
    - apps/devcollab-api/src/workspaces/workspaces.module.ts
  modified:
    - apps/devcollab-api/src/guards/casl-auth.guard.ts
    - apps/devcollab-api/src/app.module.ts

key-decisions:
  - "CaslAuthGuard workspace-scoped check: extract :slug from request.params, only build CASL ability when slug present — workspace-agnostic routes bypass to service layer"
  - "WorkspacesModule skeleton exported before controller added — Plan 03 adds WorkspacesController and WorkspacesService without module restructuring"
  - "Contributor unconditional update on Post/Snippet/Comment (no authorId condition) — own-content-only constraint deferred to Phase 17 when authorId exists on Prisma models"

patterns-established:
  - "WorkspaceAbilityFactory: one factory builds ability per request from DB membership lookup"
  - "Slug-based guard routing: presence of :slug param determines whether guard does DB lookup or returns true"

requirements-completed:
  - RBAC-01
  - RBAC-04

duration: 1min
completed: 2026-02-18
---

# Phase 16 Plan 02: CASL Workspace Ability Factory and Async Guard Summary

**CASL WorkspaceAbilityFactory with Admin/Contributor/Viewer role rules, async CaslAuthGuard with workspace-scoped ability evaluation via :slug param, wired into AppModule**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-18T00:21:34Z
- **Completed:** 2026-02-18T00:22:46Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- WorkspaceAbilityFactory builds CASL ability from DB membership: Admin gets manage:all, Contributor gets read+create/update on Post/Snippet/Comment (no Workspace/InviteLink manage), Viewer gets read-only
- CaslAuthGuard upgraded to async — extracts :slug param from request to trigger workspace-scoped DB lookup and ability.can() evaluation
- WorkspacesModule skeleton (no controller yet) exports WorkspaceAbilityFactory; AppModule imports WorkspacesModule to satisfy APP_GUARD DI
- TypeScript clean (0 errors) and controller-coverage meta-test still 5/5 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkspaceAbilityFactory and WorkspacesModule skeleton** - `ea9aa9a` (feat)
2. **Task 2: Upgrade CaslAuthGuard to async with workspace ability evaluation** - `2c1030d` (feat)
3. **Task 3: Wire WorkspacesModule into AppModule** - `709fa8b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` - CASL ability builder for Admin/Contributor/Viewer roles, queries DB via PrismaService
- `apps/devcollab-api/src/workspaces/workspaces.module.ts` - WorkspacesModule skeleton: imports DatabaseModule, provides and exports WorkspaceAbilityFactory
- `apps/devcollab-api/src/guards/casl-auth.guard.ts` - Upgraded to async canActivate, injects WorkspaceAbilityFactory, evaluates ability.can() for :slug routes
- `apps/devcollab-api/src/app.module.ts` - Added WorkspacesModule to imports array

## Decisions Made
- Workspace-agnostic routes (no :slug param) pass through after @CheckAbility check — service layer handles further authz
- Contributor role grants unconditional update on Post/Snippet/Comment with no { authorId: userId } condition — own-content-only constraint deferred to Phase 17 when authorId field exists on Prisma models
- WorkspacesModule exported as skeleton now — WorkspacesController and WorkspacesService added in Plan 03 without module restructuring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- WorkspaceAbilityFactory and async guard ready for Plan 03 workspace CRUD endpoints
- WorkspacesModule skeleton ready to receive WorkspacesController and WorkspacesService in Plan 03
- RBAC-01 guard infrastructure proven; RBAC-02/03 (own-content Contributor/Viewer on snippets/posts) deferred to Phase 17

---
*Phase: 16-workspaces-membership-rbac*
*Completed: 2026-02-18*

## Self-Check: PASSED

All files exist and all commits verified:
- FOUND: workspace-ability.factory.ts (ea9aa9a)
- FOUND: workspaces.module.ts (ea9aa9a)
- FOUND: casl-auth.guard.ts (2c1030d)
- FOUND: app.module.ts (709fa8b)
- FOUND: 16-02-SUMMARY.md
