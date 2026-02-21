# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v3.0 — Phase 28: DevCollab UI Debt Closure

## Current Position

Phase: 28 of 28 (DevCollab UI Debt Closure)
Plan: 3 of 4 complete (Plans 01-03: dashboard auth guard, portfolio fixes, members management, browser verification)
Status: In progress — Plan 03 complete
Last activity: 2026-02-20 — Phase 28 Plan 03 complete: all 8 browser verification tests passed (FIX-02, UI-01 through UI-06 confirmed)

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE (41/41) | v2.5 COMPLETE (13/13)

Progress: [█████████████████░] 96% (27/28 phases complete, Phase 28 in progress — 3/4 plans done)

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1.0 requirements | 22/22 |
| v1.1 requirements | 16/16 |
| v2.0 requirements | 41/41 |
| v2.5 requirements | 13/13 |
| v3.0 requirements | 8/14 |
| Total shipped | 100/92 |

## Plan Execution Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 27 | 01 | 2min | 3 | 3 |
| 27 | 02 | 1min | 2 | 2 |
| 28 | 01 | 3min | 2 | 9 |
| 28 | 02 | 2min | 2 | 3 |
| 28 | 03 | checkpoint | 1 | 0 |

## Accumulated Context

### Decisions (recent — full log in PROJECT.md)

- **27-01:** Multi-Prisma monorepo: import PrismaClientKnownRequestError from `.prisma/{client-name}/runtime/library` not `@prisma/client/runtime/library` — instanceof fails cross-client
- **27-01:** SameSite=None requires Secure=true — gate both on isProduction in auth cookie set and clear methods
- **27-01:** NEXT_PUBLIC_* vars baked at next build time via Docker ARG/ENV before RUN turbo build
- **v3.0:** NEXT_PUBLIC_API_URL must be --build-arg in GitHub Actions (not Coolify runtime env) — client-side JS bundle baked at build time
- **v3.0:** GHCR auth must be done as root on VPS (sudo su - then docker login ghcr.io) — Coolify reads creds from /root/.docker/config.json
- **v3.0:** CORS must use exact HTTPS origin with no trailing slash — wildcard origin + credentials: true is rejected by every browser
- **v3.0:** devcollab-migrate must have restart: 'no' — prisma migrate deploy exits 0, without this Coolify loops the container infinitely
- **v3.0:** devcollab-web uses plain inline styles only — NO Shadcn, NO Tailwind, NO Radix installed in apps/devcollab-web
- **v3.0:** dashboard/page.tsx auth guard converts to server component using cookies() + redirect() — exact pattern in w/[slug]/layout.tsx
- **28-01:** dashboard/page.tsx server component — router.refresh() in CreateWorkspaceForm re-triggers server fetch without callback prop
- **28-01:** portfolio footer: LinkedIn replaced with CodeSignal; GitHub updated to fmillanjs
- **28-02:** window.location.origin used for invite join URL (not API_URL) — API_URL is backend host, join URL must use web app origin
- **28-02:** Remove button guarded by !isCurrentUser && member.role !== 'Admin' — prevents Admin removal through UI
- **28-02:** Role selector disabled for current user's own row — admin cannot change own role via UI
- **28-03:** All 8 browser verification tests passed on first attempt — no rework required for any Phase 28 deliverable

### Architectural Constraints for Phase 27

- `NEXT_PUBLIC_API_URL` baked via `--build-arg` in GHA Docker build step, declared as `ARG`/`ENV` in devcollab-web Dockerfile
- GHCR pull auth: SSH as root → `sudo su -` → `echo PAT | docker login ghcr.io -u USERNAME --password-stdin` (classic PAT, read:packages)
- CORS `origin`: `'https://devcollab.fernandomillan.dev'` exactly (no trailing slash) — runtime env var, takes effect on restart
- `devcollab-migrate` in coolify-compose.yml: `restart: 'no'` + `condition: service_completed_successfully` dependency for devcollab-api
- Check cookie `SameSite=None; Secure` on first production login attempt via Chrome DevTools → Application → Cookies

### Architectural Constraints for Phase 28

- devcollab-web: plain React client components + inline styles only — no Shadcn, no Tailwind, no Radix
- Auth guard pattern: copy from `apps/devcollab-web/app/w/[slug]/layout.tsx` (server component, `await cookies()`, redirect)
- Next.js 15 async params: use `params: Promise<{ slug: string }>` and `await params` consistently
- New API routes not needed — CASL-guarded endpoints already exist for all member management features
- `apps/web/public/resume.pdf` — place file, no code changes; Next.js serves public/ as static files

### Pending Todos

None.

### Blockers/Concerns

- Coolify devcollab webhook format may differ from teamflow webhook — treat as copy-and-adapt from existing `.github/workflows/deploy.yml`
- SameSite cookie: fixed in 27-01 (SameSite=None; Secure in production) — verify in Chrome DevTools on first production login

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 28-03-PLAN.md — browser verification of all Phase 28 deliverables (all 8 tests passed)
Resume file: None
Next action: Phase 28 Plan 04 (final plan) — check plan for remaining work
