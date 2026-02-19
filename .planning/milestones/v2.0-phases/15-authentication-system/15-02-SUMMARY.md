---
phase: 15-authentication-system
plan: 02
subsystem: auth
tags: [nestjs, jwt, cookie-parser, cors, guards, decorators, casl]

# Dependency graph
requires:
  - phase: 14-monorepo-scaffold-infrastructure
    provides: devcollab-api NestJS app scaffold with CaslAuthGuard (basic) and public.decorator.ts
provides:
  - Auth dependencies declared in devcollab-api/package.json (jwt, passport, bcrypt, cookie-parser)
  - cookieParser() middleware and CORS with credentials:true in main.ts
  - @CheckAbility decorator and CHECK_ABILITY_KEY constant
  - @CurrentUser param decorator for extracting JWT payload from req.user
  - Upgraded CaslAuthGuard with JWT cookie verification and deny-by-default @CheckAbility enforcement
affects: [15-03-auth-feature, 15-04-protected-endpoints]

# Tech tracking
tech-stack:
  added: [cookie-parser, @nestjs/jwt, @nestjs/passport, bcrypt, passport, passport-jwt, @types/bcrypt, @types/cookie-parser, @types/passport-jwt]
  patterns: [deny-by-default guard with CheckAbility metadata, httpOnly JWT cookie via devcollab_token, CORS credentials mode for cross-origin cookies]

key-files:
  created:
    - apps/devcollab-api/src/common/decorators/check-ability.decorator.ts
    - apps/devcollab-api/src/common/decorators/current-user.decorator.ts
  modified:
    - apps/devcollab-api/package.json
    - apps/devcollab-api/src/main.ts
    - apps/devcollab-api/src/guards/casl-auth.guard.ts

key-decisions:
  - "import * as cookieParser (CommonJS style) required for NestJS cookie-parser middleware — NOT import cookieParser"
  - "CORS origin set to DEVCOLLAB_WEB_URL env var with localhost:3002 fallback, credentials: true required for httpOnly cookie cross-origin"
  - "CaslAuthGuard uses JwtService.verify() — full DI wiring completes in Plan 03 when AppModule adds global JwtModule"
  - "CHECK_ABILITY_KEY = 'check_ability' string literal used as Reflector metadata key"

patterns-established:
  - "Deny-by-default: every non-@Public endpoint must declare @CheckAbility or receives ForbiddenException"
  - "@CurrentUser() param decorator extracts req.user (JwtPayload) set by CaslAuthGuard"
  - "devcollab_token httpOnly cookie carries JWT — guard reads from request.cookies['devcollab_token']"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04]

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 15 Plan 02: DevCollab API Auth Infrastructure Summary

**cookie-parser middleware, CORS credentials config, @CheckAbility/@CurrentUser decorators, and JWT-verifying deny-by-default CaslAuthGuard installed in devcollab-api**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-17T23:27:19Z
- **Completed:** 2026-02-17T23:28:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- devcollab-api/package.json now declares all auth runtime dependencies (@nestjs/jwt, @nestjs/passport, bcrypt, cookie-parser, passport, passport-jwt) so turbo prune includes them in Docker builds
- main.ts upgraded with cookieParser() middleware and CORS with credentials:true for devcollab-web cross-origin cookie support
- CaslAuthGuard upgraded from simple deny-by-default to JWT cookie verification: reads devcollab_token, calls JwtService.verify(), sets req.user, then enforces @CheckAbility presence
- @CheckAbility and @CurrentUser decorators created and ready for Plan 03 feature controllers

## Task Commits

Each task was committed atomically:

1. **Task 1: Declare auth dependencies in devcollab-api package.json and install cookie-parser** - `05f6db8` (chore)
2. **Task 2: Upgrade main.ts, add CheckAbility and CurrentUser decorators, upgrade CaslAuthGuard** - `f633360` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-api/package.json` - Added 6 auth runtime deps, 3 type devDeps, vitest test scripts
- `apps/devcollab-api/src/main.ts` - Added cookieParser() middleware, enableCors() with credentials:true
- `apps/devcollab-api/src/common/decorators/check-ability.decorator.ts` - New: @CheckAbility decorator, CHECK_ABILITY_KEY, AbilityRequirement interface
- `apps/devcollab-api/src/common/decorators/current-user.decorator.ts` - New: @CurrentUser param decorator, JwtPayload interface
- `apps/devcollab-api/src/guards/casl-auth.guard.ts` - Upgraded: JWT verification from devcollab_token cookie, req.user population, @CheckAbility enforcement

## Decisions Made
- `import * as cookieParser` (CommonJS style) is the correct NestJS import pattern — not default import
- CORS configured with env var fallback to localhost:3002 (devcollab-web port), credentials:true for httpOnly cookie transmission
- JwtService is injected in CaslAuthGuard but DI wiring is intentionally deferred to Plan 03 when AppModule registers global JwtModule — this is expected behavior, not a bug

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All auth infrastructure decorators and guard are in place for Plan 03 (auth feature module)
- Plan 03 must register JwtModule as global in AppModule to complete the DI wiring for CaslAuthGuard
- Vitest test scripts are declared in package.json, ready for Plan 03 TDD tests

---
*Phase: 15-authentication-system*
*Completed: 2026-02-17*
