---
phase: 41-project-foundation
plan: 02
subsystem: database
tags: [prisma, postgresql, prisma-migrate, nestjs, docker]

# Dependency graph
requires:
  - phase: 41-01
    provides: ai-sdr NestJS scaffold, Docker Compose with Postgres on port 5436, DatabaseModule with PrismaService
provides:
  - Prisma schema with Lead, AIOutput, EmailSequence, DemoLead models and LeadStatus enum
  - Initial migration (20260301061213_init) applied to aisdr PostgreSQL database
  - Generated @prisma/client types for all four models
  - Dockerfile fix: prisma schema copied before npm ci so postinstall works
  - Full stack smoke test verified: docker compose up → prisma migrate deploy → GET /health 200
affects: [42-claude-service, 43-pipeline, 44-leads-api, 45-frontend, 46-demo-seed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prisma schema-first design — all model fields defined before any service code written
    - Cascade deletes on child relations — AIOutput and EmailSequence delete when Lead deleted
    - DemoLead as seed control table with @unique seedKey for idempotent upserts
    - Dockerfile pattern: COPY prisma before npm ci to satisfy postinstall prisma generate

key-files:
  created:
    - ai-sdr/prisma/schema.prisma
    - ai-sdr/prisma/migrations/20260301061213_init/migration.sql
    - ai-sdr/prisma/migrations/migration_lock.toml
  modified:
    - ai-sdr/Dockerfile

key-decisions:
  - "icpScore is nullable Int — null until pipeline qualify step runs; set to integer after"
  - "AIOutput.content is Json (JSONB in Postgres) — stores typed results from qualify/enrich/personalize steps"
  - "EmailSequence.body is @db.Text — email bodies are long, explicit Text type avoids VARCHAR limit"
  - "DemoLead.seedKey is @unique with index — enables idempotent upserts in Phase 46 seed script"
  - "Dockerfile must COPY prisma before npm ci — postinstall runs prisma generate which requires schema"

patterns-established:
  - "Cascade delete: child models (AIOutput, EmailSequence) use onDelete: Cascade so Lead deletion cleans up"
  - "Index strategy: Lead[status] for pipeline status queries, Lead[createdAt] for list ordering, AIOutput[leadId,step] for per-lead retrieval"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-03-01
---

# Phase 41 Plan 02: Prisma Schema and Initial Migration Summary

**Prisma schema with Lead, AIOutput, EmailSequence, DemoLead models migrated to aisdr Postgres — full stack smoke test passes with GET /health returning 200**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-01T06:09:00Z
- **Completed:** 2026-03-01T06:16:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Wrote `prisma/schema.prisma` with all four models, LeadStatus enum, and composite indexes
- Ran `prisma migrate dev --name init` — migration 20260301061213_init applied and `@prisma/client` types generated
- Verified idempotency: second `prisma migrate dev` returns "Already in sync"
- Full stack smoke test: `docker compose up --build -d` → prisma migrate deploy → `GET /health` returns `{"status":"ok"}` with HTTP 200

## Task Commits

Each task was committed atomically:

1. **Task 1: Write prisma/schema.prisma with all four models and run initial migration** - `fe830b5` (feat)
2. **Task 2: Full stack smoke test — docker compose up with schema, GET /health returns 200** - `c4439a9` (fix)

**Plan metadata:** _(final commit below)_

## Files Created/Modified
- `ai-sdr/prisma/schema.prisma` - Lead, AIOutput, EmailSequence, DemoLead models with LeadStatus enum
- `ai-sdr/prisma/migrations/20260301061213_init/migration.sql` - Initial migration SQL (CreateEnum + 4x CreateTable + indexes)
- `ai-sdr/prisma/migrations/migration_lock.toml` - Prisma migration lock file
- `ai-sdr/Dockerfile` - Fixed: COPY prisma before npm ci so postinstall prisma generate finds the schema

## Decisions Made
- `icpScore` is nullable Int (not required at lead creation; set after pipeline qualify step)
- `AIOutput.content` is Json (JSONB) — stores typed objects from all three AI steps
- `EmailSequence.body` uses `@db.Text` — email bodies can be long, avoids VARCHAR(191) limit
- `DemoLead.seedKey` is `@unique` — Phase 46 seed script uses this for idempotent upserts
- Cascade deletes on both AIOutput and EmailSequence — deleting a Lead removes all child rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dockerfile ran npm ci before copying prisma schema**
- **Found during:** Task 2 (full stack smoke test)
- **Issue:** Dockerfile COPY order: `package*.json` → `npm ci` (runs postinstall: `prisma generate`) → `COPY . .`. Since `prisma/schema.prisma` wasn't copied yet during `npm ci`, postinstall failed with "Could not find Prisma Schema"
- **Fix:** Added `COPY prisma ./prisma` immediately before `npm ci` so the schema is available when postinstall runs
- **Files modified:** `ai-sdr/Dockerfile`
- **Verification:** Docker build succeeds, `prisma generate` runs cleanly in postinstall layer
- **Committed in:** `c4439a9` (Task 2 commit)

**2. [Rule 3 - Blocking] Ghost node process occupied port 3001**
- **Found during:** Task 2 (smoke test verification)
- **Issue:** A stale `node dist/main` process from a previous session (teamflow API) was bound to port 3001 on the host, intercepting requests before they reached the Docker container
- **Fix:** Killed the ghost process; restarted the api container to rebind port mapping cleanly
- **Files modified:** None (environment cleanup)
- **Verification:** `curl http://localhost:3001/health` returns `{"status":"ok"}` after restart
- **Committed in:** No commit needed (environment state)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 blocking environment issue)
**Impact on plan:** Both fixes essential for Docker build and smoke test to pass. No scope creep.

## Issues Encountered
- Ghost node process on port 3001 caused initial health check failure — resolved by killing stale process and restarting the container

## User Setup Required
None - no external service configuration required. `.env` uses placeholder `ANTHROPIC_API_KEY=sk-ant-placeholder` which satisfies Joi validation for Phase 41 smoke test.

## Next Phase Readiness
- Phase 42 (ClaudeService) can begin immediately — PrismaService is available from DatabaseModule, all four models have generated @prisma/client types
- Phase 43 (Pipeline) can rely on Lead, AIOutput, EmailSequence models with correct field types and cascade delete behavior
- Phase 46 (Demo Seed) can use DemoLead.seedKey @unique for idempotent upserts

---
*Phase: 41-project-foundation*
*Completed: 2026-03-01*
