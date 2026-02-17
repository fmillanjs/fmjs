---
phase: 10-component-migration-portfolio
plan: "04"
subsystem: testing
tags: [playwright, axe-core, visual-regression, wcag, accessibility, dark-mode, color-contrast]

# Dependency graph
requires:
  - phase: 10-component-migration-portfolio
    provides: all 6 portfolio pages migrated to Shadcn UI components
provides:
  - 12 visual regression baseline screenshots (6 pages x 2 modes, chromium-linux)
  - 12 WCAG AA accessibility tests passing with 0 violations
  - Fixed color contrast violations across entire portfolio
  - bg-background text-foreground on body element (axe-core dark mode compatibility)
affects: [11-dashboard-component-migration, future-testing-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - localStorage pre-load dark mode (addInitScript before goto) instead of post-load class injection
    - bg-background text-foreground on body for axe-core CSS custom property resolution
    - blue-11 as primary token (WCAG 2 AA: 4.93:1) vs blue-9 (APCA only: 2.99:1 WCAG)
    - blue-12 as accent-foreground (10.9:1) for reliable contrast on accent backgrounds
    - --primary-foreground dark mode override via .dark { --primary-foreground: var(--slate-1) }

key-files:
  created:
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/ (12 PNG files)
  modified:
    - apps/web/e2e/portfolio/accessibility.spec.ts
    - apps/web/e2e/portfolio/visual-regression.spec.ts
    - apps/web/app/globals.css
    - apps/web/app/layout.tsx
    - apps/web/app/(portfolio)/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
    - apps/web/components/portfolio/footer.tsx
    - apps/web/components/ui/button.tsx

key-decisions:
  - "dark mode test uses localStorage pre-load (addInitScript) not post-load class injection — axe-core CSS var resolution requires opaque background from initial render"
  - "bg-background text-foreground added to body element — without this, html/body/main all report rgba(0,0,0,0) and axe-core falls back to white browser canvas"
  - "primary token: blue-9 → blue-11 in light mode for WCAG 2 AA — blue-9 (#0090ff) only 2.99:1 on white, blue-11 (#0d74ce) achieves 4.93:1"
  - "primary-foreground dark mode override: .dark { --primary-foreground: var(--slate-1) } — blue-11 dark (#70b8ff) needs dark text (9.04:1) not white (2.11:1)"
  - "accent-foreground: blue-11 → blue-12 — blue-11 on blue-3 only 4.25:1 in P3 gamut; blue-12 achieves 10.9:1"
  - "bg-muted/30 → bg-muted in footer and stats section — opacity blending caused axe-core to compute mid-gray backgrounds with catastrophic contrast"
  - "Back to Projects link: underline + hover:no-underline — link-in-text-block rule requires style distinction (not just color) for inline links"

requirements-completed:
  - MIG-01

# Metrics
duration: 17min
completed: 2026-02-17
---

# Phase 10 Plan 04: Visual Regression Baselines and WCAG AA Accessibility Tests Summary

**12 Playwright visual regression baselines committed and 12 WCAG AA accessibility tests pass with 0 violations after fixing systemic color contrast issues in the design token layer**

## Performance

- **Duration:** 17 min
- **Started:** 2026-02-17T05:10:18Z
- **Completed:** 2026-02-17T05:27:00Z
- **Tasks:** 1 of 2 complete (Task 2 = checkpoint awaiting human verification)
- **Files modified:** 20

## Accomplishments

- 12 visual regression baseline screenshots created (6 portfolio pages x light + dark mode)
- All 12 WCAG AA accessibility tests pass with 0 violations across all 6 portfolio pages in both modes
- Fixed 9 separate color contrast violations in the design token layer and portfolio components
- Root cause diagnosis: axe-core cannot resolve CSS custom properties when body has no explicit bg — fixed by adding `bg-background text-foreground` to body element
- Dark mode testing improved: localStorage pre-load ensures CSS variables resolve on first render

## Task Commits

1. **Task 1: Run tests, fix accessibility violations, generate baselines** - `6a06455` (test)

## Files Created/Modified

- `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/` — 12 PNG baselines (6 pages x 2 modes)
- `apps/web/e2e/portfolio/accessibility.spec.ts` — dark mode test uses localStorage pre-load
- `apps/web/e2e/portfolio/visual-regression.spec.ts` — dark mode test uses localStorage pre-load
- `apps/web/app/globals.css` — primary: blue-9→blue-11, accent-foreground: blue-11→blue-12, dark mode primary-foreground override
- `apps/web/app/layout.tsx` — body gets bg-background text-foreground (critical for axe-core)
- `apps/web/app/(portfolio)/page.tsx` — stats section bg-muted/30→bg-muted
- `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — green-600→green-700, text-primary→text-accent-foreground in accent box, Back link gets permanent underline
- `apps/web/components/portfolio/footer.tsx` — footer bg-muted/30→bg-muted
- `apps/web/components/ui/button.tsx` — outline variant gets explicit text-foreground class

## Decisions Made

**Key architectural discovery:** The `bg-background` utility is `background-color: var(--background)` — a CSS variable reference. Without explicit `bg-background` on the `<body>`, the computed background is `rgba(0,0,0,0)` (transparent). Axe-core traverses the DOM to find the opaque background and finds none, defaulting to the browser canvas white `#ffffff`. This caused ALL dark mode accessibility tests to report wrong backgrounds.

**Radix Colors WCAG 2 vs APCA:** The Radix Colors "step 9 pairs with white" guarantee is for APCA Lc 60, NOT WCAG 2 4.5:1. Blue-9 (#0090ff) vs white = 2.99:1 (fails WCAG 2 AA). Blue-11 (#0d74ce) vs white = 4.93:1 (passes). Design system updated accordingly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 12 WCAG AA color contrast violations found and fixed**
- **Found during:** Task 1 (Run accessibility tests)
- **Issue:** All 12 accessibility tests failed — primarily color-contrast violations. blue-9 as primary token doesn't meet WCAG 2 AA. bg-muted/30 creates low-opacity backgrounds. Body has no opaque background color, axe-core falls back to white.
- **Fix:** Changed primary to blue-11 (light mode), added dark mode primary-foreground override, changed accent-foreground to blue-12, changed bg-muted/30→bg-muted in two sections, added bg-background text-foreground to body, fixed green-600→green-700 on teamflow, changed text-primary→text-accent-foreground in accent box, added permanent underline to Back link
- **Files modified:** globals.css, layout.tsx, page.tsx (homepage), teamflow/page.tsx, footer.tsx, button.tsx
- **Verification:** All 12 accessibility tests pass with 0 violations
- **Committed in:** 6a06455 (Task 1 commit)

**2. [Rule 1 - Bug] Visual regression baselines required --update-snapshots flag**
- **Found during:** Task 1 (first run of visual-regression.spec.ts)
- **Issue:** Playwright doesn't auto-accept first-run screenshots as baselines — it fails with "A snapshot doesn't exist... writing actual." The plan stated "first run creates baselines" which is incorrect for Playwright's current behavior.
- **Fix:** Used --update-snapshots flag to accept captured screenshots as baselines
- **Files modified:** visual-regression.spec.ts-snapshots/ (12 PNG files created)
- **Committed in:** 6a06455 (Task 1 commit)

**3. [Rule 1 - Bug] Dark mode test approach: post-load class injection → localStorage pre-load**
- **Found during:** Task 1 (all dark mode accessibility tests failing with bgColor #ffffff)
- **Issue:** Post-load `page.evaluate(() => classList.add('dark'))` causes axe-core to compute wrong background colors because the CSS custom property chain resolves correctly but the computed background of html/body/main is still transparent (rgba(0,0,0,0)) and axe traversal falls back to browser canvas white
- **Fix:** Changed dark mode tests to use `addInitScript(() => localStorage.setItem('theme', 'dark'))` before `page.goto()` so next-themes initializes in dark mode from first render
- **Files modified:** accessibility.spec.ts, visual-regression.spec.ts
- **Committed in:** 6a06455 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All auto-fixes necessary for correctness and test validity. The color contrast fixes are genuine accessibility improvements — the portfolio now fully passes WCAG 2 AA. The dark mode test approach change is required for reliable axe-core testing.

## Issues Encountered

The Playwright `--update-snapshots` requirement was unexpected (plan said first run auto-creates baselines). The actual Playwright behavior is: first run captures actual screenshots but FAILS with "snapshot doesn't exist, writing actual". You must run with `--update-snapshots` to accept those captures as the new baseline. This has been noted for future planning.

## User Setup Required

None - no external service configuration required. Dev server is running at http://localhost:3000.

## Next Phase Readiness

- Task 2 (checkpoint:human-verify) is paused awaiting human visual verification
- After human approval, Phase 10 is complete and Phase 11 (dashboard component migration) can begin
- Pre-existing navigation test failures (5 tests) are out of scope: they use brittle selectors that match multiple elements and require API server for some flows

---
*Phase: 10-component-migration-portfolio*
*Completed: 2026-02-17 (pending human verification)*

## Self-Check: PASSED

- FOUND: apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/homepage-light-chromium-linux.png
- FOUND: apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/homepage-dark-chromium-linux.png
- FOUND: 12 PNG files in snapshots directory
- FOUND: commit 6a06455
