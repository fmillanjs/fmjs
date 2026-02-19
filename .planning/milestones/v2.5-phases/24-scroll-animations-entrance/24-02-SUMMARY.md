---
phase: 24-scroll-animations-entrance
plan: "02"
subsystem: ui
tags: [motion, animation, scroll-reveal, stagger, react, nextjs, server-components]

# Dependency graph
requires:
  - phase: 24-01
    provides: AnimateIn + StaggerContainer + StaggerItem primitives ready for consumption

provides:
  - Homepage with animated 'Featured Projects' heading (AnimateIn) and staggered project cards (StaggerContainer + StaggerItem)
  - Projects page with animated 'Projects' heading (AnimateIn) and staggered ProjectCard components
  - CaseStudySection shared component with animated h2 headings via AnimateIn
  - TeamFlow and DevCollab case study pages with animated header blocks
  - Contact page with animated 'Get in Touch' heading

affects:
  - 24-03 (next plan — applies stagger to tech-stack grids)
  - All five portfolio routes now have scroll-reveal entrance animations

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component pages import 'use client' components (AnimateIn/StaggerContainer) — valid Next.js pattern, no 'use client' needed in page files
    - Shared component modification pattern — animating in CaseStudySection once covers all instances on teamflow + devcollab routes
    - AnimateIn with className prop — passes className through to the motion.div wrapper for layout purposes

key-files:
  created: []
  modified:
    - apps/web/app/(portfolio)/page.tsx
    - apps/web/app/(portfolio)/projects/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/app/(portfolio)/contact/page.tsx
    - apps/web/components/portfolio/case-study-section.tsx

key-decisions:
  - "Modified CaseStudySection shared component to add AnimateIn on h2 — one change covers all case study h2s on both teamflow and devcollab routes"
  - "All page files remain Server Components — no 'use client' directive added, motion boundary handled by AnimateIn/StaggerContainer internals"

patterns-established:
  - "Shared component animation: modify once at the shared component level to propagate animation to all usage sites"
  - "StaggerItem wraps individual card components without changing their props or inner markup"

requirements-completed:
  - ANIM-01

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 24 Plan 02: Apply Animations to Portfolio Pages Summary

**AnimateIn and StaggerContainer wired into all five portfolio routes — headings fade+slide-up on scroll, project cards stagger in sequentially**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T07:22:13Z
- **Completed:** 2026-02-19T07:24:44Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Applied `AnimateIn` scroll-reveal to "Featured Projects" heading on homepage (`/`)
- Replaced homepage project cards `<div>` grid with `StaggerContainer` + two `StaggerItem` wrappers — TeamFlow and DevCollab cards stagger in at 150ms interval
- Applied `AnimateIn` to Stats section block on homepage
- Applied `AnimateIn` to "Projects" heading on `/projects` page
- Replaced `/projects` cards grid with `StaggerContainer` + two `StaggerItem` wrappers — both `ProjectCard` instances stagger in
- Modified `CaseStudySection` shared component: added `AnimateIn` wrapping the `h2` — all case study section headings on `/projects/teamflow` and `/projects/devcollab` auto-animate without touching each page file
- Applied `AnimateIn` to header blocks on both case study pages (back-link + h1 + action buttons block)
- Applied `AnimateIn` to "Get in Touch" heading block on `/contact`, replacing the bare `<div className="text-center">`
- Zero `'use client'` directives added to any page file — all remain Server Components
- Zero direct `motion.*` usage in Server Component files

## Task Commits

Each task was committed atomically:

1. **Task 1: Animate homepage heading and stagger project cards** - `2985952` (feat)
2. **Task 2: Animate projects page heading and stagger ProjectCard components** - `33f5a01` (feat)
3. **Task 3: Animate case study section headings and contact page heading** - `9468c46` (feat)

## Files Created/Modified

- `apps/web/app/(portfolio)/page.tsx` — Added AnimateIn + StaggerContainer + StaggerItem imports; Featured Projects heading wrapped in AnimateIn; card grid wrapped in StaggerContainer; Stats section wrapped in AnimateIn
- `apps/web/app/(portfolio)/projects/page.tsx` — Added AnimateIn + StaggerContainer + StaggerItem imports; Projects heading replaced div with AnimateIn; cards grid replaced with StaggerContainer + StaggerItem wrappers
- `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — Added AnimateIn import; header block `<div className="mb-12">` replaced with `<AnimateIn className="mb-12">`
- `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — Added AnimateIn import; header block `<div className="mb-12">` replaced with `<AnimateIn className="mb-12">`
- `apps/web/app/(portfolio)/contact/page.tsx` — Added AnimateIn import; heading `<div className="text-center">` replaced with `<AnimateIn className="text-center">`
- `apps/web/components/portfolio/case-study-section.tsx` — Added AnimateIn import; wrapped `<h2>` in `<AnimateIn>` — all CaseStudySection headings across both case study pages animate automatically

## Decisions Made

- **Modified `CaseStudySection` at the shared component level** — wrapping the `h2` once in the shared component means all case study section headings on both routes automatically get the animation, requiring zero changes to the individual page files beyond the top-level header block
- **All page files remain Server Components** — importing client components (AnimateIn/StaggerContainer/StaggerItem) from Server Components is valid Next.js 15 pattern; the 'use client' boundary lives inside those components

## Deviations from Plan

None — plan executed exactly as written. All three tasks implemented without deviation from the specified approach.

## Issues Encountered

- Pre-existing TypeScript errors in `apps/web/e2e/user-journey/complete-flow.spec.ts` and `apps/web/lib/api.test.ts` remain (string | undefined assignments) — same pre-existing issues noted in 24-01 SUMMARY, out of scope and untouched.

## User Setup Required

None.

## Next Phase Readiness

- Plan 03 can apply `StaggerContainer`/`StaggerItem` to tech-stack grids and any additional section-level stagger groups
- All five portfolio routes now have scroll-reveal entrance animations active
- `MotionProvider` gate from Plan 01 is already active — reduced-motion users see instant renders on all animated elements

---
*Phase: 24-scroll-animations-entrance*
*Completed: 2026-02-19*
