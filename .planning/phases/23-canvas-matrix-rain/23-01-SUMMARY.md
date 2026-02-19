---
phase: 23-canvas-matrix-rain
plan: 01
subsystem: ui
tags: [canvas, animation, matrix-rain, react, nextjs, raf, reduced-motion]

requires:
  - phase: 22-token-foundation
    provides: .matrix-theme CSS class on portfolio layout, THEME-04 reduced-motion CSS rule

provides:
  - MatrixRainCanvas client component with RAF loop, 30fps cap, reduce-motion gate, and cancelAnimationFrame cleanup
  - HeroSection updated to load MatrixRainCanvas via next/dynamic ssr:false
  - ANIM-02 falling matrix digital rain behind hero content

affects:
  - 23-02-canvas-dot-grid
  - 23-03-lighthouse-audit
  - 24-motion-config

tech-stack:
  added: []
  patterns:
    - "Canvas animation via RAF in useEffect — size from offsetWidth/offsetHeight, throttled to 30fps via FRAME_INTERVAL"
    - "next/dynamic with ssr:false at module top level in a 'use client' component — required by Next.js 15 (#72236)"
    - "CSS opacity on canvas element for compositing (not ctx.globalAlpha) — composites fully-drawn frame at 5% against page"
    - "Reduce-motion gate: window.matchMedia('(prefers-reduced-motion: reduce)').matches check before starting RAF loop"

key-files:
  created:
    - apps/web/components/portfolio/matrix-rain-canvas.tsx
  modified:
    - apps/web/components/portfolio/hero-section.tsx

key-decisions:
  - "CSS opacity 0.05 on canvas element (not ctx.globalAlpha) — composites entire frame at 5% so trail effect works correctly"
  - "Capture canvas dimensions (w, h) before draw closure — avoids repeated canvas property access and satisfies TypeScript narrowing"
  - "Use canvas.charAt() instead of CHARS[index] — avoids TypeScript 'possibly undefined' for array element access under strict mode"
  - "hero-section.tsx converted from Server Component to 'use client' — safe since no async data fetching, required for next/dynamic ssr:false"

requirements-completed: [ANIM-02]

duration: 2min
completed: 2026-02-19
---

# Phase 23 Plan 01: MatrixRainCanvas Component Summary

**Canvas-based falling Matrix digital rain with 30fps RAF loop, reduce-motion gate, and cancelAnimationFrame cleanup loaded SSR-safely into the hero section via next/dynamic**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T05:12:57Z
- **Completed:** 2026-02-19T05:15:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created MatrixRainCanvas client component with half-width katakana + digit character set, 30fps-capped RAF loop, and automatic cleanup
- Integrated canvas into HeroSection via next/dynamic with ssr:false (required by Next.js 15 regression #72236)
- Canvas renders aria-hidden at CSS opacity 0.05 behind hero content — content remains fully readable
- Reduce-motion gate stops RAF loop before it starts when OS preference is active
- Production build succeeds with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MatrixRainCanvas client component** - `76fff4d` (feat)
2. **Task 2: Integrate MatrixRainCanvas into HeroSection via next/dynamic** - `b4ce9c3` (feat)

## Files Created/Modified
- `apps/web/components/portfolio/matrix-rain-canvas.tsx` - New client component: canvas + RAF loop + 30fps cap + reduce-motion gate + cleanup
- `apps/web/components/portfolio/hero-section.tsx` - Added 'use client', dynamic import, MatrixRainCanvas render, z-10 on content div

## Decisions Made
- CSS opacity 0.05 on canvas element rather than ctx.globalAlpha — CSS compositing applies the 5% at the DOM level so the fade trail draw (rgba(10,10,10,0.05) fillRect) works correctly for the rain effect
- Canvas dimensions (w, h) captured before draw closure — avoids TypeScript strict-mode narrowing issues with canvas ref inside nested function
- hero-section.tsx converted to 'use client' — Next.js 15 blocks calling dynamic(..., { ssr: false }) from a Server Component

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict-mode errors in canvas draw closure**
- **Found during:** Task 1 (MatrixRainCanvas component creation)
- **Issue:** TypeScript strict mode does not carry type narrowing for `canvas` and `ctx` into nested `draw` function closure; array index access typed as `string | undefined`
- **Fix:** Captured `ctx` as `CanvasRenderingContext2D` typed variable, captured `w` and `h` from canvas before closure, used `CHARS.charAt(index)` instead of `CHARS[index]`, added `!` non-null assertions for `drops[i]`
- **Files modified:** apps/web/components/portfolio/matrix-rain-canvas.tsx
- **Verification:** `npx tsc --noEmit` reports zero errors for the component file
- **Committed in:** `76fff4d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — TypeScript strict-mode narrowing in closure)
**Impact on plan:** Required fix for TypeScript compilation. No scope creep. Component behavior unchanged from plan spec.

## Issues Encountered
Pre-existing TypeScript errors in `e2e/user-journey/complete-flow.spec.ts` and `lib/api.test.ts` (unrelated to this plan's scope) — logged, not fixed. Component-specific errors fully resolved.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MatrixRainCanvas ready — hero section displays falling matrix rain behind content
- ANIM-02 requirement complete
- Next: Phase 23 Plan 02 — canvas dot-grid background component
- ANIM-03 Lighthouse gate must pass before Phase 24 can begin

---
*Phase: 23-canvas-matrix-rain*
*Completed: 2026-02-19*
