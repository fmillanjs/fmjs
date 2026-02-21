---
phase: 29-lenis-foundation
plan: 01
subsystem: ui
tags: [lenis, smooth-scroll, react, next-js, reduced-motion, portfolio]

# Dependency graph
requires:
  - phase: 22-matrix-cohesion
    provides: .matrix-theme CSS class on portfolio layout div — scoped theming
  - phase: 24-motion-provider
    provides: MotionProvider with MotionConfig reducedMotion="user" pattern

provides:
  - LenisProvider 'use client' component with ReactLenis root, lerp: 0.1, autoRaf: true, smoothWheel: true
  - LenisScrollReset inner component — route-change scroll reset via usePathname + useLenis
  - lenis/dist/lenis.css imported once globally in globals.css
  - Portfolio layout wired with LenisProvider as outermost wrapper
  - useLenis() context available to all portfolio layout children (CommandPalette, PortfolioNav)

affects:
  - 29-02 (CommandPalette scroll lock uses useLenis() from this provider)
  - 30-gsap-scrolltrigger (must switch autoRaf: false + gsap.ticker.add when GSAP added)

# Tech tracking
tech-stack:
  added: []  # lenis@1.3.17 was already installed; no new dependencies
  patterns:
    - "useState(false) + useEffect for SSR-safe prefers-reduced-motion detection — avoids hydration mismatch"
    - "Inner component pattern: LenisScrollReset inside ReactLenis tree to access useLenis() context"
    - "CSS import in globals.css not in component — single import prevents duplicates"

key-files:
  created:
    - apps/web/components/portfolio/lenis-provider.tsx
  modified:
    - apps/web/app/(portfolio)/layout.tsx
    - apps/web/app/globals.css

key-decisions:
  - "useState(false)+useEffect for reduced-motion detection — NOT typeof window inline check — prevents hydration mismatch (SCROLL-03)"
  - "LenisScrollReset as inner function (not exported) inside ReactLenis tree — required for useLenis() context access (SCROLL-02)"
  - "LenisProvider wraps outer div in portfolio layout — CommandPalette and PortfolioNav both inside provider scope"
  - "autoRaf: true for Phase 29 — Phase 30 will switch to false + gsap.ticker when GSAP ScrollTrigger added"
  - "lenis/dist/lenis.css imported in globals.css only — not in component — avoids duplicate CSS"

patterns-established:
  - "Pattern: SSR-safe client feature gate — useState(false) + useEffect — for window.matchMedia features in 'use client' components"
  - "Pattern: Inner component for hook context access — when hook requires ancestor provider, put inner component inside that provider"

requirements-completed: [SCROLL-01, SCROLL-03]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 29 Plan 01: Lenis Foundation Summary

**ReactLenis smooth scroll provider with SSR-safe reduced-motion gate and route-change reset wired into portfolio layout only**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-21T03:46:45Z
- **Completed:** 2026-02-21T03:49:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created LenisProvider 'use client' component with ReactLenis root (lerp: 0.1, autoRaf: true, smoothWheel: true) and SSR-safe prefers-reduced-motion gate
- Implemented LenisScrollReset inner component inside the ReactLenis tree for route-change scroll-to-top behavior (SCROLL-02)
- Wired LenisProvider as outermost wrapper in portfolio layout — CommandPalette and PortfolioNav now have useLenis() context access
- Added lenis/dist/lenis.css import to globals.css (exactly once, after tailwindcss + tw-animate-css)
- Build passes with no SSR errors; dashboard layout untouched (TeamFlow/DevCollab unaffected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LenisProvider component** - `3d0131e` (feat)
2. **Task 2: Add lenis CSS to globals.css and wire portfolio layout** - `502e1dc` (feat)

## Files Created/Modified

- `apps/web/components/portfolio/lenis-provider.tsx` - LenisProvider 'use client' component: ReactLenis root with reduced-motion gate, LenisScrollReset inner component for route-change reset
- `apps/web/app/(portfolio)/layout.tsx` - Added LenisProvider import and outermost JSX wrap around the .matrix-theme div
- `apps/web/app/globals.css` - Added @import "lenis/dist/lenis.css" after tailwindcss and tw-animate-css

## Decisions Made

- Used `useState(false) + useEffect` for reduced-motion detection instead of `typeof window !== 'undefined'` inline check — prevents hydration mismatch where server/client render different component trees
- `LenisScrollReset` is an inner non-exported function inside the file, placed inside the `<ReactLenis>` tree — necessary because `useLenis()` requires a ReactLenis ancestor in the component tree
- `LenisProvider` wraps the outermost div in portfolio layout (not just `<main>`) — ensures CommandPalette and PortfolioNav both have useLenis() context for the upcoming 29-02 scroll lock task
- `autoRaf: true` for Phase 29 — no GSAP ticker conflict yet; Phase 30 will switch to `autoRaf: false + gsap.ticker.add((time) => lenis.raf(time * 1000))`
- CSS imported in `globals.css` not in the component — single import location, no risk of duplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in `e2e/` and `lib/api.test.ts` are unrelated to this plan's changes (test files only). Build (`npx tsc --noEmit`) was clean for all application files including the new lenis-provider.tsx.

## User Setup Required

None - no external service configuration required. lenis@1.3.17 was already installed.

## Next Phase Readiness

- SCROLL-01 (portfolio smooth scroll) and SCROLL-03 (reduced-motion bypass) are complete
- useLenis() context is available throughout portfolio layout — ready for 29-02 CommandPalette scroll lock (SCROLL-04)
- SCROLL-02 (route-change scroll reset) is handled by LenisScrollReset inside this provider — no additional plan needed for that requirement
- Phase 30 note: when GSAP ScrollTrigger is added, update LenisProvider options from `autoRaf: true` to `autoRaf: false` and add `gsap.ticker.add((time) => lenis.raf(time * 1000))`

## Self-Check: PASSED

- FOUND: apps/web/components/portfolio/lenis-provider.tsx
- FOUND: apps/web/app/(portfolio)/layout.tsx (modified)
- FOUND: apps/web/app/globals.css (modified)
- FOUND: .planning/phases/29-lenis-foundation/29-01-SUMMARY.md
- FOUND: commit 3d0131e (Task 1 — LenisProvider component)
- FOUND: commit 502e1dc (Task 2 — globals.css + portfolio layout)

---
*Phase: 29-lenis-foundation*
*Completed: 2026-02-21*
