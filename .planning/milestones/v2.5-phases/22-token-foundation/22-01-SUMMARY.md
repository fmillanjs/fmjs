---
phase: 22-token-foundation
plan: "01"
subsystem: ui

tags: [css-custom-properties, tailwind-v4, matrix-theme, reduced-motion, accessibility]

# Dependency graph
requires: []

provides:
  - "CSS custom properties --matrix-green: #00FF41, --matrix-green-dim: #00CC33, --matrix-green-ghost: #00FF4120 in :root of globals.css"
  - "Global @media (prefers-reduced-motion: reduce) rule killing all CSS animations/transitions (THEME-04 Phase 22 portion)"
  - "matrix-theme class as first class on portfolio layout wrapper div — dormant selector hook for future phases"

affects: [23-canvas-matrix, 24-motion-layer, 25-portfolio-fx, phase-23, phase-24, phase-25]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom properties in :root (not @theme) for tokens that do not map to Tailwind utility classes"
    - "Dormant CSS class on layout wrapper div as selector hook for future styling phases"
    - "Global prefers-reduced-motion media query at end of globals.css as accessibility gate"

key-files:
  created: []
  modified:
    - "apps/web/app/globals.css"
    - "apps/web/app/(portfolio)/layout.tsx"

key-decisions:
  - "Matrix tokens added to :root (not @theme) — they are raw CSS vars consumed directly as var(--matrix-green), not Tailwind utility tokens"
  - "matrix-theme class is first class on the div for easy specificity reasoning in future phases"
  - "No CSS rules attached to .matrix-theme in Phase 22 — purely a dormant selector hook, zero visual change"
  - "Reduced-motion rule placed at end of globals.css after all @keyframes declarations to ensure override coverage"

patterns-established:
  - "Additive :root token extension: new CSS vars added inside existing :root block, after --ring line, before closing brace"
  - "Scoped theme class: .matrix-theme on (portfolio)/layout.tsx wrapper div only — never root or dashboard layouts"
  - "THEME-04 is implemented in three layers across phases: CSS global rule (Phase 22), RAF check (Phase 23), MotionConfig (Phase 24)"

requirements-completed: [THEME-01, THEME-02, THEME-04]

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 22 Plan 01: Token Foundation Summary

**Three Matrix green CSS custom properties in :root and a dormant matrix-theme layout class — zero visual change, full selector infrastructure for Phase 23+**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-19T03:34:33Z
- **Completed:** 2026-02-19T03:42:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `--matrix-green: #00FF41`, `--matrix-green-dim: #00CC33`, `--matrix-green-ghost: #00FF4120` now available on `:root` across every portfolio route
- Global `@media (prefers-reduced-motion: reduce)` rule halts all CSS animations and transitions when OS Reduce Motion is active (THEME-04 Phase 22 portion)
- `matrix-theme` class planted as first class on the portfolio layout wrapper div — scoped to `(portfolio)` route group, zero CSS rules attached, no visual diff

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Matrix green tokens and reduced-motion rule to globals.css** - `9a2a01b` (feat)
2. **Task 2: Add matrix-theme class to portfolio layout wrapper div** - `48b33a0` (feat)

## Files Created/Modified
- `apps/web/app/globals.css` - Added three Matrix green custom properties inside existing :root block and appended global @media (prefers-reduced-motion: reduce) rule at end of file
- `apps/web/app/(portfolio)/layout.tsx` - Changed outer div className from "min-h-screen flex flex-col" to "matrix-theme min-h-screen flex flex-col"

## Decisions Made
- Tokens placed in `:root {}` not in `@theme inline {}`: these are raw CSS variables consumed directly as `var(--matrix-green)` — they must not generate Tailwind utility classes like `bg-matrix-green`
- `matrix-theme` is the first class on the div so selector specificity is simple to reason about when future phases add `.matrix-theme` CSS rules
- No CSS rules attached to `.matrix-theme` in Phase 22 — the class is a selector hook only; this preserves the Playwright visual regression snapshots (no visual diff)
- Reduced-motion rule appended after all `@keyframes` and utility class definitions to guarantee it overrides them with `!important`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 22 Plan 02 (package installs: motion, gsap, @gsap/react, lenis) can proceed immediately — it is independent of this plan
- Phase 22 Plan 03 (pure CSS effects: cursor-blink, card-glow-hover) can proceed immediately — it depends on these tokens being present, which they now are
- Phase 23 (canvas matrix rain) can reference `--matrix-green` from `:root` and scope styles under `.matrix-theme`
- Phase 24 (motion layer) should add `MotionConfig reducedMotion="user"` to complete THEME-04 (Phase 22 covers CSS layer, Phase 23 covers RAF layer, Phase 24 covers JS animation layer)

## Self-Check: PASSED

- FOUND: apps/web/app/globals.css
- FOUND: apps/web/app/(portfolio)/layout.tsx
- FOUND: .planning/phases/22-token-foundation/22-01-SUMMARY.md
- FOUND: commit 9a2a01b (Task 1 — Matrix green tokens + reduced-motion)
- FOUND: commit 48b33a0 (Task 2 — matrix-theme class)
- FOUND: --matrix-green token in globals.css
- FOUND: prefers-reduced-motion rule in globals.css
- FOUND: matrix-theme class in (portfolio)/layout.tsx

---
*Phase: 22-token-foundation*
*Completed: 2026-02-19*
