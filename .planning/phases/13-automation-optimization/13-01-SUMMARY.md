---
phase: 13-automation-optimization
plan: "01"
subsystem: testing
tags: [playwright, visual-regression, ci-cd, accessibility, axe, github-actions]

# Dependency graph
requires:
  - phase: 12-critical-route-migration
    provides: WCAG AA compliant dashboard components with Shadcn UI
  - phase: 10-component-migration-portfolio
    provides: Portfolio visual regression pattern (visual-regression.spec.ts)

provides:
  - Dashboard visual regression spec with 6 Linux-platform PNG baselines (teams-list, profile, team-detail × light/dark)
  - CI pipeline with named steps for accessibility, visual regression, and remaining E2E tests
  - ESLint governance check in CI pipeline

affects:
  - 13-02 (accessibility audit depends on this infrastructure being in place)
  - CI runs on every push to main

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dashboard visual regression with auth via storageState (playwright/.auth/user.json)
    - Dynamic route navigation via locator click (teams → team-detail → project-board)
    - test.skip for unavailable data (project-board when no projects seeded)
    - mask on dynamic content (main h1/h2, .text-muted-foreground) to prevent spurious diffs
    - Split CI E2E steps by category (accessibility / visual regression / remaining)

key-files:
  created:
    - apps/web/e2e/dashboard/visual-regression.spec.ts
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/teams-list-light-chromium-linux.png
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/teams-list-dark-chromium-linux.png
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/profile-light-chromium-linux.png
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/profile-dark-chromium-linux.png
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/team-detail-light-chromium-linux.png
    - apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/team-detail-dark-chromium-linux.png
  modified:
    - .github/workflows/deploy.yml

key-decisions:
  - "Dashboard visual regression uses storageState for auth — same pattern as component-accessibility.spec.ts"
  - "project-board tests skip gracefully when no projects available (test.skip not conditional expect)"
  - "mask on main h1/h2 and .text-muted-foreground prevents diff noise from dynamic team/task names"
  - "CI E2E split into 3 named steps (accessibility / visual regression / remaining) for clear failure attribution"
  - "ESLint governance check (next lint) added before E2E tests to catch className violations in CI"

patterns-established:
  - "Dashboard visual regression pattern: storageState + dynamic navigation + mask on dynamic content"
  - "CI named E2E steps: one step per test category so failures are immediately attributable"

requirements-completed:
  - MIG-04

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 13 Plan 01: Dashboard Visual Regression + CI Updates Summary

**Dashboard visual regression spec with 6 Linux-platform PNG baselines and named CI steps for accessibility, visual regression, and ESLint governance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T17:36:57Z
- **Completed:** 2026-02-17T17:41:11Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created `e2e/dashboard/visual-regression.spec.ts` with 8 tests (4 routes x 2 modes), following the portfolio visual regression pattern
- Generated 6 Linux-platform PNG baselines (teams-list, profile, team-detail in light/dark; project-board skipped — no projects in seed)
- Updated `deploy.yml` to split E2E into 3 named steps plus ESLint governance check

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard visual regression spec** - `d43f00b` (feat)
2. **Task 2: Update CI workflow to run dashboard visual regression tests** - `ff6bf54` (feat)

**Plan metadata:** (docs: complete plan — this commit)

## Files Created/Modified

- `apps/web/e2e/dashboard/visual-regression.spec.ts` - Dashboard visual regression spec (teams-list, profile, team-detail, project-board in light and dark modes)
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/teams-list-light-chromium-linux.png` - Baseline
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/teams-list-dark-chromium-linux.png` - Baseline
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/profile-light-chromium-linux.png` - Baseline
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/profile-dark-chromium-linux.png` - Baseline
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/team-detail-light-chromium-linux.png` - Baseline
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/team-detail-dark-chromium-linux.png` - Baseline
- `.github/workflows/deploy.yml` - Added ESLint governance step + split E2E into 3 named steps

## Decisions Made

- project-board tests use `test.skip(true, 'No projects available')` rather than failing — no projects are seeded in test DB for this route
- CI E2E steps split by category (accessibility / visual regression / remaining) for clear failure attribution in GitHub Actions UI
- ESLint governance check (`next lint`) added before E2E tests to enforce className/import restrictions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- API `npm run start:prod` script does not exist; used `node dist/main` directly with correct DB credentials (`teamflow:teamflow_dev`) from `.env`
- This is an environment issue, not a code issue — the CI environment uses different credentials (`postgres:postgres`)

## Self-Check

- `apps/web/e2e/dashboard/visual-regression.spec.ts` — EXISTS
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/` — 6 PNG files committed
- `d43f00b` — EXISTS (git log verified)
- `ff6bf54` — EXISTS (git log verified)
- YAML valid — python3 yaml.safe_load confirmed
- 7 tests pass, 2 skip, 0 failures — verified by running spec twice

## Self-Check: PASSED

## Next Phase Readiness

- Dashboard visual regression infrastructure ready for 13-02 (accessibility audit)
- All 6 baselines generated on Linux/WSL2 matching CI Ubuntu runners
- CI will fail on WCAG violations and visual regressions > 2% pixel diff

---
*Phase: 13-automation-optimization*
*Completed: 2026-02-17*
