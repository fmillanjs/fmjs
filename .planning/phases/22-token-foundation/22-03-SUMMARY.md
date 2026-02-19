---
phase: 22-token-foundation
plan: "03"
subsystem: ui
tags: [css, animations, playwright, visual-regression, portfolio, matrix-green]

# Dependency graph
requires:
  - phase: 22-01
    provides: CSS custom properties --matrix-green and --matrix-green-ghost in :root, reduced-motion media query block
provides:
  - Pure-CSS blinking terminal cursor after hero tagline (FX-02) via cursor-blink keyframe + ::after pseudo-element
  - Matrix green border glow on project card hover (UX-01) via card-glow-hover utility class
  - Updated Playwright visual regression snapshots accepting the new visuals
affects:
  - Phase 25 (FX-01 text scramble, FX-04 dot grid) — hero tagline element already has cursor-blink class
  - Any future Playwright snapshot updates must use --update-snapshots
  - CI pipeline — snapshots now reflect FX-02 + UX-01 state

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS ::after pseudo-element for decorative cursor — no JavaScript"
    - "box-shadow multi-layer for border glow effect (outline + ambient + depth)"
    - "Utility class on Link wrapper (not Card) for hover effect — avoids Card component coupling"

key-files:
  created: []
  modified:
    - apps/web/app/globals.css
    - apps/web/components/portfolio/hero-section.tsx
    - apps/web/app/(portfolio)/page.tsx
    - apps/web/components/portfolio/project-card.tsx
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/homepage-light-chromium-linux.png
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/homepage-dark-chromium-linux.png
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/projects-light-chromium-linux.png
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/projects-dark-chromium-linux.png
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/contact-light-chromium-linux.png
    - apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/contact-dark-chromium-linux.png

key-decisions:
  - "card-glow-hover class placed on Link wrapper, not Card — keeps hover area consistent with clickable region"
  - "Removed hover:shadow-xl transition-shadow from homepage inline cards — card-glow-hover replaces them entirely"
  - "Removed transition-shadow hover:shadow-lg from ProjectCard Card element — glow is now on the Link wrapper"
  - "No additional reduced-motion CSS needed — Plan 01 block covers cursor-blink::after via animation-duration: 0.01ms"

patterns-established:
  - "Decorative ::after effects on paragraph elements for terminal-style UI"
  - "Multi-layer box-shadow pattern: 0 0 0 1px (sharp border) + 0 0 20px (ambient) + 0 4px 24px (depth)"

requirements-completed:
  - FX-02
  - UX-01

# Metrics
duration: 25min
completed: 2026-02-18
---

# Phase 22 Plan 03: CSS Visual Effects Summary

**Pure-CSS blinking terminal cursor (FX-02) and Matrix green card border glow (UX-01) shipped with updated Playwright snapshots — zero JavaScript**

## Performance

- **Duration:** ~25 min (split across two sessions: Task 1 + checkpoint verification + Task 2)
- **Started:** 2026-02-18T21:58:00Z
- **Completed:** 2026-02-18T22:12:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 10 (4 source + 6 snapshot PNG files)

## Accomplishments

- FX-02: CSS `@keyframes cursor-blink` with `::after` pseudo-element appends a blinking `_` after the hero tagline — no JavaScript, uses `--matrix-green` token from Plan 01
- UX-01: `.card-glow-hover` utility class applies a multi-layer `box-shadow` on hover to all project card Link wrappers, using `--matrix-green` and `--matrix-green-ghost` tokens
- Both effects stop completely when OS Reduce Motion is active (covered by the `animation-duration: 0.01ms !important` block established in Plan 01)
- Playwright visual regression suite: 13/13 tests pass after snapshot update (12 page snapshots + 1 auth setup)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cursor-blink and card-glow-hover CSS classes, apply to components** - `85e0907` (feat)
2. **Task 2: Update Playwright visual regression snapshots** - `5b8d1b4` (chore)

**Plan metadata:** (created in this step — docs commit follows)

## Files Created/Modified

- `apps/web/app/globals.css` - Added `@keyframes cursor-blink`, `.cursor-blink::after`, and `.card-glow-hover` / `.card-glow-hover:hover` classes
- `apps/web/components/portfolio/hero-section.tsx` - Added `cursor-blink` class to hero tagline `<p>` element
- `apps/web/app/(portfolio)/page.tsx` - Added `card-glow-hover` to both inline project card Link elements; removed `hover:shadow-xl transition-shadow`
- `apps/web/components/portfolio/project-card.tsx` - Added `card-glow-hover` to Link wrapper; removed `transition-shadow hover:shadow-lg` from Card
- `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/homepage-{light,dark}-chromium-linux.png` - Recaptured: cursor-blink visible after hero tagline
- `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/projects-{light,dark}-chromium-linux.png` - Recaptured: card-glow-hover visible on ProjectCard components
- `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/contact-{light,dark}-chromium-linux.png` - Recaptured (minor render artefact, no visible change)

## Decisions Made

- Placed `card-glow-hover` on the `<Link>` wrapper rather than the `<Card>` component — hover area matches the clickable region, avoids coupling to Card internals
- Removed legacy `hover:shadow-xl transition-shadow` from homepage inline cards and `transition-shadow hover:shadow-lg` from ProjectCard's Card element — the glow utility replaces both entirely
- No new reduced-motion CSS required — Plan 01's existing `@media (prefers-reduced-motion: reduce)` block with `animation-duration: 0.01ms !important` covers `.cursor-blink::after`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Dev server was already running on port 3000 (`reuseExistingServer: true`). Snapshot update and verification ran cleanly in a single pass.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 22 is now complete (all 3 plans done: CSS tokens, animation libraries, CSS effects)
- FX-02 and UX-01 requirements are fulfilled
- Playwright snapshot baseline is current — CI will pass on next run
- Phase 23 (canvas + RAF) can begin — the `.matrix-theme` hook is in place on the portfolio layout div

---
*Phase: 22-token-foundation*
*Completed: 2026-02-18*
