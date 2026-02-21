---
phase: 30-gsap-scrolltrigger-parallax
plan: 02
subsystem: ui
tags: [gsap, scrolltrigger, parallax, lighthouse, performance, animation, cls]

# Dependency graph
requires:
  - phase: 30-01-gsap-scrolltrigger-parallax
    provides: LenisGSAPBridge autoRaf:false ticker sync + hero yPercent:-15 scrub:1 parallax
  - phase: 29-lenis-foundation
    provides: LenisProvider scoped to portfolio layout, Lenis smooth scroll context
provides:
  - ParallaxDivider 'use client' component with useGSAP + ScrollTrigger scaleX 0.92→1.04 scrub animation
  - ParallaxDivider inserted between all major section boundaries on homepage and about page
  - Lighthouse CI gate: all 5 portfolio URLs score 1.00 (100%) performance with CLS = 0
  - Human visual verification: all 8 checks passed — depth effect, reduced-motion gate, nav re-fire, LHCI scores
affects: [31-magnetic-buttons, 32-matrix-color-harmony]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ParallaxDivider uses useGSAP { scope: containerRef } — auto-reverts GSAP context and kills ScrollTrigger on unmount (no stale instances)"
    - "scaleX only (no top/margin/height) — layout-safe transform ensures CLS = 0 even with parallax active"
    - "overflow-hidden on container div — scaleX > 1.0 expansion stays visually clipped, no horizontal scrollbar"
    - "prefers-reduced-motion guard via window.matchMedia inside useGSAP callback — static divider for reduced-motion users"
    - "invalidateOnRefresh: true on ScrollTrigger — recalculates trigger bounds after viewport resize"

key-files:
  created:
    - apps/web/components/portfolio/parallax-divider.tsx
  modified:
    - apps/web/app/(portfolio)/page.tsx
    - apps/web/app/(portfolio)/about/page.tsx

key-decisions:
  - "ParallaxDivider origin-center on line div — scaleX expands symmetrically left+right, zero horizontal drift, CLS = 0"
  - "bg-primary/30 for divider line — Matrix green at 30% opacity within .matrix-theme; consistent with existing portfolio color tokens"
  - "about/page.tsx received two ParallaxDividers (between bio+tech-stack and between tech-stack+values) — sufficient section count. projects/page.tsx and contact/page.tsx skipped — single-section layouts where a divider would look wrong"
  - "scrub: 1 on scaleX tween — defers to RAF, prevents TBT spike on main thread, blends with Lenis inertia timing"

patterns-established:
  - "Divider pattern: 'use client' component, useGSAP { scope }, gsap.fromTo scaleX, overflow-hidden container, origin-center line, prefers-reduced-motion guard"
  - "No pin: true anywhere in Phase 30 — architectural constraint enforced; CLS = 0 confirmed by Lighthouse CI"

requirements-completed: [PRLLX-02, PRLLX-03]

# Metrics
duration: ~8min
completed: 2026-02-21
---

# Phase 30 Plan 02: ParallaxDivider + Lighthouse CI Gate Summary

**ParallaxDivider component with useGSAP scaleX 0.92→1.04 depth effect inserted across homepage and about page, with Lighthouse CI confirming 1.00 (100%) performance and CLS = 0 on all 5 portfolio URLs**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-20T23:27:25Z
- **Completed:** 2026-02-21T05:37:41Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- Created `parallax-divider.tsx` — 'use client' component using useGSAP + ScrollTrigger scaleX 0.92→1.04 with scrub:1, prefers-reduced-motion guard, and auto-revert on unmount
- Inserted ParallaxDivider between all major section boundaries: homepage (hero→featured-projects, featured-projects→stats) and about page (bio→tech-stack, tech-stack→values)
- Lighthouse CI gate passed: all 5 portfolio URLs scored 1.00 (100%) performance with CLS = 0 — no layout shift from parallax transforms
- Human visual verification approved: all 8 checks passed — scroll depth effect visible, reduced-motion static, navigation re-fire correct, LHCI results confirmed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ParallaxDivider component and insert into portfolio pages** - `379779b` (feat)
2. **Task 2: Lighthouse CI gate — all 5 URLs >= 0.90 performance, CLS = 0** - `82fc5a2` (feat)
3. **Task 3: Human visual verification — parallax depth effects and Lighthouse CI gate** - human-verify checkpoint, approved by user (all 8 checks passed)

**Plan metadata:** (docs commit — this summary)

## Files Created/Modified

- `apps/web/components/portfolio/parallax-divider.tsx` — ParallaxDivider 'use client' component; useGSAP + ScrollTrigger scaleX 0.92→1.04, scrub:1, invalidateOnRefresh:true, overflow-hidden container, origin-center line, prefers-reduced-motion guard
- `apps/web/app/(portfolio)/page.tsx` — Added ParallaxDivider import; inserted two ParallaxDivider instances (between hero/featured-projects and between featured-projects/stats)
- `apps/web/app/(portfolio)/about/page.tsx` — Added ParallaxDivider import; inserted two ParallaxDivider instances (between bio/tech-stack and between tech-stack/values)

## Decisions Made

- `origin-center` on the line div ensures scaleX expands symmetrically from center — no horizontal drift artifact, guarantees CLS = 0
- `bg-primary/30` color token — Matrix green at 30% opacity within `.matrix-theme`; avoids blue Radix bleed, consistent with existing portfolio color system
- `about/page.tsx` received two dividers (multiple section boundaries); `projects/page.tsx` and `contact/page.tsx` were skipped — single-section layouts where forcing a divider would be visually incorrect
- `scrub: 1` defers animation entirely to RAF and blends with Lenis inertia timing; prevents main-thread TBT spike

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — ParallaxDivider component compiled clean on first pass, Lighthouse CI passed immediately (all URLs 1.00 performance, CLS = 0), human verification approved all 8 checks without any issues reported.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 30 complete — PRLLX-01, PRLLX-02, PRLLX-03 all verified by human + LHCI
- Phase 31 (Magnetic Buttons) can proceed — LenisGSAPBridge ticker sync and ScrollTrigger pattern established; no blocking dependencies
- No blockers

---
*Phase: 30-gsap-scrolltrigger-parallax*
*Completed: 2026-02-21*
