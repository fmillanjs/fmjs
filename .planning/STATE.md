---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: AI SDR App
status: unknown
last_updated: "2026-03-01T10:52:00Z"
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 53
  completed_plans: 51
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28 after v5.0 start)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** Milestone v5.0 — AI SDR App, Phase 44 (NestJS REST + SSE Endpoints)

## Current Position

Phase: 44 of 46 (NestJS REST + SSE Endpoints)
Plan: 1 of 2 (awaiting human verification at checkpoint)
Status: Phase 44 Plan 01 complete (awaiting human checkpoint) — LeadsModule REST API (POST /leads, GET /leads, GET /leads/:id) wired with class-validator, @nestjs/throttler, and global ValidationPipe. All curl checks passed against live Docker container.
Last activity: 2026-03-01 — Plan 44-01 complete pending checkpoint approval

Progress: [████░░░░░░] 21%

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (this milestone)
- Average duration: 5 min
- Total execution time: 29 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 41 Project Foundation | 2/2 | 10 min | 5 min |
| 42 Claude API Integration | 2/2 | 17 min | 9 min |
| 43 Enrichment Pipeline | 3/3 | 10 min | 3 min |
| 44 NestJS REST + SSE | 1/2 | 8 min | 8 min |

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
- **43-01:** cheerio 1.x ships own TypeScript types — do NOT install @types/cheerio (would cause type conflicts)
- **43-01:** responseType 'text' critical on axios.get — prevents SyntaxError when HTML is treated as JSON
- **43-01:** ScraperService.scrape() catch block returns '' for ALL exceptions — resilience over verbosity for pipeline input steps
- **43-01:** Cloudflare detection uses dual-check: HTTP status 403/503 AND HTML marker strings — covers both redirect-blocked and challenge-page cases
- **43-02:** PersonalizeService.buildPersonalizeInput() formats EnrichOutput as labeled rows under "## Enrichment Context" heading — null fields render as "Unknown", empty arrays render as "Unknown"
- **43-02:** Services omit @anthropic-ai/sdk import entirely — all AI calls go through ClaudeService abstraction layer per architecture decision from Phase 42
- **43-03:** PipelineService exported only from PipelineModule — thin AI services remain internal (Phase 44 injects PipelineService via PipelineModule import)
- **43-03:** STEP_QUALIFY/ENRICH/PERSONALIZE constants defined in pipeline.service.ts — Phase 45 queries AIOutput by these exact strings, never drift
- **44-01:** POST /leads creates Lead record only — pipeline triggered from SSE endpoint in Plan 02, not from POST handler
- **44-01:** LeadsModule imports PipelineModule in Plan 01 even though PipelineService only used in Plan 02 — avoids re-touching module file
- **44-01:** ThrottlerGuard as APP_GUARD (global) + @Throttle(5/60s) on POST /leads + @SkipThrottle on all GET endpoints including health
- **44-01:** rootDir: ./src added to tsconfig.json — fixes Docker dist/main.js path (was outputting to dist/src/main.js without rootDir)

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
Stopped at: Completed 44-01-PLAN.md (awaiting human checkpoint) — LeadsModule REST API (POST/GET/GET:id), CreateLeadDto, ThrottlerModule, ValidationPipe. All curl checks passed. Checkpoint requires human to verify endpoints.
Resume file: None

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE | v4.0 COMPLETE | v4.1 COMPLETE
