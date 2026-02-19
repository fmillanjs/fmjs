---
phase: 26-navigation-redesign-awwwards-style-horizontal-nav-with-matrix-personality
plan: "02"
subsystem: testing

tags: [playwright, lighthouse, lhci, navigation, quality-gate, e2e]

requires:
  - phase: 26-01
    provides: Redesigned nav.tsx with UX-04 hover underline + Motion layoutId active indicator

provides:
  - Playwright navigation E2E tests passing 10/10 with redesigned nav structure
  - lhci autorun passing all 5 portfolio URLs at 1.0 performance score
  - Human verification: SC-1 through SC-5 all confirmed approved
  - Phase 26 complete — UX-04 delivered end-to-end

affects:
  - Future phases that modify nav or portfolio routes (regression baseline established)

tech-stack:
  added: []
  patterns:
    - "Quality gate plan pattern: lhci autorun (automated) + human-verify checkpoint (both must pass)"
    - "Playwright .first() selector for elements that resolve to multiple DOM nodes in strict mode"
    - "Standalone Next.js server (node .next/standalone/.../server.js) required for lhci — next start incompatible with output: standalone"

key-files:
  created: []
  modified:
    - apps/web/e2e/portfolio/navigation.spec.ts
    - apps/web/lighthouserc.json

key-decisions:
  - "Playwright strict mode requires .first() on selectors that match multiple elements — getByRole('link') on nav with repeated link text returns >1 result"
  - "lhci startServerCommand must use 'node .next/standalone/apps/web/server.js' not 'npm run start' — next start returns 500 on output:standalone builds"
  - "lhci accessibility score of 0.88 is pre-existing (button-name, color-contrast) — set to warn not error; performance gate at >= 0.90 still the hard requirement"
  - "Phase 26 human verification approved on first attempt — SC-1 through SC-5 all confirmed without rework"

patterns-established:
  - "Quality gate plan: final plan in phase runs lhci + Playwright + human-verify; all three must pass before phase marked complete"

requirements-completed:
  - UX-04

duration: 15min
completed: 2026-02-19
---

# Phase 26 Plan 02: Quality Gate Summary

**Playwright 10/10 nav tests passing + lhci 1.0 performance on all 5 URLs + human SC-1 through SC-5 approved — Phase 26 UX-04 nav redesign shipped**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-19T04:22:00Z
- **Completed:** 2026-02-19T19:33:59Z
- **Tasks:** 3 (including human verification checkpoint)
- **Files modified:** 2

## Accomplishments

- Fixed Playwright navigation E2E tests: 5 were failing due to strict-mode selector ambiguity, all 10 now pass after adding `.first()` and switching selector patterns
- Fixed lhci `startServerCommand`: `next start` returns HTTP 500 on `output: standalone` builds; switched to `node .next/standalone/apps/web/server.js` — all 5 URLs now score 1.0 performance
- Human observer confirmed SC-1 (hover underline), SC-2 (active indicator), SC-3 (typography), SC-4 (mobile left-border), SC-5 (no purple) — approved on first attempt

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Playwright selector failures in navigation.spec.ts** - `7128c68` (fix)
2. **Task 2: Fix lighthouserc.json startServerCommand for standalone output** - `c6183af` (chore)
3. **Task 3: Human verification SC-1 through SC-5** - Approved (no code change)

**Plan metadata:** *(this commit — docs)*

## Files Created/Modified

- `apps/web/e2e/portfolio/navigation.spec.ts` — Added `.first()` to ambiguous selectors, switched case study assertions to `getByRole('heading')`, fixed URL regex; 10/10 tests pass
- `apps/web/lighthouserc.json` — Switched `startServerCommand` from `npm run start` to `node .next/standalone/apps/web/server.js`

## Decisions Made

- Playwright strict mode rejects selectors that match multiple elements — `getByRole('link', { name: /home/i })` matched both nav and mobile nav links. Fix: `.first()` on ambiguous selectors, not weaker assertions.
- `next start` is incompatible with `output: standalone` — it returns HTTP 500 on every route. The standalone server (`node .next/standalone/apps/web/server.js`) returns HTTP 200. This is why lhci was failing in prior phases; now fixed permanently.
- Accessibility score 0.88 (pre-existing `button-name` on theme toggle, `color-contrast` on nav links) — accepted as out-of-scope per Phase 23-03 decision. Performance gate (>= 0.90) is the hard requirement and was met at 1.0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Playwright strict-mode selector failures**
- **Found during:** Task 1 (Run Playwright navigation E2E tests)
- **Issue:** 5 of 10 navigation tests failing — getByRole selectors matched multiple elements (strict mode throws), toHaveURL regex `/^\/$/ ` didn't match full URL string
- **Fix:** Added `.first()` to ambiguous heading/link selectors; switched to `getByRole('heading')` for case study assertions; changed URL check to `toHaveURL('/')`
- **Files modified:** `apps/web/e2e/portfolio/navigation.spec.ts`
- **Verification:** All 10 tests pass, 0 failures
- **Committed in:** `7128c68`

**2. [Rule 3 - Blocking] Fixed lhci startServerCommand incompatible with standalone output**
- **Found during:** Task 2 (Run Lighthouse CI gate)
- **Issue:** `npm run start` (`next start`) returns HTTP 500 on all routes when Next.js `output: standalone` is set — lhci could not get valid responses from the server
- **Fix:** Switched `startServerCommand` to `node .next/standalone/apps/web/server.js` which serves the standalone build correctly
- **Files modified:** `apps/web/lighthouserc.json`
- **Verification:** lhci autorun completes — all 5 URLs score 1.0 performance
- **Committed in:** `c6183af`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes required for the quality gate to pass. The lighthouserc.json fix is a permanent improvement — all future lhci runs will use the correct server command.

## Issues Encountered

- Pre-existing TypeScript errors in `complete-flow.spec.ts` and `api.test.ts` (unrelated to nav) — out of scope, logged to deferred-items.md in Phase 23.
- Pre-existing accessibility score 0.88 (button-name, color-contrast) — accepted as out-of-scope per Phase 23-03 decision.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 26 complete — UX-04 delivered end-to-end (design in 26-01, quality gate in 26-02)
- Navigation E2E regression baseline established: 10 tests covering all portfolio routes
- lhci now correctly uses standalone server — future phases get accurate performance scores
- All v2.5 requirements complete (THEME-01 through UX-04)

---
*Phase: 26-navigation-redesign-awwwards-style-horizontal-nav-with-matrix-personality*
*Completed: 2026-02-19*
