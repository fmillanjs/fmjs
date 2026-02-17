# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** v2.0 DevCollab — Phase 14 COMPLETE, Phase 15 next

## Current Position

Phase: 14 of 21 (Monorepo Scaffold + Infrastructure)
Plan: 4 of 4 in Phase 14 — COMPLETE
Status: Phase 14 complete
Last activity: 2026-02-17 — 14-04 complete: CI/CD pipeline extended with build-and-push-devcollab job for devcollab-web and devcollab-api images to GHCR

Progress: [░░░░░░░░░░░░░░░░░░░░] 0% (v2.0 phase 14-21, 2 plans complete)

Previous milestones: v1.1 COMPLETE (16/16 requirements) | v1.0: complete

## Performance Metrics

**Velocity (v1.0 + v1.1 combined):**
- Total plans completed: 45
- Average duration: 9.5 min/plan
- Total execution time: ~7.1 hours

**By Phase (historical):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 11 | 62 min | 5.6 min |
| 06.1-user-flow-architecture-audit | 6 | 158 min | 26.3 min |
| 12-critical-route-migration | 9 | 37 min | 4.1 min |
| 13-automation-optimization | 3 | 39 min | 13.0 min |
| 14-monorepo-scaffold-infrastructure | 4 | 4 min | 1.0 min |

**Recent Trend:**
- Last 5 plans: 14-P04 (1m), 14-P03 (1m), 14-P02 (1m), 14-P01 (1m), 13-P03 (10m)
- Trend: Stable — infra/scaffold plans run fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions for v2.0:

- DevCollab uses completely separate JWT secret (DEVCOLLAB_JWT_SECRET) — no sharing with TeamFlow
- Deny-by-default CASL guard must be installed in Phase 14 before any feature controllers
- Postgres tsvector (NOT Meilisearch) for full-text search — adequate at portfolio scale, no extra Docker service
- Tiptap v3 with immediatelyRender: false — validated with next build && next start before merge
- MinIO for dev file storage, Cloudflare R2 for production — same AWS SDK v3 code path
- devcollab-web on port 3002, devcollab-api on port 3003 — avoids conflict with TeamFlow API on 3001
- Single dedicated migrate Docker service — prevents migration race condition (Pitfall 5)
- tsvector trigger pattern — eliminates GIN index migration drift (Pitfall 2)
- Prisma output set to node_modules/.prisma/devcollab-client — isolates DevCollab client from TeamFlow's @prisma/client (14-01)
- Import in client.ts uses '.prisma/devcollab-client' not '@prisma/client' — critical isolation boundary (14-01)
- globalThis key named devcollabPrisma to avoid collision with TeamFlow's singleton pattern (14-01)
- Package names devcollab-api and devcollab-web (not scoped) so turbo prune filter matches exactly (14-02)
- CaslAuthGuard installed as APP_GUARD before any feature controllers — deny-by-default security invariant active (14-02)
- Auth deferred to Phase 15 — devcollab-web/app/page.tsx is a placeholder only (14-02)
- devcollab-migrate has no restart policy — exits cleanly after prisma migrate deploy to satisfy service_completed_successfully (14-03)
- devcollab-network isolates all DevCollab services; TeamFlow services remain on teamflow-network only (14-03)
- MinIO --console-address ":9001" flag required — without it console binds to a random port (14-03)
- Default env var values (:-devcollab, :-minioadmin) allow docker compose up without .env for local dev (14-03)
- [Phase 14]: build-and-push-devcollab uses needs: [test] only — DevCollab images build independently from Lighthouse CI check
- [Phase 14]: Both devcollab images built in same CI job as sequential steps — saves CI minutes by sharing checkout, buildx setup, and GHCR login (14-04)

### Pending Todos

None.

### Blockers/Concerns

**Phase 17 (Tiptap) — Research flag:**
- Tiptap v3 + Next.js 15 App Router SSR is highest-risk area. Run 1-day spike: isolated component, production build, confirm no hydration errors before full implementation.
- Resolve Tiptap content storage format (JSON vs sanitized HTML) before writing schema migrations.

**Phase 20 (Search) — Validation ritual:**
- Run `prisma migrate dev` three consecutive times after adding tsvector columns. Runs 2 and 3 must generate zero migration files. Do not proceed past Phase 20 without this check passing.

**Phase 21 (Deployment) — Research flag:**
- Coolify per-service webhook trigger behavior for a second app is not fully documented. Plan for hands-on iteration when configuring deployment pipeline.
- Lock every credential in Coolify UI immediately on first deploy. Verify deployment log shows REDACTED before sharing demo URL.

## Session Continuity

Last session: 2026-02-17
Stopped at: 14-04 complete — Phase 14 all 4 plans done: Prisma client isolation, app workspaces, Docker Compose services, CI/CD image pipeline
Resume file: None
Next action: Execute Phase 15 plans (DevCollab authentication)
