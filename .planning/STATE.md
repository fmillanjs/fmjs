# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** v2.0 DevCollab — Phase 14 ready to plan

## Current Position

Phase: 14 of 21 (Monorepo Scaffold + Infrastructure)
Plan: 0 of TBD in Phase 14
Status: Ready to plan
Last activity: 2026-02-17 — v2.0 roadmap created (Phases 14-21, 41 requirements mapped)

Progress: [░░░░░░░░░░░░░░░░░░░░] 0% (v2.0 phase 14-21, 0 plans complete)

Previous milestones: v1.1 COMPLETE (16/16 requirements) | v1.0: complete

## Performance Metrics

**Velocity (v1.0 + v1.1 combined):**
- Total plans completed: 44
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

**Recent Trend:**
- Last 5 plans: 13-P01 (4m), 13-P02 (25m), 13-P03 (10m), 12-P09 (20m), 12-P08 (2m)
- Trend: Stable — automation/CI plans run fast; complex feature plans 20-40m

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
Stopped at: v2.0 roadmap creation complete. ROADMAP.md written with Phases 14-21. STATE.md updated. REQUIREMENTS.md traceability pre-populated.
Resume file: None
Next action: `/gsd:plan-phase 14` — Monorepo Scaffold + Infrastructure
