---
phase: 10-component-migration-portfolio
plan: "02"
subsystem: testing
tags: [playwright, axe-core, accessibility, visual-regression, wcag, e2e]

# Dependency graph
requires:
  - phase: 10-component-migration-portfolio
    provides: Portfolio pages to be tested (navigation.spec.ts pattern)
provides:
  - "@axe-core/playwright installed in apps/web devDependencies"
  - "visual-regression.spec.ts: 12 screenshot tests (6 routes x 2 modes)"
  - "accessibility.spec.ts: 12 WCAG AA axe-core audit tests (6 routes x 2 modes)"
affects:
  - 10-component-migration-portfolio
  - 11-dashboard-migration
  - 12-testing-validation

# Tech tracking
tech-stack:
  added:
    - "@axe-core/playwright ^4.11.1 (dev, apps/web)"
  patterns:
    - "Visual regression via toHaveScreenshot with maxDiffPixelRatio: 0.02"
    - "Dark mode injection via page.evaluate(() => document.documentElement.classList.add('dark'))"
    - "storageState with empty cookies for unauthenticated portfolio test access"
    - "AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']) WCAG audit pattern"

key-files:
  created:
    - apps/web/e2e/portfolio/visual-regression.spec.ts
    - apps/web/e2e/portfolio/accessibility.spec.ts
  modified:
    - apps/web/package.json
    - package-lock.json

key-decisions:
  - "Dark mode via classList.add('dark') class injection — not colorScheme which sets media query not Radix Colors class"
  - "maxDiffPixelRatio: 0.02 for visual regression tolerance — 2% pixel change threshold"
  - "WCAG tags: wcag2a + wcag2aa + wcag21aa for comprehensive AA coverage"

patterns-established:
  - "Dark mode test pattern: goto page, waitForLoadState, evaluate classList.add('dark'), waitForTimeout(100) for CSS transitions"
  - "Portfolio test auth pattern: storageState with empty cookies (portfolio is public, no auth needed)"

requirements-completed:
  - MIG-01

# Metrics
duration: 8min
completed: 2026-02-17
---

# Phase 10 Plan 02: Visual Regression and Accessibility Tests Summary

**@axe-core/playwright installed and two Playwright test files created covering 6 portfolio pages x 2 modes each for visual regression snapshots and WCAG AA axe-core audits**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-17T05:01:36Z
- **Completed:** 2026-02-17T05:09:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed @axe-core/playwright ^4.11.1 as dev dependency in apps/web workspace
- Created visual-regression.spec.ts with 12 screenshot tests (6 routes x light + dark mode)
- Created accessibility.spec.ts with 12 WCAG AA axe-core audit tests (6 routes x light + dark mode)
- Both files use class injection pattern for dark mode (not colorScheme media query) to match Radix Colors class-based dark mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @axe-core/playwright** - `ba46547` (chore)
2. **Task 2: Write visual regression and accessibility test files** - `ea20cd4` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/web/e2e/portfolio/visual-regression.spec.ts` - 12 screenshot tests (6 routes x 2 modes), fullPage: true, maxDiffPixelRatio: 0.02
- `apps/web/e2e/portfolio/accessibility.spec.ts` - 12 WCAG AA axe-core audit tests (6 routes x 2 modes)
- `apps/web/package.json` - Added @axe-core/playwright ^4.11.1 to devDependencies
- `package-lock.json` - Updated with 97 new packages from @axe-core/playwright install

## Decisions Made
- Dark mode via `classList.add('dark')` class injection: next-themes uses attribute="class" on `<html>`, so colorScheme (media query) would not activate Radix Colors dark mode CSS variables. Class injection directly activates .dark selectors.
- `maxDiffPixelRatio: 0.02`: 2% pixel tolerance accounts for minor rendering differences (antialiasing, font rendering) without missing real regressions
- WCAG tags `['wcag2a', 'wcag2aa', 'wcag21aa']`: Full WCAG 2.0 A + AA + WCAG 2.1 AA coverage for comprehensive accessibility auditing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in `complete-flow.spec.ts` (Type 'string | undefined') and `api.test.ts` (Object is possibly 'undefined') were found during TypeScript verification. These are out-of-scope pre-existing issues — not caused by this plan. Logged as deferred items.
- New test files compile cleanly with zero TypeScript errors.

## Next Phase Readiness
- Tests are ready to execute once page migration (Plan 03) completes
- Visual regression baseline screenshots will be created on first run
- Accessibility tests will surface any remaining WCAG violations post-migration
- Both files follow the established navigation.spec.ts pattern for consistent test organization

---
*Phase: 10-component-migration-portfolio*
*Completed: 2026-02-17*
