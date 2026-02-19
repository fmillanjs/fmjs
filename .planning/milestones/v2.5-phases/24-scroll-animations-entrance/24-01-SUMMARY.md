---
phase: 24-scroll-animations-entrance
plan: "01"
subsystem: ui
tags: [motion, animation, scroll-reveal, reduced-motion, react, nextjs]

# Dependency graph
requires:
  - phase: 22-matrix-theme-foundation
    provides: motion package installed, motion/react import path established
  - phase: 23-canvas-matrix-rain
    provides: ANIM-03 Lighthouse gate cleared, Phase 24 unblocked

provides:
  - MotionConfig reducedMotion='user' gate wrapping all portfolio main content
  - AnimateIn scroll-reveal wrapper with fade+slide-up on viewport entry
  - StaggerContainer + StaggerItem for sequenced card grid entrances at 150ms intervals
  - Reduced-motion safe: all three components render plain elements when OS prefers-reduced-motion is on

affects:
  - 24-02 (applies AnimateIn to portfolio pages)
  - 24-03 (applies StaggerContainer/StaggerItem to project/tech-stack grids)
  - Phase 25 (FX-01 text scramble, FX-04 spotlight — all use same motion/react primitives)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MotionConfig reducedMotion='user' as layout-level gate (server component layout imports client provider)
    - useReducedMotion early-return pattern — plain element fallback before any motion component renders
    - whileInView + viewport once:true for scroll-triggered one-shot animations
    - Variants typed explicitly (import Variants from motion/react) to satisfy TypeScript strict mode

key-files:
  created:
    - apps/web/components/portfolio/motion-provider.tsx
    - apps/web/components/portfolio/animate-in.tsx
    - apps/web/components/portfolio/stagger-container.tsx
  modified:
    - apps/web/app/(portfolio)/layout.tsx

key-decisions:
  - "MotionProvider wraps only <main> in layout.tsx — not nav, footer, or CommandPalette"
  - "itemVariants typed as Variants with 'easeOut' as const — motion/react strict Easing type requires this"
  - "StaggerItem uses variants prop only (no initial/whileInView) — inherits from StaggerContainer parent"

patterns-established:
  - "layout-level motion gate: Server Component layout imports 'use client' MotionProvider wrapper"
  - "reduced-motion early-return: useReducedMotion() check at top, plain element if true, motion element otherwise"
  - "scroll reveal: whileInView + viewport once:true + amount:0.2 — fires once per page visit"

requirements-completed:
  - ANIM-01

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 24 Plan 01: Animation Primitives (MotionProvider + AnimateIn + StaggerContainer) Summary

**Three shared animation primitives created with full reduced-motion safety gates and MotionConfig wired into portfolio layout**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T07:17:48Z
- **Completed:** 2026-02-19T07:19:17Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created `MotionProvider` with `MotionConfig reducedMotion="user"` — reads OS prefers-reduced-motion automatically via window.matchMedia
- Created `AnimateIn` scroll reveal component — fade+slide-up (opacity 0→1, y 24→0) with `whileInView` viewport trigger that fires once per page visit
- Created `StaggerContainer` + `StaggerItem` — sequences card entrances at 150ms intervals (staggerChildren: 0.15), plain div fallback when reduced motion is on
- Wired `MotionProvider` into `(portfolio)/layout.tsx` wrapping only `<main>` — nav, footer, CommandPalette excluded
- Zero hydration warnings: `initial={{ opacity: 0 }}` applied by motion's DOM style API client-side after hydration, never in SSR HTML

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MotionProvider and wire into portfolio layout** - `298f61a` (feat)
2. **Task 2: Create AnimateIn single-element scroll reveal component** - `96f98c9` (feat)
3. **Task 3: Create StaggerContainer and StaggerItem components** - `a0cc624` (feat)

## Files Created/Modified

- `apps/web/components/portfolio/motion-provider.tsx` - 'use client' wrapper exporting MotionProvider with MotionConfig reducedMotion="user"
- `apps/web/components/portfolio/animate-in.tsx` - Single-element scroll reveal with useReducedMotion gate and whileInView trigger
- `apps/web/components/portfolio/stagger-container.tsx` - StaggerContainer + StaggerItem for card grid sequenced entrances
- `apps/web/app/(portfolio)/layout.tsx` - Added MotionProvider import and wrapping around main content only

## Decisions Made

- **MotionProvider wraps only `<main>`** — nav and footer do not need motion orchestration; CommandPalette is a modal overlay; scoping to main is the minimal correct surface
- **`itemVariants` typed as `Variants` with `'easeOut' as const`** — motion/react strict `Easing` type rejects bare `string`; `as const` narrows to the literal type it expects
- **`StaggerItem` uses `variants` prop only (no `initial`/`whileInView`)** — it inherits animation state from the `StaggerContainer` parent through motion's variant propagation mechanism

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Variants TypeScript type error in stagger-container.tsx**
- **Found during:** Task 3 (Create StaggerContainer and StaggerItem)
- **Issue:** `ease: 'easeOut'` inferred as `string` but motion/react expects `Easing` type; also `itemVariants` needed explicit `Variants` type annotation
- **Fix:** Added `import type { Variants }` from motion/react; annotated both `containerVariants` and `itemVariants` as `Variants`; added `as const` to `'easeOut'` literal
- **Files modified:** `apps/web/components/portfolio/stagger-container.tsx`
- **Verification:** `tsc --noEmit` reports zero errors on stagger-container.tsx after fix
- **Committed in:** `a0cc624` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Type fix was necessary for TypeScript correctness; behavior unchanged from plan specification.

## Issues Encountered

- Pre-existing TypeScript errors exist in `apps/web/e2e/user-journey/complete-flow.spec.ts` and `apps/web/lib/api.test.ts` (string | undefined assignments) — these are out of scope, not caused by this plan's changes, and were not touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three animation primitives are ready for consumption by Plans 02 and 03
- Plan 02 can apply `AnimateIn` to hero, about, and contact pages
- Plan 03 can apply `StaggerContainer`/`StaggerItem` to projects and tech-stack card grids
- `MotionProvider` gate is active — any motion component added to portfolio pages will automatically respect user OS preference

---
*Phase: 24-scroll-animations-entrance*
*Completed: 2026-02-19*
