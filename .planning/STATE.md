---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: AI SDR App
status: unknown
last_updated: "2026-03-01T07:35:00Z"
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 48
  completed_plans: 47
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28 after v5.0 start)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** Milestone v5.0 — AI SDR App, Phase 42 (ClaudeService)

## Current Position

Phase: 42 of 46 (Claude API Integration)
Plan: 2 of 2 (COMPLETE)
Status: Phase 42 Plan 02 complete — Prompt constants validated end-to-end against real Claude API
Last activity: 2026-03-01 — Plan 42-02 complete (QUALIFY_SYSTEM_PROMPT, ENRICH_SYSTEM_PROMPT, PERSONALIZE_SYSTEM_PROMPT, validate-claude.ts, human approval received)

Progress: [███░░░░░░░] 14%

## Performance Metrics

**Velocity:**
- Total plans completed: 3 (this milestone)
- Average duration: 4 min
- Total execution time: 12 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 41 Project Foundation | 2/2 | 10 min | 5 min |
| 42 Claude API Integration | 2/2 | 17 min | 9 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions (relevant to v5.0)

- **v4.1:** Screenshots in `apps/web/public/screenshots/` at 1280x800; served via `next/image`
- **v5.0 research:** ANTHROPIC_API_KEY in NestJS only — enforce from day one, never in client components
- **v5.0 research:** No Redis/BullMQ — in-process pipeline with callback-based SSE emitter (sequential steps, not parallel)
- **v5.0 research:** Only email personalization step streams tokens — qualify/enrich use structuredOutput (not renderable incrementally)
- **v5.0 research:** temperature: 0 on all structured output calls — lock before any UI is built on top
- **v5.0 research:** Pre-scrape and cache in seed — never run live scraping during recruiter sessions
- **v5.0 research:** X-Accel-Buffering: no header required on Coolify for SSE to work through Nginx proxy
- **41-01:** ai-sdr is a standalone directory (not Turborepo workspace) — avoids monorepo coupling
- **41-01:** PrismaService extends PrismaClient directly — no shared package for standalone app
- **41-01:** Postgres on port 5436 — avoids conflict with teamflow:5434 and devcollab:5435
- **41-01:** docker-compose DATABASE_URL overrides .env to use internal service name postgres:5432
- **41-02:** icpScore is nullable Int — null until pipeline qualify step runs; set to integer after
- **41-02:** Dockerfile must COPY prisma before npm ci — postinstall runs prisma generate which requires schema
- **41-02:** DemoLead.seedKey is @unique — Phase 46 seed script uses this for idempotent upserts
- **41-02:** EmailSequence.body uses @db.Text — email bodies are long, avoids VARCHAR limit
- **42-01:** zodOutputFormat() takes 1 arg (schema only) — plan template had wrong 2-arg call; corrected during execution
- **42-01:** Use claude-sonnet-4-6 as private constant in ClaudeService — single place to change for all Phase 43 pipeline steps
- **42-01:** nullable() not optional() for EnrichSchema fields — Anthropic structured outputs require all fields in JSON schema required array; optional() would cause API rejection
- **42-02:** Zod v4 required — zodOutputFormat() calls z.toJSONSchema() which only exists in zod v4+; upgraded from v3.25.76 to v4.3.6 (no schema changes needed)
- **42-02:** Prompt constants co-located in src/claude/prompts/ — single canonical import location for Phase 43 pipeline services
- **42-02:** ICP rubric uses two few-shot examples anchoring the score distribution — delta=0 between two runs at temperature 0 confirmed

### Pending Todos

None.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 5 | add demo credentials box to teamflow login for consistency with devcollab | 2026-02-28 | 5f31ef1 | [5-add-demo-credentials-box-to-teamflow-log](./quick/5-add-demo-credentials-box-to-teamflow-log/) |

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 42-02-PLAN.md — Three prompt constants (qualify, enrich, personalize) validated end-to-end against real Claude API. ICP score 100 for perfect-fit lead, delta=0 between two runs, stream yielded 109 tokens. Human approved all outputs. Phase 42 complete — ready for Phase 43 (pipeline).
Resume file: None

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE | v4.0 COMPLETE | v4.1 COMPLETE
