---
phase: 31-magnetic-buttons
plan: 01
subsystem: ui
tags: [motion/react, spring-physics, useSpring, useMotionValue, useReducedMotion, magnetic-button, accessibility, touch-guard]

# Dependency graph
requires: []
provides:
  - "MagneticButton 'use client' component with spring-physics cursor attraction"
  - "Reduced-motion early-return rendering plain <div> wrapper"
  - "Touch device guard via (any-hover: hover) matchMedia in useEffect"
  - "getBoundingClientRect() caching in mouseenter only — TBT-safe"
affects: [31-02-cta-wrapping, future-ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All hooks called before conditional early return (rules of hooks)"
    - "getBoundingClientRect() cached on mouseenter — never called per-pixel in mousemove"
    - "window.matchMedia() inside useEffect only — never at render time (SSR safe)"
    - "motion.div wrapper moves; inner button stays at layout position (focus ring preserved)"

key-files:
  created:
    - apps/web/components/portfolio/magnetic-button.tsx
  modified: []

key-decisions:
  - "motion.div wrapper used instead of motion.button — CSS transform on button breaks focus ring alignment for keyboard navigation"
  - "rectRef cached on mouseenter, not mousemove — prevents forced reflows at 200Hz causing TBT spike"
  - "prefersReducedMotion null (SSR) is falsy — falls through to motion render, hydration-safe"
  - "SPRING_CONFIG stiffness:150, damping:30, mass:0.2 — perceptible attraction without oscillation per RESEARCH.md"

patterns-established:
  - "MagneticButton: 'use client' wrapper accepting children + optional className — wraps any button child without modifying the button element"
  - "Touch guard: canHoverRef set in useEffect via window.matchMedia('(any-hover: hover)') — same pattern as dot-grid-spotlight.tsx"

requirements-completed: [MAGN-01, MAGN-02, MAGN-03]

# Metrics
duration: 1min
completed: 2026-02-21
---

# Phase 31 Plan 01: Magnetic Button Summary

**MagneticButton 'use client' component using motion/react useSpring (stiffness:150, damping:30, mass:0.2) with reduced-motion early-return, (any-hover) touch guard, and rect caching on mouseenter to prevent TBT spikes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-21T06:08:21Z
- **Completed:** 2026-02-21T06:09:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `MagneticButton` component with correct hooks ordering — all hooks before conditional return (rules of hooks compliance)
- Implemented `getBoundingClientRect()` caching on `mouseenter` only — prevents forced reflows per-pixel in `mousemove`, TBT-safe for LHCI gate
- Applied `(any-hover: hover)` matchMedia guard inside `useEffect` — touch device tap flicker prevented (same pattern as `dot-grid-spotlight.tsx`)
- `useReducedMotion()` early-return renders plain `<div>` — no spring physics allocated for reduced-motion users, SSR-null handled correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MagneticButton component** - `b40e2bd` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `apps/web/components/portfolio/magnetic-button.tsx` - MagneticButton 'use client' component with spring-physics cursor attraction, touch guard, reduced-motion fallback, and rect caching

## Decisions Made

- Used `motion.div` wrapper (not `motion.button`) — CSS transform on button element breaks focus ring alignment for keyboard navigation (RESEARCH.md Pitfall 3)
- `getBoundingClientRect()` cached in `handleMouseEnter`, referenced in `handleMouseMove` — prevents TBT spike from forced reflow on every cursor pixel (RESEARCH.md Pitfall 5)
- `prefersReducedMotion` null (SSR) treated as falsy — motion render on SSR is hydration-safe; only `true` (explicit user preference) triggers plain div
- SPRING_CONFIG `{ stiffness: 150, damping: 30, mass: 0.2 }` — matches RESEARCH.md recommendation, confirmed against project `framer-motion` types

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `e2e/user-journey/complete-flow.spec.ts` and `lib/api.test.ts` — out of scope, not caused by this task. Not fixed per deviation rule scope boundary.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `MagneticButton` is ready for Plan 31-02 to import and apply to the three CTAs ("View Projects", "View GitHub" in hero-section.tsx, "Get In Touch" in about/page.tsx)
- Component exports `MagneticButton` — import path: `@/components/portfolio/magnetic-button`
- TypeScript compiles with zero errors referencing magnetic-button.tsx
- No new dependencies added — `motion/react` already in package.json at `^12.34.2`

---
*Phase: 31-magnetic-buttons*
*Completed: 2026-02-21*
