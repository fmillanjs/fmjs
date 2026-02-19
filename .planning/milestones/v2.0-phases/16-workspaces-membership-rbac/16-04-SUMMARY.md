---
phase: 16-workspaces-membership-rbac
plan: "04"
subsystem: devcollab-api/meta-test + devcollab-web/workspace-ui
tags:
  - meta-test
  - security-invariant
  - workspace-ui
  - nextjs15
  - rbac
dependency_graph:
  requires:
    - 16-03 (WorkspacesController with @CheckAbility decorators)
    - 15-04 (devcollab-web routing foundation)
  provides:
    - deny-by-default meta-test covers WorkspacesController (13/13 tests pass)
    - workspace UI pages at /w/[slug], /join, /dashboard
    - Phase 16 end-to-end verified in running Docker stack
  affects:
    - CI security invariant gate
    - Phase 17 (Tiptap content editor — RBAC foundation ready)
tech_stack:
  added: []
  patterns:
    - Next.js 15 async params (Promise<{slug}>) awaited in server components
    - Client component workspace list with useEffect fetch
    - Suspense wrapper around useSearchParams in join page
key_files:
  created:
    - apps/devcollab-web/app/w/[slug]/layout.tsx
    - apps/devcollab-web/app/w/[slug]/page.tsx
    - apps/devcollab-web/app/join/page.tsx
  modified:
    - apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts
    - apps/devcollab-web/app/dashboard/page.tsx
key_decisions:
  - "WorkspacesController added to ALL_CONTROLLERS in meta-test — 13 total tests pass (all 8 WorkspacesController methods have @CheckAbility)"
  - "Dashboard converted from server component to client component to support useEffect workspace list fetch"
  - "join/page.tsx uses Suspense wrapper around JoinForm to allow useSearchParams in client component"
  - "No purple colors used anywhere — blues (#3b82f6) and grays only"
  - "webpack.config.js added to devcollab-api (bcrypt external, dist/main.js at root) — required for NestJS Docker build"
  - "workspace migration renamed to run after User table migration — fixed FK constraint failure on devcollab-migrate startup"
patterns_established:
  - "Security invariant meta-test pattern: ALL_CONTROLLERS array, Vitest over controller prototype methods, fail fast on missing @Public or @CheckAbility"
  - "Next.js 15 async params: always await params in server components and layouts"
requirements_completed:
  - WORK-01
  - WORK-03
duration: ~10min (including human verification round)
completed: 2026-02-17
---

# Phase 16 Plan 04: Meta-test + Workspace UI Summary

**Deny-by-default meta-test updated to cover WorkspacesController (13/13 pass) and minimal Next.js 15 workspace UI delivered at /w/[slug], /join?token=, and /dashboard; Phase 16 end-to-end verified in Docker stack.**

## Performance

- **Duration:** ~10 min (including human verification round)
- **Started:** 2026-02-18
- **Completed:** 2026-02-17
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 5

## Accomplishments

- WorkspacesController added to `ALL_CONTROLLERS` in deny-by-default meta-test; 13/13 invariant tests pass
- Minimal Next.js 15 workspace UI: workspace home page at `/w/[slug]`, join page at `/join?token=`, dashboard with workspace list and create form
- Phase 16 end-to-end verification passed: unauthenticated 401, Contributor 403 on invite-link creation, last-Admin 400 on removal, single-use link enforcement, member list accurate
- Migration order fixed (workspace migration runs after User table) and webpack.config.js added for bcrypt external bundling

## Task Commits

Each task was committed atomically:

1. **Task 1: Update controller-coverage meta-test to include WorkspacesController** - `f57278f` (feat)
2. **Task 2: Create Next.js 15 workspace UI pages** - `44d3e2d` (feat)
3. **Task 3: Checkpoint — Phase 16 end-to-end verification** - approved by human; fixes committed in `aaf54be`

**Plan metadata:** `fc5a67b` (docs: complete meta-test + workspace UI plan; stopped at checkpoint)

## Files Created/Modified

- `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` - Added WorkspacesController to ALL_CONTROLLERS; 13 deny-by-default invariant tests
- `apps/devcollab-web/app/w/[slug]/layout.tsx` - Async server component; awaits params; nav bar with workspace slug + Dashboard link
- `apps/devcollab-web/app/w/[slug]/page.tsx` - Async server component; fetches GET /workspaces/:slug; shows name, slug, member count
- `apps/devcollab-web/app/join/page.tsx` - Client component; Suspense around useSearchParams; POSTs to POST /workspaces/join; redirects on success
- `apps/devcollab-web/app/dashboard/page.tsx` - Client component; useEffect fetching GET /workspaces; Create Workspace form; workspace list with links

## Decisions Made

- WorkspacesController added to ALL_CONTROLLERS — 13 total tests pass; all 8 controller methods have @CheckAbility
- Dashboard converted to client component to support useEffect workspace list fetch
- join/page.tsx uses Suspense wrapper around JoinForm (required by Next.js 15 for useSearchParams outside Suspense)
- No purple colors — blues (#3b82f6) and grays only, per project design constraint
- webpack.config.js added to devcollab-api with bcrypt as external, dist/main.js output at root — required for NestJS Docker build to work correctly
- workspace migration file renamed so it runs after User table migration — fixes FK constraint failure on devcollab-migrate service startup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] webpack.config.js missing from devcollab-api**
- **Found during:** Task 3 (human verification — Docker stack startup)
- **Issue:** NestJS build failed without webpack config; bcrypt native bindings not externalized; dist/main.js not at expected path
- **Fix:** Added webpack.config.js with bcrypt external and correct output path
- **Files modified:** apps/devcollab-api/webpack.config.js (created)
- **Verification:** Docker image builds and devcollab-api starts successfully
- **Committed in:** aaf54be

**2. [Rule 3 - Blocking] Workspace migration ran before User table existed**
- **Found during:** Task 3 (human verification — devcollab-migrate service)
- **Issue:** FK constraint on WorkspaceMember.userId failed because workspace migration ran before User migration
- **Fix:** Renamed workspace migration file to ensure it sorts after User migration
- **Files modified:** migration file renamed in apps/devcollab-api/prisma/migrations/
- **Verification:** devcollab-migrate completes successfully; all tables created in correct order
- **Committed in:** aaf54be

---

**Total deviations:** 2 auto-fixed (both blocking — Rule 3)
**Impact on plan:** Both fixes required for Docker stack to start and Phase 16 to be verifiable. No scope creep.

## Human Verification Results

Checkpoint approved with all checks passing:

| Check | Result |
|-------|--------|
| Unauthenticated POST /workspaces | 401 |
| Contributor POST /workspaces/:slug/invite-links | 403 |
| Last Admin remove themselves | 400 |
| Single-use invite link reuse | 400 |
| Member list shows Admin + Contributor | Pass |
| Meta-test 13/13 | Pass |
| Migration fixed | Pass |
| webpack.config.js added | Pass |

## Issues Encountered

- Migration ordering: workspace FK migration ran before User table — fixed by renaming migration file to sort after User migration
- bcrypt native binding: NestJS build required webpack externals config — added webpack.config.js

## Next Phase Readiness

- Phase 16 is COMPLETE. All RBAC infrastructure (CASL guard, WorkspaceAbilityFactory, WorkspacesController, invite links, last-admin protection) is verified working
- Phase 17 (Tiptap content editor): RBAC foundation is ready; Contributor/Admin/Viewer roles enforced; own-content-only constraint deferred to Phase 17 when authorId exists on Post/Snippet models
- Tiptap v3 + Next.js 15 SSR remains the highest-risk area — run isolated spike before full implementation (see STATE.md blockers)

---
*Phase: 16-workspaces-membership-rbac*
*Completed: 2026-02-17*
