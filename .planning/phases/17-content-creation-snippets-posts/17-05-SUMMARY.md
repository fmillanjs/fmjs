---
phase: 17-content-creation-snippets-posts
plan: 05
subsystem: testing
tags: [next.js, nestjs, rbac, casl, shiki, smoke-test, production-build]

# Dependency graph
requires:
  - phase: 17-04
    provides: PostEditor split-pane, MarkdownRenderer server component with Shiki, 4 post UI pages

provides:
  - "Production build validation: next build exits 0 with zero errors and zero hydration warnings"
  - "RBAC smoke tests: Viewer=403 on POST /snippets and POST /posts, Contributor=201 on POST /snippets"
  - "Phase 17 end-to-end acceptance gate passed (automated portion)"

affects:
  - phase-18
  - deployment

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Smoke test users: admin-test (Admin), contributor-test (Contributor, default join role), viewer-test (demoted to Viewer) — reusable RBAC test pattern"
    - "next build run locally (faster than Docker image rebuild) to verify production build passes before human checkpoint"

key-files:
  created: []
  modified: []

key-decisions:
  - "[Phase 17 P05]: next build run locally (not via Docker image rebuild) — faster, produces same output, dist written to apps/devcollab-web/.next"
  - "[Phase 17 P05]: Old devcollab-api process (from prior session, Node 20 dist) killed and replaced with freshly-built Node 22 dist — bcrypt native addon ABI mismatch required rebuild before RBAC smoke tests"
  - "[Phase 17 P05]: RBAC smoke test confirms default join role is Contributor — no role promotion needed for RBAC-02 assertion"

patterns-established:
  - "RBAC smoke test flow: signup admin, signup contributor+viewer, create workspace, generate invite, join, demote viewer, assert 403/201"

requirements-completed:
  - SNIP-02
  - SNIP-03
  - RBAC-02
  - RBAC-03

# Metrics
duration: ~6min
completed: 2026-02-18
---

# Phase 17 Plan 05: Production Build Validation and RBAC Smoke Tests Summary

**next build exits 0 with zero errors; Viewer gets 403 and Contributor (default join role) gets 201 on snippet creation — Phase 17 acceptance gate automated portion complete**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-18T04:33:48Z
- **Completed:** 2026-02-18T04:39:00Z
- **Tasks:** 1 of 2 complete (Task 2 is checkpoint:human-verify, awaiting user approval)
- **Files modified:** 0 (validation-only plan)

## Accomplishments

- Production build (`next build`) exits 0 — zero TypeScript errors, zero compilation errors, zero hydration warnings in build output
- All 16 routes generated correctly including snippet detail (`/w/[slug]/snippets/[id]`) and post pages
- RBAC-03 confirmed: Viewer user returns **403** on both `POST /workspaces/rbac-test-ws/snippets` and `POST /workspaces/rbac-test-ws/posts`
- RBAC-02 confirmed: Contributor user (kept default join role, never promoted) returns **201** on `POST /workspaces/rbac-test-ws/snippets`
- devcollab-api rebuilt for Node 22 and restarted cleanly; all routes registered correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Run production build and RBAC smoke tests** — validation only, no source files modified, no commit needed

Note: Task 2 (checkpoint:human-verify) awaits human confirmation via browser and curl output review.

## Files Created/Modified

None — this is a validation-only plan. No source files were created or modified.

## Decisions Made

- Ran `next build` locally instead of via `docker compose build devcollab-web` — faster and produces identical output; the Docker image uses the same build command
- Killed the stale devcollab-api process (started 4 hours prior with Node 20 dist, node ABI mismatch) and rebuilt with `npm run build --workspace=apps/devcollab-api` for Node 22; restarted fresh
- The devcollab-migrate Docker image has a pre-existing build issue (`COPY node_modules` fails because `node_modules` is in `.dockerignore`); noted but does not affect the smoke test since the DB migrations were already applied in Phase 17 Plan 01

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale devcollab-api process running old Node 20 dist caused port 3003 EADDRINUSE**
- **Found during:** Task 1 (RBAC smoke tests, Step 3)
- **Issue:** Port 3003 was occupied by an old process (PID 53036) that started 4 hours before with a dist built for Node 20 ABI (127), but the current runtime is Node 22. New process failed with EADDRINUSE.
- **Fix:** Killed old process, rebuilt dist with `npm run build --workspace=apps/devcollab-api`, started new process.
- **Files modified:** `apps/devcollab-api/dist/main.js` (recompiled, gitignored)
- **Verification:** `curl http://localhost:3003/health` returns `{"status":"ok"}`, all 11 snippet+post routes registered in log
- **Committed in:** N/A (dist is gitignored; no source file changed)

---

**Total deviations:** 1 auto-fixed (Rule 1 - blocking bug)
**Impact on plan:** Required fix to run RBAC smoke tests. No scope creep. No source files changed.

## Issues Encountered

- devcollab-migrate Docker image build fails with `"/node_modules": not found` because `node_modules` is in `.dockerignore`. This is a pre-existing issue (migrations were already applied in Phase 17 Plan 01 via local prisma CLI). Deferred — not needed for smoke tests since DB is already migrated. Filed to deferred-items.

## RBAC Smoke Test Results

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Viewer POST /snippets | 403 | 403 | YES |
| Viewer POST /posts | 403 | 403 | YES |
| Contributor POST /snippets (default join role) | 201 | 201 | YES |

## Build Verification Results

| Check | Result |
|-------|--------|
| `next build` exit code | 0 (success) |
| Build errors | 0 |
| Build warnings (hydration, Tiptap) | 0 |
| `.next` build output exists | YES |
| Routes generated (16 routes) | YES |

## Awaiting Human Verification (Task 2)

The following must be manually verified in the browser:

1. **Snippet flow** — http://localhost:3002/w/[slug]/snippets — create snippet, verify Shiki highlighting, verify CopyButton
2. **Post flow** — http://localhost:3002/w/[slug]/posts — create post, verify split-pane editor, Draft/Published toggle, Shiki highlighting on detail page
3. **Browser console** — zero hydration errors, zero Duplicate extension names warnings
4. **RBAC confirmation** — review curl output above (Viewer=403, Contributor=201)

## Next Phase Readiness

After human approval of Task 2:
- Phase 17 is complete — all 6 success criteria met
- Ready for Phase 18 (next phase in roadmap)
- devcollab-api process running on port 3003, devcollab-postgres healthy on port 5435

## Self-Check: PASSED

- FOUND: `.planning/phases/17-content-creation-snippets-posts/17-05-SUMMARY.md`
- FOUND: `apps/devcollab-web/.next` (build output)
- FOUND: devcollab-api healthy at `http://localhost:3003/health`
- FOUND: RBAC smoke test results documented

---
*Phase: 17-content-creation-snippets-posts*
*Completed: 2026-02-18*
