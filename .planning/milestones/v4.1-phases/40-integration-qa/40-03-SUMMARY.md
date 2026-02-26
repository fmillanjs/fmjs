---
phase: 40-integration-qa
plan: 03
subsystem: ui
tags: [lighthouse, accessibility, wcag, performance, aria, next-themes]

# Dependency graph
requires:
  - phase: 40-01
    provides: "walkthrough-data.ts, Lighthouse accessibility gate upgraded to error"
  - phase: 40-02
    provides: "WalkthroughSection integrated into teamflow/page.tsx and devcollab/page.tsx"
provides:
  - "Lighthouse CI passing: performance >= 0.90, accessibility = 1.0 on all 5 portfolio pages"
  - "aria-label on all callout overlay circles (Step N: Label format)"
  - "Explicit accessible colors (#e8e8e8/#b0b0b0) on nav and footer links"
  - "SSR dark mode via class='dark' on <html> element"
  - "Human-verified visual + reduced-motion compliance on both case study pages (QA-03 confirmed)"
  - "v4.1 milestone COMPLETE — all 12 requirements satisfied (SHOT-01 through QA-03)"
affects: [deployment, any future lighthouse CI runs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone Next.js build requires manual copy of .next/static and public into .next/standalone/apps/web"
    - "Use CHROME_PATH with Playwright Chromium for LHCI in WSL2 environments"
    - "Use class='dark' on <html> server-side to avoid next-themes hydration contrast issues with Lighthouse"
    - "Use explicit hex colors (#e8e8e8, #b0b0b0) instead of CSS variable tokens on interactive elements for reliable contrast"

key-files:
  created: []
  modified:
    - apps/web/components/portfolio/nav.tsx
    - apps/web/components/portfolio/footer.tsx
    - apps/web/app/layout.tsx
    - apps/web/e2e/screenshots/devcollab-capture.ts
    - apps/web/e2e/screenshots/teamflow-capture.ts
    - apps/web/.lighthouseci/assertion-results.json

key-decisions:
  - "Used class='dark' on <html> server-side: next-themes with defaultTheme='dark' was not injecting dark class in SSR, causing Lighthouse to audit in light mode and see #9e9eff (browser UA link color) instead of our token colors"
  - "Changed footer h4 labels to p elements: h4 after h1 violates heading-order (skip h2/h3); labels are decorative not semantic"
  - "Used CHROME_PATH pointing to Playwright Chromium for LHCI in WSL2: system Chrome was unavailable"
  - "Manual static copy workaround: LHCI standalone server needs .next/static copied into standalone build dir"

patterns-established:
  - "Color accessibility: always use explicit hex values on interactive elements, never CSS variable tokens that may not resolve in Lighthouse"
  - "After Next.js standalone build: always copy .next/static and public into .next/standalone/apps/web/ before running LHCI"

requirements-completed: [QA-01, QA-02, QA-03]

# Metrics
duration: 33min
completed: 2026-02-26
---

# Phase 40 Plan 03: Lighthouse CI QA Gates Summary

**Lighthouse CI passing (acc = 1.0, perf >= 0.92) on all 5 pages + human-verified visual and reduced-motion compliance completes v4.1 milestone with all 12 requirements satisfied**

## Performance

- **Duration:** ~55 min (includes LHCI setup, build troubleshooting, and human verify checkpoint wait)
- **Started:** 2026-02-26T12:58:42Z
- **Completed:** 2026-02-26T13:51:15Z
- **Tasks:** 3 of 3 complete
- **Files modified:** 6

## Accomplishments

- aria-label attributes on all callout overlay circles were already present (Phase 39 delivered this correctly)
- Lighthouse CI runs with 0 assertion failures across 5 pages: `/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`
- Performance = 0.92-0.98 on all pages (all pass >= 0.90 gate)
- Accessibility = 1.0 on all pages (all pass error-level gate)

## Task Commits

1. **Task 1: Verify aria-label attributes on callout circles** — Verification only, no code changes (aria-label was already correct from Phase 39)
2. **Task 2: Build and run Lighthouse CI** — `227117c` (fix: resolve accessibility gate violations)
3. **Task 3: Human visual + reduced-motion verification** — Approved by user (no commit — visual-only verification; no code changes)

## Files Created/Modified

- `apps/web/components/portfolio/nav.tsx` — Changed text-foreground → text-[#e8e8e8], text-muted-foreground → text-[#b0b0b0] for explicit accessible contrast
- `apps/web/components/portfolio/footer.tsx` — Same color fix + added py-1 for touch targets + changed h4 → p to fix heading-order
- `apps/web/app/layout.tsx` — Added class="dark" to html element for SSR dark mode (fixes Lighthouse contrast audit)
- `apps/web/e2e/screenshots/devcollab-capture.ts` — Fixed match[1] | undefined type error (Rule 1 - blocked build)
- `apps/web/e2e/screenshots/teamflow-capture.ts` — Fixed match[1] | undefined type errors (Rule 1 - blocked build)
- `apps/web/.lighthouseci/assertion-results.json` — Updated with passing results []

## Decisions Made

- Used `class="dark"` server-side on `<html>`: next-themes was not injecting the dark class during SSR, causing Lighthouse to audit in light mode where CSS variable tokens resolved unexpectedly to `#9e9eff` (browser UA periwinkle link color). Adding dark class server-side ensures the dark theme is applied from first paint.
- Changed footer `<h4>` labels to `<p>` elements: the `/projects` page had only `<h1>`, and the footer's `<h4>` violated `heading-order` (skipping h2/h3). The footer labels are decorative ("navigation", "connect") and should not be semantic headings.
- Used CHROME_PATH with Playwright Chromium: Chrome wasn't installed system-wide in WSL2, but Playwright Chromium was available at `/home/doctor/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`.
- Manual static copy required: Next.js standalone build output does NOT include `.next/static/` in the standalone directory. The static files must be manually copied from `.next/static/` to `.next/standalone/apps/web/.next/static/` before LHCI can serve client chunks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type errors in e2e screenshot scripts blocking build**
- **Found during:** Task 2 (Build step)
- **Issue:** `devcollab-capture.ts` and `teamflow-capture.ts` had `match[1]` returning `string | undefined` but function return type declared `string | null`. Three separate instances.
- **Fix:** Added `?? null` fallback: `return match[1] ?? null`
- **Files modified:** `apps/web/e2e/screenshots/devcollab-capture.ts`, `apps/web/e2e/screenshots/teamflow-capture.ts`
- **Verification:** Build passes successfully
- **Committed in:** 227117c (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added explicit accessible colors to nav and footer links**
- **Found during:** Task 2 (LHCI run analysis)
- **Issue:** All portfolio nav links showed `#9e9eff` (browser UA color) against `#ffffff` background = 2.38:1 contrast (fails 4.5:1 WCAG AA). Root cause: CSS variable tokens not resolving before Lighthouse audit due to SSR rendering without dark class.
- **Fix:**
  1. Added `class="dark"` to `<html>` server-side in `app/layout.tsx`
  2. Changed nav links from `text-foreground`/`text-muted-foreground` to explicit `text-[#e8e8e8]`/`text-[#b0b0b0]`
  3. Changed footer links similarly, added `py-1 inline-block` for touch targets
  4. Changed footer `<h4>` to `<p>` to fix heading-order violation
- **Files modified:** `apps/web/app/layout.tsx`, `apps/web/components/portfolio/nav.tsx`, `apps/web/components/portfolio/footer.tsx`
- **Verification:** Lighthouse CI assertion-results.json = `[]` (empty, no failures)
- **Committed in:** 227117c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking type error, 1 missing accessibility)
**Impact on plan:** Both auto-fixes required for correctness. The accessibility fixes were essential for the plan's primary goal (LHCI passing). No scope creep.

## Issues Encountered

- **LHCI Chrome launch failure**: Lighthouse couldn't find Chrome system-wide in WSL2. Fixed by using `CHROME_PATH=/home/doctor/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` env var pointing to Playwright's Chromium.
- **Standalone build missing static files**: Next.js standalone build does not automatically copy `.next/static` into the standalone directory. Had to manually `cp -r .next/static .next/standalone/apps/web/.next/static` before LHCI could serve JS chunks to Lighthouse.
- **Initial fix ineffective**: First LHCI run with accessibility fixes appeared to use an old build because static files weren't copied yet — the server was serving old JS chunks while the server-side chunks had been updated. Resolved by discovering and fixing the static copy issue.

## Lighthouse CI Results (Final)

| Page | Accessibility | Performance |
|------|---------------|-------------|
| `/` | 1.0 | 0.95-0.98 |
| `/projects` | 1.0 | 0.92-0.93 |
| `/projects/teamflow` | 1.0 | 0.96-0.97 |
| `/projects/devcollab` | 1.0 | 0.95-0.97 |
| `/contact` | 1.0 | 0.92-0.93 |

QA-01: PASS (performance >= 0.90 on all pages)
QA-02: PASS (accessibility = 1.0 error gate on all pages)
QA-03: PASS (human confirmed — no entrance animation fires under prefers-reduced-motion: reduce)

## Next Phase Readiness

- v4.1 milestone: ALL 12 requirements complete (SHOT-01 through QA-03) — milestone SHIPPED
- Both case study pages show WalkthroughSection with real screenshots and callout overlays
- All Lighthouse CI gates pass
- Human visual verification complete — both pages render correctly, reduced-motion compliant, console error-free

## Self-Check: PASSED

- FOUND: `/home/doctor/fernandomillan/.planning/phases/40-integration-qa/40-03-SUMMARY.md`
- FOUND: `apps/web/components/portfolio/nav.tsx` (updated with explicit colors)
- FOUND: `apps/web/app/layout.tsx` (class="dark" added)
- FOUND: `apps/web/.lighthouseci/assertion-results.json` (empty array = all passing)
- FOUND: commit 227117c (accessibility fixes)
- Task 3: Visual + reduced-motion verification approved by user on 2026-02-26

---
*Phase: 40-integration-qa*
*Completed: 2026-02-26*
