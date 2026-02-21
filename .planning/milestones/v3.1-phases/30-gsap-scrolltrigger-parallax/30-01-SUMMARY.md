---
phase: 30-gsap-scrolltrigger-parallax
plan: 01
subsystem: portfolio/scroll
tags: [gsap, scrolltrigger, lenis, parallax, useGSAP, reduced-motion]
requirements: [PRLLX-01]

dependency_graph:
  requires:
    - 29-01 (LenisProvider base — ReactLenis tree, LenisScrollReset, reduced-motion gate)
  provides:
    - GSAP ticker sync bridge (LenisGSAPBridge) inside ReactLenis tree
    - Hero text parallax via useGSAP + ScrollTrigger (yPercent: -15, scrub: 1)
  affects:
    - apps/web/components/portfolio/lenis-provider.tsx
    - apps/web/components/portfolio/hero-section.tsx

tech_stack:
  added:
    - gsap (ScrollTrigger plugin, registered at module level)
    - @gsap/react (useGSAP hook with scope cleanup)
  patterns:
    - LenisGSAPBridge inner component inside ReactLenis tree
    - Named tickerFn variable for safe cleanup (no inline arrow function)
    - gsap.ticker.lagSmoothing(0) to prevent focus-regain jump
    - prefers-reduced-motion guard inside useGSAP callback
    - overflow-hidden on section to prevent text floating above nav on fast scroll
    - pin: false (never use pin: true — CLS spacer fails Lighthouse >= 0.90)

key_files:
  modified:
    - apps/web/components/portfolio/lenis-provider.tsx
    - apps/web/components/portfolio/hero-section.tsx

decisions:
  - "LenisGSAPBridge uses named tickerFn variable (not inline arrow) — same reference required for gsap.ticker.remove()"
  - "gsap.ticker.lagSmoothing(0) — prevents GSAP jump-catch-up when tab regains focus after backgrounding"
  - "ScrollTrigger plugin re-registered in hero-section.tsx — idempotent, safe alongside lenis-provider registration"
  - "overflow-hidden on section (not textRef div) — MatrixRainCanvas uses absolute inset-0 so canvas stays clipped correctly"
  - "prefers-reduced-motion checked inside useGSAP callback (window.matchMedia) — not at provider level, allows hook to still clean up correctly"

metrics:
  duration: "~2 min"
  completed: "2026-02-20"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 30 Plan 01: LenisGSAPBridge + Hero Parallax Summary

**One-liner:** GSAP ticker drives Lenis via LenisGSAPBridge (autoRaf: false, no double-RAF) with hero text parallax at yPercent: -15, scrub: 1 via useGSAP + ScrollTrigger.

## What Was Built

### Task 1 — LenisGSAPBridge (commit: 0b96b38)

Updated `lenis-provider.tsx` to replace the Phase 29 `autoRaf: true` setup with a GSAP-driven ticker bridge:

- **`autoRaf: false`** on ReactLenis — Lenis no longer runs its own RAF loop
- **`LenisGSAPBridge`** inner function component (alongside `LenisScrollReset`) inside the ReactLenis tree:
  - `lenis.on('scroll', ScrollTrigger.update)` — informs ScrollTrigger of current scroll position on every Lenis tick
  - `gsap.ticker.add(tickerFn)` — GSAP drives Lenis via `lenis.raf(time * 1000)`
  - `gsap.ticker.lagSmoothing(0)` — prevents jump when tab is backgrounded and regains focus
  - Full cleanup in return: `lenis.off('scroll', ScrollTrigger.update)` + `gsap.ticker.remove(tickerFn)`
- **Named `tickerFn`** (not inline arrow) — critical so the same reference is passed to both `.add()` and `.remove()`
- Registered `ScrollTrigger` + `useGSAP` at module level (idempotent)

### Task 2 — Hero Text Parallax (commit: f26c13d)

Updated `hero-section.tsx` to add GSAP ScrollTrigger parallax on the hero text block:

- `sectionRef` on the outer `<section>` element (trigger)
- `textRef` on the `<div>` text wrapper (target)
- `useGSAP` hook with `{ scope: sectionRef }` for proper cleanup on navigation
- `gsap.to(textRef.current, { yPercent: -15, ease: 'none', scrollTrigger: { ... } })`
  - `start: 'top top'`, `end: 'bottom top'`, `scrub: 1`, `invalidateOnRefresh: true`
  - No `pin: true` (CLS spacer would fail Lighthouse CI >= 0.90 gate)
- `prefers-reduced-motion` guard inside the hook — returns early if user prefers no motion
- `overflow-hidden` added to the `<section>` — prevents text from floating above nav on fast scroll

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

1. `grep autoRaf: false lenis-provider.tsx` — present (line 82)
2. `grep LenisGSAPBridge lenis-provider.tsx` — function definition (line 32) + JSX (line 90)
3. `grep useGSAP|yPercent|scrub hero-section.tsx` — all five terms present
4. `grep pin: hero-section.tsx` — appears only in a comment, never as active config
5. TypeScript: zero errors in `lenis-provider.tsx` and `hero-section.tsx` (5 pre-existing errors in unrelated test files remain unchanged)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 0b96b38 | feat(30-01): add LenisGSAPBridge — autoRaf: false + gsap.ticker sync |
| Task 2 | f26c13d | feat(30-01): add hero text parallax via useGSAP + ScrollTrigger |

## Self-Check: PASSED

- FOUND: apps/web/components/portfolio/lenis-provider.tsx
- FOUND: apps/web/components/portfolio/hero-section.tsx
- FOUND: .planning/phases/30-gsap-scrolltrigger-parallax/30-01-SUMMARY.md
- FOUND commit: 0b96b38 (LenisGSAPBridge)
- FOUND commit: f26c13d (hero parallax)
