---
phase: 20-full-text-search
plan: "02"
subsystem: api
tags: [nestjs, postgres, full-text-search, tsvector, ts_headline, casl, prisma]

# Dependency graph
requires:
  - phase: 20-01
    provides: tsvector columns + GIN indexes on Post/Snippet + PrismaService $queryRaw delegation
provides:
  - SearchModule: NestJS module with GET /workspaces/:slug/search?q= endpoint
  - SearchService: $queryRaw FTS with ts_headline and prefix matching (word:*) workspace-scoped
  - SearchController: CASL-protected search endpoint (@CheckAbility('read', 'Post'))
affects: [20-03-frontend-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma.sql tagged template with $queryRaw for raw SQL FTS queries"
    - "Input sanitization: strip tsquery special chars before building prefix term"
    - "Empty query guard: return {posts:[], snippets:[]} before calling $queryRaw"

key-files:
  created:
    - apps/devcollab-api/src/search/search.service.ts
    - apps/devcollab-api/src/search/search.controller.ts
    - apps/devcollab-api/src/search/search.module.ts
    - apps/devcollab-api/src/search/dto/search-query.dto.ts
  modified:
    - apps/devcollab-api/src/app.module.ts
    - apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts

key-decisions:
  - "SearchController uses @CheckAbility('read', 'Post') — required for CaslAuthGuard deny-by-default invariant"
  - "Input sanitization strips |&!<>()'\" chars then builds prefix tsquery (word:*) to support partial-word search"
  - "Empty query guard returns early before $queryRaw to avoid to_tsquery('') Postgres syntax error"
  - "Post status filter: Published OR authorId=userId — mirrors PostsService access rule so drafts visible to authors only"
  - "ts_headline StartSel=<mark> StopSel=</mark> — HTML-safe mark tags for frontend highlighting"

patterns-established:
  - "SearchModule pattern: DatabaseModule import + controller + service in single module"
  - "FTS sanitization pattern: strip special chars -> split words -> join as 'word:* & word:*' for prefix matching"

requirements-completed: [SRCH-01, SRCH-02]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 20 Plan 02: Search API Summary

**NestJS SearchModule with workspace-scoped FTS endpoint using $queryRaw, ts_headline highlighting, prefix matching, and CASL protection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T17:25:05Z
- **Completed:** 2026-02-18T17:26:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- SearchService: raw SQL FTS against Post and Snippet using tsvector + ts_headline with <mark> tag highlighting
- SearchController: GET /workspaces/:slug/search?q= protected by @CheckAbility('read', 'Post')
- AppModule wiring: SearchModule imported and added to imports array
- Meta-test updated: SearchController in ALL_CONTROLLERS — 35 tests all passing (up from 34)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SearchModule (service + controller + DTO)** - `890771b` (feat)
2. **Task 2: Wire SearchModule into AppModule and update meta-test** - `08760c9` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified
- `apps/devcollab-api/src/search/search.service.ts` - FTS using $queryRaw with ts_headline, prefix tsquery, workspace scope, input sanitization
- `apps/devcollab-api/src/search/search.controller.ts` - GET /workspaces/:slug/search?q= with @CheckAbility('read', 'Post')
- `apps/devcollab-api/src/search/search.module.ts` - NestJS module: DatabaseModule + SearchController + SearchService
- `apps/devcollab-api/src/search/dto/search-query.dto.ts` - SearchQueryDto with q field
- `apps/devcollab-api/src/app.module.ts` - SearchModule imported and registered in imports array
- `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` - SearchController added to ALL_CONTROLLERS

## Decisions Made
- SearchController requires @CheckAbility('read', 'Post') rather than @Public() — search is a workspace-scoped authenticated action
- Input sanitization strips tsquery special chars (|&!<>()'"`:) to prevent Postgres syntax errors from user input
- Empty term guard returns {posts:[], snippets:[]} immediately — prevents to_tsquery('') error
- Post access filter mirrors PostsService: Published posts visible to all workspace members; Draft posts visible only to author

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SearchModule registered in AppModule — GET /workspaces/:slug/search?q= is live
- SRCH-01 (workspace-scoped FTS with prefix matching) and SRCH-02 (grouped results with highlighting) implemented
- Plan 03 (frontend SearchBar component) can call this endpoint directly
- devcollab-api container restart required to pick up new module (next Docker rebuild)

---
*Phase: 20-full-text-search*
*Completed: 2026-02-18*
