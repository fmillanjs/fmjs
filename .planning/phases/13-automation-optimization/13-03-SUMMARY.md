---
phase: 13-automation-optimization
plan: "03"
subsystem: testing
tags: [lighthouse, performance, ci-cd, github-actions, lhci]

# Dependency graph
requires:
  - phase: 13-automation-optimization
    provides: CI pipeline with named steps, ESLint governance, dashboard visual regression (13-01, 13-02)
provides:
  - lighthouserc.json asserting Lighthouse performance >=0.9 on 5 public portfolio routes
  - Lighthouse CI job in deploy.yml running after test, before build-and-push
  - Human-verified complete Phase 13 automation layer (visual regression + ESLint governance + Lighthouse)
affects:
  - CI pipeline: build-and-push now blocked on both test AND lighthouse passing

# Tech tracking
tech-stack:
  added:
    - "@lhci/cli@0.15.x (installed globally in CI — not a package.json dependency)"
  patterns:
    - Lighthouse CI with temporary-public-storage upload (no GitHub App token needed)
    - Public-routes-only scope for LHCI (unauthenticated routes only — dashboard cannot be audited)
    - lhci autorun reads lighthouserc.json from apps/web/ working directory

key-files:
  created:
    - apps/web/lighthouserc.json
  modified:
    - .github/workflows/deploy.yml

key-decisions:
  - "Public routes only in lighthouserc.json: dashboard routes cannot be audited by lhci because it cannot authenticate"
  - "categories:accessibility warns (not errors) — axe-core is authoritative for WCAG; dual failure would be confusing"
  - "upload.target=temporary-public-storage: no GitHub App token or LHCI server required for reports"
  - "build-and-push.needs updated to [test, lighthouse]: Docker images only pushed after Lighthouse passes"
  - "numberOfRuns=3 for median-based reliability across Lighthouse score variance"

patterns-established:
  - "LHCI scope to public routes: startServerCommand + url[] list limited to unauthenticated pages"
  - "Parallel CI gates: lighthouse and build-and-push run in parallel after test passes"

requirements-completed:
  - MIG-04

# Metrics
duration: 10min
completed: 2026-02-17
---

# Phase 13 Plan 03: Lighthouse CI Performance Gating Summary

**Lighthouse CI config asserting performance >=90 on 5 public portfolio routes, CI job added to deploy.yml, human-verified full Phase 13 automation layer**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-17T17:47:27Z
- **Completed:** 2026-02-17T17:57:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Created `apps/web/lighthouserc.json` scoped to 5 public portfolio routes with performance >=0.9 CI failure and accessibility warn-only
- Added `lighthouse` job to `.github/workflows/deploy.yml` after `test` job; `build-and-push` now depends on `[test, lighthouse]`
- Human verified all 7 Phase 13 automation layer checks: visual regression (7 pass, 2 skip), ESLint governance (exit 0), governance enforcement (catches EmptyState import), lighthouserc.json valid, deploy.yml valid YAML, Lighthouse job structured correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lighthouserc.json and add Lighthouse CI job to deploy.yml** - `03a291a` (feat)
2. **Task 2: Human verification of Phase 13 automation layer** - checkpoint approved, no commit (verification only)

**Plan metadata:** (docs: complete plan — this commit)

## Files Created/Modified

- `apps/web/lighthouserc.json` - Lighthouse CI config: 5 public routes, performance >=0.9 error, accessibility warn, temporary-public-storage upload
- `.github/workflows/deploy.yml` - Added `lighthouse` job (needs: test); updated `build-and-push.needs` to `[test, lighthouse]`; added artifact upload for `.lighthouseci/` reports

## Decisions Made

- **Public routes only:** Dashboard routes (`/teams/`, `/profile`, etc.) cannot be audited by lhci because it cannot authenticate. Scoped to `/`, `/about`, `/projects`, `/projects/teamflow`, `/login`.
- **Accessibility: warn (not error):** axe-core is the authoritative WCAG checker. Duplicate CI failures from both Lighthouse and axe would be confusing and harder to triage.
- **temporary-public-storage upload:** Avoids needing a LHCI server or GitHub App token. Reports stored on Google GCS temporarily — sufficient for portfolio CI.
- **`build-and-push.needs: [test, lighthouse]`:** Docker images only pushed when both test suite AND Lighthouse performance gate pass. Prevents shipping a performance-regressed build.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. `temporary-public-storage` upload is anonymous.

## Self-Check

- `apps/web/lighthouserc.json` — EXISTS
- `.github/workflows/deploy.yml` — lighthouse job EXISTS, `needs: [test, lighthouse]` EXISTS
- `03a291a` — EXISTS (git log verified)
- YAML valid — python3 yaml.safe_load confirmed
- JSON valid — python3 -m json.tool confirmed
- No dashboard routes in lighthouserc.json — grep count = 0 confirmed

## Self-Check: PASSED

## Phase 13 Completion

All 5 Phase 13 success criteria are now met:

1. **CI fails on WCAG violations** — axe-core accessibility tests in named CI step (13-01)
2. **Visual regression detects dark mode issues** — dashboard visual-regression.spec.ts with 8 tests in both themes, 6 PNG baselines (13-01)
3. **Bundle size measured and documented** — 103 kB shared chunks, 243 kB largest route (13-02)
4. **Playwright visual regression captures all major routes in both themes** — portfolio 12 + dashboard 6-8 baselines (13-01)
5. **Lighthouse performance >=90 enforced for critical public routes** — lhci autorun via lighthouserc.json (13-03)

Phase 13 complete. v1.1 milestone complete.

---
*Phase: 13-automation-optimization*
*Completed: 2026-02-17*
