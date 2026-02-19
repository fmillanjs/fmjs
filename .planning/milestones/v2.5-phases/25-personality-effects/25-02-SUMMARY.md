---
phase: 25-personality-effects
plan: 02
subsystem: ui
tags: [motion, framer-motion, hover-effects, evervault, noise-decryption, rsc-boundary]

# Dependency graph
requires:
  - phase: 22-matrix-theme
    provides: --matrix-green CSS custom property used for noise overlay text color
  - phase: 25-01
    provides: motion/react usage pattern established (useReducedMotion guard)
provides:
  - EvervaultCard component wrapping both featured project cards on home page
  - Radial gradient noise decryption effect on hover using useMotionValue + useMotionTemplate
affects: [25-03, 25-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component imports Client Component (RSC boundary) — page.tsx (server) imports EvervaultCard (client)"
    - "useMotionValue + useMotionTemplate for cursor tracking outside React render cycle"
    - "pointer-events-none on noise overlay — mandatory to preserve link click navigation"
    - "useReducedMotion guard pattern — plain div fallback when reduced motion preferred"

key-files:
  created:
    - apps/web/components/portfolio/evervault-card.tsx
  modified:
    - apps/web/app/(portfolio)/page.tsx

key-decisions:
  - "Noise overlay uses pointer-events-none — without this, card clicks are intercepted and navigation breaks"
  - "useMotionValue + useMotionTemplate for mask-image — updates CSS mask outside React render cycle (no re-renders on mousemove for the gradient)"
  - "randomNoise() on every mousemove via useState — intentional, noise string must change to create decryption feel"
  - "EvervaultCard wraps inner card content, not the Link wrapper — preserves card-glow-hover behavior on Link"
  - "page.tsx remains a Server Component — no 'use client' needed; RSC can import and render Client Components"
  - "aria-hidden=true on noise overlay — screen readers skip random characters, announce real content"

patterns-established:
  - "Pattern: Server Component importing Client Component — page.tsx imports EvervaultCard without adding use client to page.tsx"
  - "Pattern: cursor-relative radial gradient mask using useMotionTemplate with CSS mask-image property"

requirements-completed: [FX-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 25 Plan 02: FX-03 Evervault Card Summary

**Evervault-style noise decryption hover effect on featured project cards using useMotionValue + radial-gradient CSS mask from motion/react — zero new dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T08:55:14Z
- **Completed:** 2026-02-19T08:56:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `EvervaultCard` client component: cursor-relative radial gradient spotlight reveals 1500-char noise layer of matrix ASCII + katakana characters on hover
- Integrated EvervaultCard into both featured project cards (TeamFlow, DevCollab) on home page
- RSC boundary maintained: `page.tsx` stays a Server Component, imports `EvervaultCard` which is `'use client'`
- Reduced motion gate: `useReducedMotion()` returns plain `<div>` with no effect whatsoever

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EvervaultCard component** - `f1f703f` (feat)
2. **Task 2: Integrate EvervaultCard into home page project cards** - `a956a1c` (feat)

**Plan metadata:** (docs commit follows)

## Self-Check: PASSED

- FOUND: apps/web/components/portfolio/evervault-card.tsx
- FOUND: apps/web/app/(portfolio)/page.tsx
- FOUND: .planning/phases/25-personality-effects/25-02-SUMMARY.md
- Commits f1f703f and a956a1c confirmed in git log

## Files Created/Modified

- `apps/web/components/portfolio/evervault-card.tsx` - Evervault-style noise decryption wrapper component using motion/react
- `apps/web/app/(portfolio)/page.tsx` - Home page with EvervaultCard wrapping TeamFlow and DevCollab project card content

## RSC Boundary Handling

`page.tsx` is a Next.js Server Component (exports `metadata`, no `'use client'`). `EvervaultCard` is a Client Component (`'use client'` at top). This is valid React Server Components architecture: a Server Component CAN import and render a Client Component — the RSC/client boundary is handled automatically by Next.js. Adding `'use client'` to `page.tsx` was explicitly avoided because it would disable Server-side rendering of `metadata` exports.

## Decisions Made

- Noise overlay `pointer-events-none` is mandatory — without it, the absolutely-positioned overlay intercepts all pointer events and card navigation breaks
- `useMotionValue` + `useMotionTemplate` update the radial-gradient mask-image outside React's render cycle — no re-render per mousemove for the gradient position
- `randomNoise()` IS called per mousemove via `useState` (this triggers a React re-render) — this is intentional because the noise characters must change to create the visual decryption effect
- Wrapping inner card content (not the `<Link>`) preserves `card-glow-hover` border glow on the Link wrapper

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in `apps/web/e2e/user-journey/complete-flow.spec.ts` and `apps/web/lib/api.test.ts` were present before this plan and are unrelated to these changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FX-03 complete. Both project cards now have the Evervault noise decryption hover effect.
- Next: 25-03 (FX-04 dot grid + spotlight cursor effect)
- No blockers.

---
*Phase: 25-personality-effects*
*Completed: 2026-02-19*
