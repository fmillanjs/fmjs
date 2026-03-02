---
phase: 44-nestjs-rest-sse-endpoints
plan: 01
subsystem: api
tags: [nestjs, rest, class-validator, throttler, prisma, leads]

# Dependency graph
requires:
  - phase: 43-enrichment-pipeline
    provides: PipelineService + PipelineModule exported, Prisma Lead/AIOutput models
  - phase: 41-project-foundation
    provides: DatabaseModule, PrismaService, docker-compose with Postgres
provides:
  - REST API: POST /leads, GET /leads, GET /leads/:id
  - CreateLeadDto with class-validator decorators
  - LeadsService with Prisma create/findAll/findOne
  - LeadsController with throttle on POST, SkipThrottle on GET
  - LeadsModule wiring PipelineModule + DatabaseModule
  - ThrottlerModule.forRoot() global rate limiting in AppModule
  - Global ValidationPipe in main.ts
affects: [44-02-sse-endpoint, 45-frontend-ui, 46-seed]

# Tech tracking
tech-stack:
  added: [class-validator@0.15.1, class-transformer@0.5.1, "@nestjs/throttler@6.5.0"]
  patterns: [NestJS ThrottlerGuard as APP_GUARD global, per-route @Throttle override, @SkipThrottle for read-only routes]

key-files:
  created:
    - ai-sdr/src/leads/dto/create-lead.dto.ts
    - ai-sdr/src/leads/leads.service.ts
    - ai-sdr/src/leads/leads.controller.ts
    - ai-sdr/src/leads/leads.module.ts
  modified:
    - ai-sdr/src/app.module.ts
    - ai-sdr/src/main.ts
    - ai-sdr/src/health/health.controller.ts
    - ai-sdr/tsconfig.json
    - ai-sdr/tsconfig.build.json

key-decisions:
  - "POST /leads creates Lead only — pipeline is NOT triggered here; SSE endpoint in Plan 02 triggers processWithStream"
  - "LeadsModule imports PipelineModule now (Plan 01) even though PipelineService only used in Plan 02 — avoids re-touching module"
  - "ThrottlerGuard as APP_GUARD global + @SkipThrottle on GET /leads, GET /leads/:id, GET /health — POST /leads gets 5 req/60s limit"
  - "rootDir: ./src added to tsconfig.json — fixes Docker dist/main.js path (was outputting to dist/src/main.js)"

patterns-established:
  - "Rate limiting: APP_GUARD ThrottlerGuard global, explicit @Throttle on write endpoints, @SkipThrottle on read endpoints"
  - "Validation: global ValidationPipe with whitelist+forbidNonWhitelisted+transform in main.ts"
  - "Error handling: service uses findUniqueOrThrow, controller catches and rethrows as NotFoundException"

requirements-completed: [LEAD-01, LEAD-02, LEAD-03]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 44 Plan 01: NestJS REST Endpoints Summary

**LeadsModule REST API (POST /leads, GET /leads, GET /leads/:id) with class-validator DTO, @nestjs/throttler rate limiting (5/60s on POST), and global ValidationPipe wired into Docker-running NestJS app**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T10:42:28Z
- **Completed:** 2026-03-01T10:50:30Z
- **Tasks:** 3 (2 auto + 1 checkpoint verified)
- **Files modified:** 9

## Accomplishments
- Created CreateLeadDto with IsString/IsNotEmpty/IsUrl validators — returns 400 with field-level error array on invalid input
- Created LeadsService with Prisma create/findAll/findOne — findAll selects only 7 columns for list view, findOne includes full aiOutputs array
- Created LeadsController: POST rate-limited at 5/60s, GET endpoints @SkipThrottle; findOne catches Prisma's NotFoundError as 404 NotFoundException
- Wired LeadsModule, ThrottlerModule.forRoot, APP_GUARD ThrottlerGuard into AppModule; global ValidationPipe in main.ts
- Added @SkipThrottle to HealthController so health checks never hit throttle limits
- Fixed Docker build: tsconfig rootDir fix ensures dist/main.js at correct path in Docker runner stage

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies + CreateLeadDto + LeadsService** - `7ceee2b` (feat)
2. **Task 2: LeadsController, LeadsModule, AppModule, main.ts, HealthController** - `859a7be` (feat)
3. **Auto-fix: tsconfig rootDir fix for Docker build** - `4426e24` (fix)

4. **Task 3: Checkpoint — Verify REST endpoints end-to-end (approved)** - `ffc1b4c` (docs)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `ai-sdr/src/leads/dto/create-lead.dto.ts` - CreateLeadDto with 3 validated fields (name, companyName, companyUrl)
- `ai-sdr/src/leads/leads.service.ts` - Prisma queries: create/findAll (7-col select)/findOne (with aiOutputs)
- `ai-sdr/src/leads/leads.controller.ts` - POST @Throttle(5/60s), GET+GET:id @SkipThrottle, NotFoundException wrapper
- `ai-sdr/src/leads/leads.module.ts` - Imports PipelineModule + DatabaseModule, exports nothing
- `ai-sdr/src/app.module.ts` - Added ThrottlerModule.forRoot array form + APP_GUARD ThrottlerGuard + LeadsModule
- `ai-sdr/src/main.ts` - Added global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- `ai-sdr/src/health/health.controller.ts` - Added @SkipThrottle() decorator
- `ai-sdr/tsconfig.json` - Added rootDir: ./src, exclude scripts/
- `ai-sdr/tsconfig.build.json` - Added scripts/ to exclude list

## Decisions Made
- POST /leads creates Lead record only, does NOT trigger pipeline — SSE endpoint in Plan 02 triggers processWithStream. This matches plan's research decision.
- LeadsModule imports PipelineModule in Plan 01 even though PipelineService is only injected in Plan 02 — avoids touching module again.
- ThrottlerGuard as APP_GUARD (global default) with per-route @Throttle override for POST and @SkipThrottle for GET/health.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Docker build: tsconfig missing rootDir caused dist/main.js path mismatch**
- **Found during:** Task 2 verification (Docker container failing with MODULE_NOT_FOUND)
- **Issue:** TypeScript without rootDir outputs to dist/src/main.js inside Docker (because full project is /app), but Dockerfile CMD runs `node dist/main.js`. Locally it works because CWD is ai-sdr/ but Docker copies the whole dir
- **Fix:** Added `rootDir: "./src"` to tsconfig.json; added `scripts/` to exclude list in both tsconfig.json and tsconfig.build.json
- **Files modified:** ai-sdr/tsconfig.json, ai-sdr/tsconfig.build.json
- **Verification:** `docker run --rm ai-sdr-api ls /app/dist/` shows main.js at correct path; API starts successfully
- **Committed in:** `4426e24`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix required for API to run in Docker. No scope creep.

## Issues Encountered
- Docker container crashed with `Cannot find module '/app/dist/main.js'` after initial build. Root cause: missing `rootDir` in tsconfig.json meant TypeScript placed compiled output under `dist/src/` in the Docker context. Fixed by adding `rootDir: "./src"`.

## User Setup Required
None - no external service configuration required. Docker Compose with Postgres was already running.

## Next Phase Readiness
- POST /leads, GET /leads, GET /leads/:id all verified working against live Postgres
- LeadsModule imports PipelineModule (ready for Plan 02's SSE endpoint injection)
- Plan 02 adds GET /leads/:id/stream SSE endpoint that triggers processWithStream

## Self-Check: PASSED

All files verified present. All task commits (7ceee2b, 859a7be, 4426e24, ffc1b4c) verified in git log.

---
*Phase: 44-nestjs-rest-sse-endpoints*
*Completed: 2026-03-01*
