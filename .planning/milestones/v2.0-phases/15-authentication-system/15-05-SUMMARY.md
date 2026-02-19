---
phase: 15-authentication-system
plan: 05
subsystem: testing
tags: [vitest, reflect-metadata, casl, nestjs, meta-test, structural-test, deny-by-default]

# Dependency graph
requires:
  - phase: 15-03
    provides: AuthController with @Public()/@CheckAbility decorators, HealthController with @Public(), common decorators exported
  - phase: 15-02
    provides: IS_PUBLIC_KEY and CHECK_ABILITY_KEY string constants, deny-by-default CaslAuthGuard
provides:
  - Vitest configuration for devcollab-api with tsconfigPaths plugin
  - Structural meta-test asserting every route handler method has @Public() or @CheckAbility()
  - CI-time enforcement of deny-by-default security invariant — undecorated route handlers fail immediately
affects: [16-devcollab-projects, 17-tiptap-editor, all future devcollab-api feature phases]

# Tech tracking
tech-stack:
  added: [vitest ^3.0.0, vite-tsconfig-paths ^6.0.0]
  patterns: [Structural meta-test via Reflect.getMetadata('path') to detect route handlers, reflect-metadata import as first line for decorator metadata, ALL_CONTROLLERS maintainability pattern]

key-files:
  created:
    - apps/devcollab-api/vitest.config.ts
    - apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts
  modified:
    - apps/devcollab-api/package.json

key-decisions:
  - "Reflect.getMetadata('path', handler) used to identify NestJS route handlers — private helper methods (setAuthCookie) lack 'path' metadata and are correctly excluded from invariant check"
  - "vite-tsconfig-paths plugin required in vitest config to resolve @devcollab/database and @/* path aliases from tsconfig.json"
  - "ALL_CONTROLLERS const array is the explicit maintainability hook — adding a controller without updating this list means it escapes the invariant check; comment in file flags this"
  - "reflect-metadata must be the very first import in the spec file — before any NestJS imports — or Reflect.getMetadata returns undefined for all metadata"

patterns-established:
  - "Route handler filter: Reflect.getMetadata('path', proto[name]) !== undefined identifies NestJS route handlers and excludes private methods"
  - "Invariant test pattern: import ALL_CONTROLLERS array, iterate, filter route handlers, assert @Public() or @CheckAbility() on every handler"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04]

# Metrics
duration: 1min
completed: 2026-02-17
---

# Phase 15 Plan 05: Controller Deny-By-Default Invariant Test Summary

**Vitest meta-test using Reflect.getMetadata to structurally enforce that every devcollab-api route handler has @Public() or @CheckAbility() — 5 tests pass, invariant live in CI**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-17T23:38:08Z
- **Completed:** 2026-02-17T23:39:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created vitest.config.ts with tsconfigPaths plugin so test file can resolve @devcollab/database and @/* TypeScript path aliases
- Added vitest ^3.0.0 and vite-tsconfig-paths ^6.0.0 to devcollab-api devDependencies
- Wrote structural meta-test that imports controller classes directly (no HTTP, no DI container, no database) and uses Reflect.getMetadata to verify decorator presence on every route handler
- All 5 route handler tests pass: HealthController.check, AuthController.signup/login/logout/me
- Private method setAuthCookie correctly excluded — route handler filter (Reflect.getMetadata('path')) works precisely
- Adding a new undecorated controller method will fail this test immediately — invariant is live

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Vitest config and declare dependencies** - `08a8605` (chore)
2. **Task 2: Write controller deny-by-default meta-test** - `1dffff1` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-api/vitest.config.ts` - New: Vitest config with tsconfigPaths plugin, node environment, test/** include pattern
- `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` - New: Structural meta-test asserting @Public()/@CheckAbility() on all route handler methods
- `apps/devcollab-api/package.json` - Updated: added vitest ^3.0.0 and vite-tsconfig-paths ^6.0.0 to devDependencies

## Decisions Made
- `Reflect.getMetadata('path', handler)` used as route handler filter — NestJS @Get/@Post decorators set 'path' metadata on the method; private helpers (setAuthCookie) lack this metadata and are correctly excluded
- vite-tsconfig-paths plugin required so vitest can resolve TypeScript path aliases (@devcollab/database, @/*) defined in tsconfig.json
- `reflect-metadata` must be the absolute first import in the spec file — NestJS decorator metadata is only available after reflect-metadata polyfill is loaded
- ALL_CONTROLLERS array is the explicit maintainability hook: developers adding new controllers must add them here or the invariant will not cover their routes (noted in comment)

## Deviations from Plan

None - plan executed exactly as written. The refined route-handler-only filter using `Reflect.getMetadata('path', ...)` was included in the plan spec and applied as described. No bugs or blocking issues encountered.

## Issues Encountered
None - vitest found vite-tsconfig-paths and vitest packages at the monorepo root node_modules without requiring separate installation in devcollab-api. npm install completed cleanly after declaring them in package.json devDependencies.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AUTH-01, AUTH-02, AUTH-04 requirements structurally enforced at test level
- `npm test` in devcollab-api runs `vitest run` and exits 0 with all 5 tests passing
- CI can now gate on this test — any future controller method added without @Public() or @CheckAbility() fails immediately
- Phase 16+ feature controllers must be added to ALL_CONTROLLERS array in controller-coverage.spec.ts when created

## Self-Check: PASSED

- FOUND: apps/devcollab-api/vitest.config.ts
- FOUND: apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts
- FOUND: .planning/phases/15-authentication-system/15-05-SUMMARY.md
- FOUND: commit 08a8605 (chore: Vitest config and dependencies)
- FOUND: commit 1dffff1 (test: controller deny-by-default meta-test)
- vitest run exits 0 with 5 tests passing

---
*Phase: 15-authentication-system*
*Completed: 2026-02-17*
