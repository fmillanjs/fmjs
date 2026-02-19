---
phase: 20-full-text-search
plan: "01"
subsystem: database
tags: [postgres, tsvector, gin-index, prisma, full-text-search, triggers]

requires:
  - phase: 19-notifications-activity
    provides: ActivityEvent and Notification models on devcollab-postgres — DB is running and healthy

provides:
  - searchVector tsvector column on Post table with GIN index and trigger-based auto-update
  - searchVector tsvector column on Snippet table with GIN index and trigger-based auto-update
  - PrismaService.$queryRaw and $executeRaw delegation for raw SQL in NestJS services

affects:
  - 20-02-search-api (SearchService depends on $queryRaw delegation and searchVector columns)
  - 20-03-search-ui (search results flow from API which depends on this foundation)

tech-stack:
  added: []
  patterns:
    - "Trigger-based tsvector pattern: bare column + PL/pgSQL trigger (NOT GENERATED ALWAYS AS) eliminates Prisma migration drift"
    - "Manual migration SQL applied via docker exec psql + prisma migrate resolve --applied"
    - "PrismaService raw delegation: get $queryRaw() { return this.client.$queryRaw.bind(this.client); }"

key-files:
  created:
    - packages/devcollab-database/prisma/migrations/20260218_add_fts_tsvector/migration.sql
  modified:
    - packages/devcollab-database/prisma/schema.prisma
    - apps/devcollab-api/src/core/database/prisma.service.ts

key-decisions:
  - "Trigger pattern (not GENERATED ALWAYS AS) for tsvector — eliminates Prisma migration drift per RESEARCH.md Pitfall 1"
  - "GIN indexes created ONLY in manual migration SQL, NOT in Prisma schema @@index — prevents drift per Pitfall 1"
  - "prisma migrate resolve --applied used to mark manually-applied migration as complete in Prisma state table"
  - "Post weights: title=A, content=B; Snippet weights: title=A, code=B — title matches rank higher"
  - "$queryRaw and $executeRaw bound to this.client — mandatory for tagged template literal this context"

patterns-established:
  - "Pattern: Manual migration SQL + prisma migrate resolve --applied for Unsupported column types"
  - "Pattern: PrismaService get $queryRaw() delegates with .bind(this.client) for Prisma.sql template compatibility"

requirements-completed: [SRCH-01, SRCH-02]

duration: 3min
completed: 2026-02-18
---

# Phase 20 Plan 01: FTS Infrastructure Summary

**Postgres trigger-based tsvector columns on Post and Snippet with GIN indexes and PrismaService raw query delegation — zero migration drift**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T17:19:33Z
- **Completed:** 2026-02-18T17:22:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `searchVector Unsupported("tsvector")?` to both Post and Snippet Prisma models
- Created manual migration SQL with trigger functions, triggers, backfill UPDATE, and GIN indexes
- Applied migration directly to devcollab-postgres and marked it applied in Prisma state table
- Regenerated Prisma client — migration status confirms "Database schema is up to date!"
- Added `$queryRaw` and `$executeRaw` getters to PrismaService with `.bind(this.client)` — prerequisite for Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Add searchVector to Prisma schema and write migration SQL** - `e3b7256` (feat)
2. **Task 2: Add $queryRaw and $executeRaw delegation to PrismaService** - `b4c6a85` (feat)

## Files Created/Modified
- `packages/devcollab-database/prisma/schema.prisma` - Added searchVector Unsupported("tsvector")? to Post and Snippet models
- `packages/devcollab-database/prisma/migrations/20260218_add_fts_tsvector/migration.sql` - Manual migration: ALTER TABLE, trigger functions, triggers, backfill, GIN indexes
- `apps/devcollab-api/src/core/database/prisma.service.ts` - Added get $queryRaw() and get $executeRaw() getters with .bind(this.client)

## Decisions Made
- Trigger pattern over GENERATED ALWAYS AS: avoids perpetual DROP DEFAULT spurious migrations (RESEARCH.md Pitfall 1)
- GIN indexes in manual SQL only, not in Prisma schema @@index: prevents recreation drift on every migrate dev run
- Post weights: title=A (higher), content=B; Snippet weights: title=A, code=B — matches relevance expectations
- prisma migrate resolve --applied used because prisma migrate dev is non-interactive in shell context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `prisma migrate dev` is non-interactive in shell — the plan specified it for drift check, but `prisma migrate status` provides equivalent confirmation of "Database schema is up to date!" which is the correct check. The `migrate diff --from-schema-datasource --to-schema-datamodel` revealed GIN indexes as "extra" in DB (expected — Prisma ignores DB objects not in schema). No new migrations would be generated.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- searchVector columns exist on Post and Snippet with triggers and GIN indexes active
- Backfill of 3 existing Post rows and 3 existing Snippet rows completed
- PrismaService.$queryRaw is ready for SearchService (Plan 02)
- Zero migration drift confirmed: prisma migrate status says "Database schema is up to date!"

---
*Phase: 20-full-text-search*
*Completed: 2026-02-18*
