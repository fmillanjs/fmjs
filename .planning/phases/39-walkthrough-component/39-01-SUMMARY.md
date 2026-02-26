---
phase: 39-walkthrough-component
plan: 01
subsystem: ui
tags: [react, next-image, animation, typescript, tailwind, matrix-green, portfolio]

# Dependency graph
requires:
  - phase: 38-screenshot-capture
    provides: Screenshot interface + TEAMFLOW_SCREENSHOTS + DEVCOLLAB_SCREENSHOTS typed manifest
  - phase: 2.5-animation-primitives
    provides: AnimateIn, StaggerContainer, StaggerItem scroll-reveal components

provides:
  - WalkthroughSection React component at apps/web/components/portfolio/walkthrough-section.tsx
  - WalkthroughStep interface (number, x, y, label, explanation)
  - WalkthroughScreenshot interface (src, width, height, alt, steps)
  - WalkthroughSectionProps interface (optional title + screenshots array)

affects:
  - 40-integration: Phase 40 imports WalkthroughSection into TeamFlow and DevCollab case study pages

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Position-absolute callout circles: inline pixel styles (left/top as numbers) over a position:relative image wrapper"
    - "Legend pattern: numbered badge + bold label + explanation text per screenshot"
    - "AnimateIn wraps outer section; StaggerContainer/StaggerItem stagger each screenshot for scroll-reveal"
    - "Reduced-motion handled transparently by AnimateIn and StaggerContainer internals — no extra code in WalkthroughSection"
    - "CSS var tokens (--matrix-green, --matrix-green-border) used via style prop and Tailwind arbitrary values"
    - "Background #0a0a0a expressed as bg-[#0a0a0a] Tailwind class (AnimateIn does not accept style prop)"

key-files:
  created:
    - apps/web/components/portfolio/walkthrough-section.tsx
  modified: []

key-decisions:
  - "AnimateIn does not accept style prop — used bg-[#0a0a0a] Tailwind arbitrary class instead of inline style={{ background: '#0a0a0a' }}"
  - "Task 1 and Task 2 implemented together in one file creation — implementation was complete from the start, no second commit needed"
  - "Pre-existing build failures in e2e/screenshots/ scripts (devcollab-capture.ts, teamflow-capture.ts) confirmed not caused by this plan"

patterns-established:
  - "WalkthroughStep.x and WalkthroughStep.y are raw pixel numbers — React auto-appends 'px' in inline style"
  - "Callout circle size: 28x28 overlay, 22x22 legend badge; both use --matrix-green bg with #0a0a0a text"
  - "aria-label on overlay circles; aria-hidden=true on legend badges (screen readers see the p text)"

requirements-completed: [WALK-01, WALK-02, WALK-03, WALK-04]

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 39 Plan 01: Walkthrough Component Summary

**Reusable WalkthroughSection component with pixel-pinned callout circles, numbered legend, --matrix-green styling, and AnimateIn/StaggerContainer scroll-reveal animations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-26T10:02:11Z
- **Completed:** 2026-02-26T10:04:42Z
- **Tasks:** 3 (Tasks 1+2 implemented together, Task 3 verification only)
- **Files modified:** 1

## Accomplishments

- Created `WalkthroughSection` component with typed props — accepts any screenshots array with step definitions
- Implemented pixel-precise callout circle overlay using `position: absolute` with inline `left`/`top` style values (WALK-01)
- Implemented numbered legend below each screenshot with label (--matrix-green, font-mono) and explanation (slate-400) (WALK-02)
- Applied Matrix styling throughout: bg-[#0a0a0a] section, --matrix-green circles and labels, font-mono (WALK-03)
- Wrapped section in AnimateIn + StaggerContainer/StaggerItem for scroll-reveal with automatic reduced-motion support (WALK-04)
- Zero TypeScript errors, zero ESLint warnings on the component file

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Define types and implement full component body** - `675ff32` (feat)
2. **Task 3: Verification pass** - no code changes (build failure confirmed pre-existing, not caused by this plan)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

- `apps/web/components/portfolio/walkthrough-section.tsx` — WalkthroughSection component with callout overlays, legend, Matrix styling, and scroll-reveal animations

## Decisions Made

- AnimateIn component does not accept a `style` prop (not in its interface) — used Tailwind arbitrary class `bg-[#0a0a0a]` on the `className` prop instead of `style={{ background: '#0a0a0a' }}`. This matches the canonical background value.
- Tasks 1 and 2 were implemented in one file creation pass. The skeleton (Task 1) and the body (Task 2) were written together, so both tasks share the same commit `675ff32`.
- The Next.js build failure (`devcollab-capture.ts` line 44, `match[1]` type error) is a pre-existing issue from Phase 38 — confirmed by `git stash` + rebuild showing the same failure before our changes. Out of scope per deviation rules (SCOPE BOUNDARY).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AnimateIn style prop incompatibility**
- **Found during:** Task 1 (initial file creation)
- **Issue:** Plan example used `style={{ background: '#0a0a0a' }}` on AnimateIn, but AnimateIn's interface only accepts `children`, `className`, `delay`, `as` — no `style` prop. TypeScript error: Type '{ style: ... }' is not assignable to type 'IntrinsicAttributes & AnimateInProps'.
- **Fix:** Replaced `style={{ background: '#0a0a0a' }}` with Tailwind arbitrary class `bg-[#0a0a0a]` on the `className` prop
- **Files modified:** apps/web/components/portfolio/walkthrough-section.tsx
- **Verification:** TypeScript compilation passes with zero errors on walkthrough-section.tsx
- **Committed in:** 675ff32

---

**Total deviations:** 1 auto-fixed (1 bug — interface incompatibility in plan example code)
**Impact on plan:** Fix is minimal — background style is preserved via Tailwind arbitrary value. Functionally identical result.

## Issues Encountered

- Pre-existing build failure in `e2e/screenshots/devcollab-capture.ts` (match[1] type `string | undefined` vs `string | null`). Confirmed pre-existing via git stash test. Documented in deferred items and out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `WalkthroughSection`, `WalkthroughStep`, `WalkthroughScreenshot` all exported from `apps/web/components/portfolio/walkthrough-section.tsx`
- Component is self-contained — import it into any case study page, pass `screenshots` array with `steps`, and it renders
- Phase 40 can immediately import and use WalkthroughSection in both TeamFlow and DevCollab case study pages
- No blockers

---
*Phase: 39-walkthrough-component*
*Completed: 2026-02-26*
