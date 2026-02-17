---
phase: 14-monorepo-scaffold-infrastructure
plan: 02
subsystem: apps
tags: [nestjs, nextjs, casl, docker, turbo, monorepo]
dependency_graph:
  requires: [14-01]
  provides: [devcollab-api workspace, devcollab-web workspace]
  affects: [14-03-docker-compose]
tech_stack:
  added:
    - NestJS 11 (devcollab-api)
    - Next.js 15 (devcollab-web)
    - "@casl/ability ^6.8.0"
    - "@nestjs/config ^4.0.0"
  patterns:
    - APP_GUARD deny-by-default pattern
    - Reflector-based @Public() metadata bypass
    - Turbo-prune multi-stage Dockerfile
key_files:
  created:
    - apps/devcollab-api/package.json
    - apps/devcollab-api/tsconfig.json
    - apps/devcollab-api/nest-cli.json
    - apps/devcollab-api/src/main.ts
    - apps/devcollab-api/src/app.module.ts
    - apps/devcollab-api/src/common/decorators/public.decorator.ts
    - apps/devcollab-api/src/guards/casl-auth.guard.ts
    - apps/devcollab-api/src/health/health.module.ts
    - apps/devcollab-api/src/health/health.controller.ts
    - apps/devcollab-api/Dockerfile
    - apps/devcollab-web/package.json
    - apps/devcollab-web/tsconfig.json
    - apps/devcollab-web/next.config.ts
    - apps/devcollab-web/app/layout.tsx
    - apps/devcollab-web/app/page.tsx
    - apps/devcollab-web/Dockerfile
  modified: []
decisions:
  - "Package names are devcollab-api and devcollab-web (not scoped @devcollab/*) so turbo prune filter matches exactly"
  - "CaslAuthGuard installed as APP_GUARD before any feature controllers — security invariant established for all Phase 15+ work"
  - "HealthController decorated with @Public() to survive deny-by-default guard for Docker healthchecks"
  - "output: standalone in next.config.ts required for Dockerfile runner stage to copy minimal Next.js server"
  - "Auth deferred to Phase 15 — page.tsx is a placeholder only"
metrics:
  duration_minutes: 1
  completed_date: "2026-02-17"
  tasks_completed: 2
  files_created: 16
  files_modified: 0
---

# Phase 14 Plan 02: Application Workspaces Scaffold Summary

**One-liner:** NestJS 11 API on port 3003 with deny-by-default CASL APP_GUARD and public health endpoint, plus Next.js 15 web app on port 3002 with login placeholder, both with turbo-prune multi-stage Dockerfiles.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold devcollab-api with NestJS 11, CASL guard, health endpoint | b075848 | app.module.ts, casl-auth.guard.ts, public.decorator.ts, health.controller.ts, Dockerfile |
| 2 | Scaffold devcollab-web with Next.js 15, login placeholder, Dockerfile | e419f8c | page.tsx, layout.tsx, next.config.ts, Dockerfile |

## What Was Built

### devcollab-api (apps/devcollab-api)

NestJS 11 application scaffolded with:

- **Deny-by-default CASL guard:** `CaslAuthGuard` registered as `APP_GUARD` in `AppModule`. All routes return 403 unless decorated with `@Public()`. This is the security invariant — no feature controller can accidentally expose a route without explicit opt-in.
- **@Public() decorator:** Uses `SetMetadata(IS_PUBLIC_KEY, true)` + `Reflector.getAllAndOverride()` to allow specific handlers/controllers to bypass the guard.
- **HealthController:** `GET /health` returns `{ status: 'ok' }` with `@Public()` — essential for Docker healthchecks and Plan 03 Docker Compose integration.
- **Turbo-prune Dockerfile:** 4-stage build (pruner → installer → builder → runner). `turbo prune devcollab-api --docker` in pruner stage filters monorepo to only this app's dependencies. `curl` installed in runner for healthcheck support. `prisma generate` runs before `turbo build` to prevent missing `.prisma/devcollab-client` TypeScript errors.

### devcollab-web (apps/devcollab-web)

Next.js 15 application scaffolded with:

- **Login placeholder:** `app/page.tsx` renders a minimal page indicating auth is coming in Phase 15. No actual auth forms or JWT code — deferred by locked decision.
- **Standalone output:** `next.config.ts` sets `output: 'standalone'` required for the Dockerfile runner stage to copy only the minimal Next.js server bundle.
- **Turbo-prune Dockerfile:** Same 4-stage pattern as API. `HOSTNAME=0.0.0.0` set in runner for Docker interface binding. `PORT=3002` preset. `public/` directory copy uses `|| true` to handle the case where no public assets exist yet.

## Deviations from Plan

None — plan executed exactly as written.

## Security Invariant Established

The CASL deny-by-default guard is now active. All future controllers added to `devcollab-api` will be blocked (403) unless explicitly decorated with `@Public()` or a proper authorization policy. This satisfies the Phase 14 requirement from STATE.md: "Deny-by-default CASL guard must be installed in Phase 14 before any feature controllers."

## Self-Check

Files verified:
- apps/devcollab-api/package.json: "name": "devcollab-api" - FOUND
- apps/devcollab-api/src/app.module.ts: APP_GUARD - FOUND
- apps/devcollab-api/src/health/health.controller.ts: @Public() - FOUND
- apps/devcollab-api/Dockerfile: turbo prune devcollab-api - FOUND
- apps/devcollab-web/package.json: "name": "devcollab-web" - FOUND
- apps/devcollab-web/next.config.ts: standalone - FOUND
- apps/devcollab-web/Dockerfile: turbo prune devcollab-web - FOUND

Commits verified:
- b075848: feat(14-02): scaffold devcollab-api - FOUND
- e419f8c: feat(14-02): scaffold devcollab-web - FOUND

## Self-Check: PASSED
