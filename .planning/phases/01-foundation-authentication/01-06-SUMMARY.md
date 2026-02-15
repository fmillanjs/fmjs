---
phase: 01-foundation-authentication
plan: 06
subsystem: api
tags: [nestjs, jwt, passport, casl, rbac, bcrypt, webpack, permissions]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    plan: 01
    provides: Turborepo monorepo with Docker infrastructure
  - phase: 01-foundation-authentication
    plan: 02
    provides: Prisma schema with User table and roles
  - phase: 01-foundation-authentication
    plan: 03
    provides: NestJS API scaffold with Prisma and global pipes
provides:
  - JWT authentication with Passport strategy and global guard
  - CASL-based RBAC system with three-role permissions
  - User management endpoints with role-based access control
  - Database-level filtering with accessibleBy for security
  - Global guard execution order (JWT auth → RBAC authz)
affects: [all future API endpoints - auth and RBAC foundation is complete]

# Tech tracking
tech-stack:
  added: [@nestjs/passport@11.0.5, @nestjs/jwt@11.0.2, passport@0.7.0, passport-jwt@4.0.1, bcrypt@6.0.0, @casl/ability, @casl/prisma, ignore-loader, webpack-node-externals]
  patterns: [Passport JWT strategy, CASL ability factory, Global guards, Decorator-based permissions, Database-level filtering with accessibleBy]

key-files:
  created:
    - apps/api/src/modules/auth/strategies/jwt.strategy.ts (Passport JWT strategy)
    - apps/api/src/modules/auth/guards/jwt-auth.guard.ts (Global JWT auth guard)
    - apps/api/src/modules/auth/decorators/current-user.decorator.ts (@CurrentUser)
    - apps/api/src/modules/auth/decorators/public.decorator.ts (@Public)
    - apps/api/src/modules/auth/decorators/roles.decorator.ts (@Roles)
    - apps/api/src/modules/auth/auth.service.ts (Login, signup, token generation)
    - apps/api/src/modules/auth/auth.controller.ts (POST /auth/signup, POST /auth/login, GET /auth/me)
    - apps/api/src/modules/auth/auth.module.ts (Auth module with JWT config)
    - apps/api/src/core/rbac/ability.factory.ts (CASL ability factory)
    - apps/api/src/core/rbac/rbac.guard.ts (RBAC authorization guard)
    - apps/api/src/core/rbac/decorators/check-ability.decorator.ts (@CheckAbility)
    - apps/api/src/core/rbac/rbac.module.ts (Global RBAC module)
    - apps/api/src/modules/users/users.service.ts (User management with accessibleBy filtering)
    - apps/api/src/modules/users/users.controller.ts (User endpoints)
    - apps/api/src/modules/users/users.module.ts (Users module)
    - apps/api/src/modules/users/dto/update-profile.dto.ts (Zod DTO wrapper)
  modified:
    - apps/api/src/app.module.ts (Registered JwtAuthGuard and RbacGuard as global guards)
    - apps/api/src/main.ts (Added 'users' Swagger tag)
    - apps/api/src/health/health.controller.ts (Marked @Public())
    - apps/api/src/core/config/config.module.ts (Fixed .env path for webpack)
    - apps/api/webpack.config.js (Added ignore-loader for .d.ts and .map files, IgnorePlugin for optional dependencies)
    - apps/api/nest-cli.json (Re-enabled webpack bundler)
    - packages/shared/src/index.ts (Fixed exports for proper module resolution)

key-decisions:
  - "Re-enabled webpack bundler after resolving bcrypt native module issue by externalizing it"
  - "Used ignore-loader to skip .d.ts and .js.map files that Terminus imports via sync require"
  - "JWT strategy re-fetches user from DB on each request to get latest role (prevents stale permissions)"
  - "RBAC conditions checked at service layer (e.g., own profile check) instead of CASL rules for flexibility"
  - "Global guard order: JwtAuthGuard → RbacGuard ensures user is authenticated before authorization check"
  - "Database-level filtering with accessibleBy prevents data leakage at query level"
  - "Explicit ForbiddenException with descriptive messages instead of returning false from guard"

patterns-established:
  - "Multi-layer security: Guard-level permissions + Service-layer business logic + Database-level filtering"
  - "Decorators for declarative permissions: @Public(), @CheckAbility('read', 'User')"
  - "@CurrentUser() extracts authenticated user from request for service methods"
  - "Global guards registered via APP_GUARD provider with execution order guarantee"
  - "CASL ability factory extensible for Phase 2 organization scoping"

# Metrics
duration: 13min
completed: 2026-02-14
---

# Phase 1 Plan 06: NestJS JWT Authentication and CASL RBAC Summary

**JWT-protected NestJS API with three-role CASL-based RBAC and user management endpoints**

## Performance

- **Duration:** 13 minutes
- **Started:** 2026-02-15T01:32:26Z
- **Completed:** 2026-02-15T01:45:44Z
- **Tasks:** 2
- **Files created:** 16
- **Files modified:** 8

## Accomplishments

- NestJS API endpoints protected by global JwtAuthGuard
- Passport JWT strategy validates tokens and re-fetches user for latest role
- CASL ability factory implements three-role permissions: Admin (manage all), Manager (CRUD projects/tasks, read users), Member (read-only + own profile + assigned tasks)
- RbacGuard enforces @CheckAbility decorator before handler execution
- Users controller: GET /users (all roles, filtered), GET /users/:id, PATCH /users/:id/profile (own or admin), PATCH /users/:id/role (admin only)
- UsersService uses accessibleBy() for database-level filtering to prevent data leakage
- Auth endpoints: POST /auth/signup, POST /auth/login (both @Public()), GET /auth/me (protected)
- Member can update own profile but cannot update others' profiles or change roles
- Admin can manage all users and change user roles
- Clear 403 Forbidden error messages with descriptive text
- Webpack bundler working with bcrypt externalized and optional dependencies ignored

## Task Commits

Each task was committed atomically:

1. **Task 1: NestJS auth module with JWT strategy, guards, and decorators** - `9e33ac8` (feat)
2. **Task 2: CASL ability factory with three-role RBAC and user management endpoints** - `63419aa` (feat)

## Files Created/Modified

**Created:**
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - Passport JWT strategy validating Bearer tokens, re-fetching user from DB
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` - Global JWT guard with @Public() support
- `apps/api/src/modules/auth/decorators/current-user.decorator.ts` - @CurrentUser() param decorator
- `apps/api/src/modules/auth/decorators/public.decorator.ts` - @Public() metadata decorator
- `apps/api/src/modules/auth/decorators/roles.decorator.ts` - @Roles() metadata decorator
- `apps/api/src/modules/auth/auth.service.ts` - Login, signup, JWT generation, bcrypt hashing
- `apps/api/src/modules/auth/auth.controller.ts` - POST /auth/signup, POST /auth/login, GET /auth/me
- `apps/api/src/modules/auth/auth.module.ts` - JwtModule.registerAsync with ConfigService
- `apps/api/src/core/rbac/ability.factory.ts` - CASL PrismaAbility factory with three-role rules
- `apps/api/src/core/rbac/rbac.guard.ts` - CanActivate guard checking @CheckAbility metadata
- `apps/api/src/core/rbac/decorators/check-ability.decorator.ts` - @CheckAbility(action, subject)
- `apps/api/src/core/rbac/rbac.module.ts` - Global RBAC module exporting AbilityFactory
- `apps/api/src/modules/users/users.service.ts` - findAll (accessibleBy filtering), findById, updateProfile, updateRole
- `apps/api/src/modules/users/users.controller.ts` - GET /users, GET /users/:id, PATCH /users/:id/profile, PATCH /users/:id/role
- `apps/api/src/modules/users/users.module.ts` - Users module
- `apps/api/src/modules/users/dto/update-profile.dto.ts` - createZodDto(updateProfileSchema)

**Modified:**
- `apps/api/src/app.module.ts` - Registered JwtAuthGuard and RbacGuard as APP_GUARD, imported AuthModule, RbacModule, UsersModule
- `apps/api/src/main.ts` - Added 'users' Swagger tag
- `apps/api/src/health/health.controller.ts` - Added @Public() to health endpoint
- `apps/api/src/core/config/config.module.ts` - Fixed envFilePath to ../../../.env for webpack bundled output
- `apps/api/webpack.config.js` - Externalized bcrypt, added ignore-loader for .d.ts/.map, IgnorePlugin for optional Terminus dependencies
- `apps/api/nest-cli.json` - Re-enabled webpack: true with webpackConfigPath
- `apps/api/package.json` - Added @nestjs/passport, @nestjs/jwt, passport-jwt, bcrypt, @casl/ability, @casl/prisma, ignore-loader
- `packages/shared/src/index.ts` - Fixed exports syntax for proper module resolution

## Decisions Made

- **Webpack re-enabled:** Resolved bcrypt native module bundling issue by externalizing it with `externals: { 'bcrypt': 'commonjs bcrypt' }`
- **ignore-loader for TypeScript artifacts:** Terminus internally requires .d.ts and .js.map files; ignore-loader prevents webpack parse errors
- **JWT strategy always re-fetches user:** Prevents stale role permissions after RBAC changes (performance acceptable for v1)
- **Service-layer permission checks:** Own profile validation in UsersService (not CASL rules) for clearer business logic
- **Global guard execution order:** JwtAuthGuard first (authentication) then RbacGuard (authorization) - ensures user always available in RBAC guard
- **Database-level filtering with accessibleBy:** Additional security layer prevents accidental data leakage
- **Explicit ForbiddenException:** Guards throw exceptions with descriptive messages instead of returning false (better UX)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Webpack bundling bcrypt native module**
- **Found during:** Task 1 (Testing compiled API)
- **Issue:** Webpack tried to bundle bcrypt (native C++ module), causing "No native build was found" error at runtime
- **Fix:** Externalized bcrypt in webpack.config.js: `externals: { 'bcrypt': 'commonjs bcrypt' }`
- **Files modified:** apps/api/webpack.config.js
- **Verification:** API started successfully with bcrypt loaded from node_modules
- **Committed in:** 9e33ac8 (Task 1 commit)

**2. [Rule 3 - Blocking] Webpack parse errors on Terminus .d.ts and .map files**
- **Found during:** Task 2 (Building with webpack)
- **Issue:** @nestjs/terminus uses sync require() to load utilities, webpack tried to parse .d.ts and .js.map files
- **Fix:** Added ignore-loader rule for /\.(js\.map|d\.ts)$/ files
- **Files modified:** apps/api/webpack.config.js, apps/api/package.json (added ignore-loader)
- **Verification:** Webpack compiled successfully without parse errors
- **Committed in:** 63419aa (Task 2 commit)

**3. [Rule 3 - Blocking] Webpack missing optional Terminus dependencies**
- **Found during:** Task 2 (Building with webpack)
- **Issue:** Terminus tries to import @mikro-orm/core, @nestjs/mongoose, etc. which aren't installed
- **Fix:** Added webpack IgnorePlugin to skip missing optional dependencies
- **Files modified:** apps/api/webpack.config.js
- **Verification:** Build completed without "module not found" errors
- **Committed in:** 63419aa (Task 2 commit)

**4. [Rule 3 - Blocking] .env file not loading in webpack bundled output**
- **Found during:** Task 1 and Task 2 (Testing API startup)
- **Issue:** envFilePath pointed to wrong location after webpack bundling (was ../../../../../../../../.env, needed ../../../.env)
- **Fix:** Updated ConfigModule envFilePath to join(__dirname, '../../../.env') for webpack
- **Files modified:** apps/api/src/core/config/config.module.ts
- **Verification:** API started successfully with environment variables loaded
- **Committed in:** 63419aa (Task 2 commit, consolidated fix)

**5. [Rule 1 - Bug] TypeScript type errors in CASL ability factory**
- **Found during:** Task 2 (Building RBAC module)
- **Issue:** AbilityBuilder imported from wrong package (@casl/prisma instead of @casl/ability)
- **Fix:** Split imports: `import { AbilityBuilder } from '@casl/ability'` and `import { createPrismaAbility, PrismaAbility } from '@casl/prisma'`
- **Files modified:** apps/api/src/core/rbac/ability.factory.ts
- **Verification:** TypeScript compilation succeeded
- **Committed in:** 63419aa (Task 2 commit)

**6. [Rule 1 - Bug] CASL condition syntax error**
- **Found during:** Task 2 (Building RBAC module)
- **Issue:** `can('update', 'User', { id: user.id })` caused TypeScript error - conditions not supported this way with PrismaAbility
- **Fix:** Removed condition from rule, moved own-profile check to UsersService layer
- **Files modified:** apps/api/src/core/rbac/ability.factory.ts, apps/api/src/modules/users/users.service.ts
- **Verification:** TypeScript build succeeded, runtime check works in service
- **Committed in:** 63419aa (Task 2 commit)

---

**Total deviations:** 6 auto-fixed (4 blocking, 2 bugs)
**Impact on plan:** All fixes necessary for webpack bundling and CASL integration. No scope creep - service-layer permission checks are standard practice and provide better flexibility than pure CASL conditions.

## Issues Encountered

**Webpack vs native modules:**
- Challenge: NestJS development typically uses ts-node or webpack in dev mode; bcrypt as native module conflicts with webpack bundling
- Resolution: Externalized bcrypt so it's loaded from node_modules at runtime instead of bundled
- Trade off: Production deployment requires node_modules/bcrypt to be present (acceptable for Docker deployments)

**Terminus optional dependencies:**
- Challenge: @nestjs/terminus supports multiple ORMs/databases, webpack tries to bundle all possible dependencies
- Resolution: Used IgnorePlugin to skip missing optional dependencies and ignore-loader for TypeScript artifacts
- Note: This pattern applies to any NestJS library with optional peer dependencies

**CASL condition limitations:**
- Challenge: PrismaAbility type doesn't easily support field-level conditions in ability rules
- Resolution: Kept ability rules simple (action + subject), implemented business logic conditions in service layer
- Benefit: More readable and maintainable - "Member can update User" rule is clear, service checks if it's their own user

## User Setup Required

None - authentication and RBAC work out of the box with existing Docker containers and database schema.

## Next Phase Readiness

**Ready for next plans:**
- ✅ JWT authentication protecting all API endpoints (except @Public())
- ✅ RBAC system with three roles operational
- ✅ User management endpoints with role-based filtering
- ✅ Database-level security with accessibleBy
- ✅ Foundation for WebSocket authentication (Plan 01-07 TECH-08)

**Future improvements:**
- Phase 2: Add organization scoping to CASL rules (currently role-only)
- Phase 2: Implement refresh token rotation
- Consider caching ability rules per request to avoid rebuilding
- Add audit logging for role changes

**No blockers** for Plan 01-07 (WebSocket Real-time) which will use this JWT auth for WebSocket connections.

## Self-Check: PASSED

**All claimed files verified:**
- FOUND: apps/api/src/modules/auth/strategies/jwt.strategy.ts
- FOUND: apps/api/src/modules/auth/guards/jwt-auth.guard.ts
- FOUND: apps/api/src/modules/auth/decorators/current-user.decorator.ts
- FOUND: apps/api/src/modules/auth/decorators/public.decorator.ts
- FOUND: apps/api/src/modules/auth/decorators/roles.decorator.ts
- FOUND: apps/api/src/modules/auth/auth.service.ts
- FOUND: apps/api/src/modules/auth/auth.controller.ts
- FOUND: apps/api/src/modules/auth/auth.module.ts
- FOUND: apps/api/src/core/rbac/ability.factory.ts
- FOUND: apps/api/src/core/rbac/rbac.guard.ts
- FOUND: apps/api/src/core/rbac/decorators/check-ability.decorator.ts
- FOUND: apps/api/src/core/rbac/rbac.module.ts
- FOUND: apps/api/src/modules/users/users.service.ts
- FOUND: apps/api/src/modules/users/users.controller.ts
- FOUND: apps/api/src/modules/users/users.module.ts
- FOUND: apps/api/src/modules/users/dto/update-profile.dto.ts

**All claimed commits verified:**
- FOUND: 9e33ac8 (Task 1)
- FOUND: 63419aa (Task 2)

**API endpoints verified:**
- PASSED: POST /auth/signup creates user and returns JWT → 201
- PASSED: POST /auth/login validates credentials and returns JWT → 200
- PASSED: GET /auth/me with valid JWT returns user → 200
- PASSED: GET /auth/me without JWT returns → 401
- PASSED: Member calls GET /users → 200 (filtered list of 3 users)
- PASSED: Member calls PATCH /users/:id/role → 403 "Forbidden: You do not have permission"
- PASSED: Member calls PATCH /own-id/profile → 200 (profile updated)
- PASSED: Member calls PATCH /other-id/profile → 403 "Forbidden: You can only update your own profile"

**NestJS startup verified:**
- PASSED: API starts on port 3001
- PASSED: Swagger accessible at /api/docs with auth, users tags
- PASSED: JwtAuthGuard registered as global guard
- PASSED: RbacGuard registered as global guard (runs after JWT)
- PASSED: Health endpoint public and returns "ok"

---
*Phase: 01-foundation-authentication*
*Completed: 2026-02-14*
