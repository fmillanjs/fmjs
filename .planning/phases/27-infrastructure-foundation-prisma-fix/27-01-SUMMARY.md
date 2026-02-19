---
phase: 27-infrastructure-foundation-prisma-fix
plan: 01
subsystem: infra
tags: [prisma, nestjs, docker, nextjs, cookies, samesite, cross-origin]

# Dependency graph
requires:
  - phase: 26-navigation-redesign-awwwards-style-horizontal-nav-with-matrix-personality
    provides: devcollab-web frontend that needs cross-origin cookie auth
provides:
  - Fixed Prisma P2002 race condition handler using correct devcollab client runtime
  - Production-safe SameSite=None auth cookies for cross-origin frontend/API
  - NEXT_PUBLIC_API_URL baked into devcollab-web Docker image at build time
affects: [27-infrastructure-foundation-prisma-fix, 28-devcollab-feature-completion, coolify-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-Prisma-client disambiguation: import from '.prisma/{client-name}/runtime/library' not '@prisma/client/runtime/library'"
    - "Cross-origin SameSite=None; Secure cookie pattern with NODE_ENV guard"
    - "Docker ARG before build RUN to bake NEXT_PUBLIC_* env vars into Next.js bundle"

key-files:
  created: []
  modified:
    - apps/devcollab-api/src/reactions/reactions.service.ts
    - apps/devcollab-api/src/auth/auth.controller.ts
    - apps/devcollab-web/Dockerfile

key-decisions:
  - "Import PrismaClientKnownRequestError from '.prisma/devcollab-client/runtime/library' not '@prisma/client/runtime/library' — monorepos with multiple Prisma schemas produce separate clients; instanceof fails cross-client"
  - "SameSite=None requires Secure=true in all modern browsers — production flag gates both together"
  - "NEXT_PUBLIC_* vars must be baked at next build time via Docker ARG, not injected at runtime — they appear in the JS bundle"

patterns-established:
  - "Pattern: Multi-Prisma monorepo import — always use generated client path (.prisma/{name}/runtime/library)"
  - "Pattern: Environment-conditional cookie attributes — isProduction local var for both set and clear"

requirements-completed: [FIX-01, DEPLOY-03, DEPLOY-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 27 Plan 01: Infrastructure Foundation Prisma Fix Summary

**Three surgical one-to-three line fixes unblocking production: correct Prisma client runtime import for P2002 race handling, SameSite=None cookie for cross-origin auth, and NEXT_PUBLIC_API_URL ARG/ENV in devcollab-web Dockerfile builder stage.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T21:51:39Z
- **Completed:** 2026-02-19T21:53:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Fixed Prisma P2002 duplicate-key race condition handler in ReactionsService that silently failed because `instanceof PrismaClientKnownRequestError` was checking against TeamFlow's client, not DevCollab's
- Fixed auth cookies to use `SameSite=None; Secure` in production so browsers send them on cross-origin requests from `devcollab.fernandomillan.dev` to `devcollab-api.fernandomillan.dev`
- Fixed devcollab-web Dockerfile so `--build-arg NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev` from GitHub Actions is declared as `ARG` and promoted to `ENV` before `next build`, baking the URL into the JS bundle

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Prisma import in reactions.service.ts (FIX-01)** - `c748476` (fix)
2. **Task 2: Fix auth cookie SameSite for cross-origin production use** - `98f5536` (fix)
3. **Task 3: Add NEXT_PUBLIC_API_URL ARG/ENV to devcollab-web Dockerfile (DEPLOY-03)** - `a53bab4` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/devcollab-api/src/reactions/reactions.service.ts` - Line 2 import changed from `@prisma/client/runtime/library` to `.prisma/devcollab-client/runtime/library`
- `apps/devcollab-api/src/auth/auth.controller.ts` - `setAuthCookie` and `clearCookie` updated with `isProduction ? 'none' : 'strict'` SameSite logic
- `apps/devcollab-web/Dockerfile` - Added `ARG NEXT_PUBLIC_API_URL` and `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before `RUN npx turbo build`

## Decisions Made

- When a monorepo uses multiple Prisma schemas (teamflow-client + devcollab-client), each generates its own runtime. The `instanceof` check for `PrismaClientKnownRequestError` only works with the matching runtime — cross-client checks always return `false`.
- `SameSite=None` requires `Secure=true` per browser specs. The `isProduction` variable gates both together to avoid a broken state in development (localhost doesn't need Secure).
- `NEXT_PUBLIC_*` env vars are inlined by `next build` at compile time into the JS bundle — they cannot be injected at container runtime. The `ARG` must be declared in the Dockerfile before the `RUN npx turbo build` step.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed with no errors after all changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Three prerequisite code fixes are in place; Coolify deployment should now function correctly
- Phase 27 plan 02 can proceed with infrastructure and deployment configuration
- No blockers remaining from this plan

---
*Phase: 27-infrastructure-foundation-prisma-fix*
*Completed: 2026-02-19*
