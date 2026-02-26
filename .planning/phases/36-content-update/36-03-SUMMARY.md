---
phase: 36-content-update
plan: "03"
subsystem: ui
tags: [next.js, images, screenshots, playwright, portfolio, project-card]

# Dependency graph
requires:
  - phase: 36-content-update plan 01
    provides: DevCollab case study with Tiptap removed and react-markdown accurate copy
  - phase: 36-content-update plan 02
    provides: TeamFlow case study with v1.1 framing removed, real-time presented as shipped

provides:
  - Corrected badge arrays on home page and projects listing (Socket.io, react-markdown, Prisma, CASL — no WebSocket, no Tiptap)
  - ProjectCard component extended with optional screenshot prop using Next.js Image
  - 4 live production screenshots captured from TeamFlow and DevCollab at 1280x800
  - Screenshots wired into both case study pages (Screenshots section before Results)
  - Screenshots wired into project cards on /projects listing
  - CONT-03 and CONT-04 requirements satisfied — Phase 36 complete

affects: [future-portfolio-updates, project-card-component, screenshot-management]

# Tech tracking
tech-stack:
  added: [playwright (screenshot capture, scripted), next/image (with explicit width/height)]
  patterns: [Next.js Image with explicit width+height to prevent CLS, optional prop extension pattern for backward-compatible component updates]

key-files:
  created:
    - apps/web/public/screenshots/teamflow-kanban.png
    - apps/web/public/screenshots/teamflow-presence.png
    - apps/web/public/screenshots/devcollab-workspace.png
    - apps/web/public/screenshots/devcollab-search.png
    - scripts/capture-screenshots.mjs
  modified:
    - apps/web/app/(portfolio)/page.tsx
    - apps/web/app/(portfolio)/projects/page.tsx
    - apps/web/components/portfolio/project-card.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx

key-decisions:
  - "Badge arrays must match deployed package.json exactly — WebSocket replaced with Socket.io, Tiptap replaced with react-markdown throughout home and projects pages"
  - "Screenshots use explicit width={1280} height={800} in Next.js Image to prevent CLS regression (verified by human checkpoint)"
  - "Screenshot prop on ProjectCard is optional (screenshot?) for backward compatibility — existing usages without screenshot prop continue to render normally"
  - "Playwright capture script placed in scripts/ directory as a maintenance tool; not part of CI pipeline"

patterns-established:
  - "Portfolio badge arrays: always cross-reference apps/web/app/(portfolio)/page.tsx, apps/web/app/(portfolio)/projects/page.tsx, and case study page together for consistency"
  - "Screenshots in case studies: use CaseStudySection titled 'Screenshots' placed before the Results section, 2-column grid with caption"
  - "ProjectCard screenshot: renders above featured badge in CardHeader using overflow-hidden rounded-md wrapper"

requirements-completed: [CONT-03, CONT-04]

# Metrics
duration: ~25min
completed: 2026-02-26
---

# Phase 36 Plan 03: Badge Array Corrections and Live Production Screenshots Summary

**Corrected inaccurate tech stack badges across home and projects pages (Socket.io, react-markdown) and added 4 live production screenshots to both case study pages and project cards via an extended ProjectCard screenshot prop**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-26T05:55:00Z (estimated)
- **Completed:** 2026-02-26T06:24:07Z
- **Tasks:** 4 (3 auto + 1 human checkpoint)
- **Files modified:** 9

## Accomplishments

- Badge arrays corrected in 4 locations: home page TeamFlow card, home page DevCollab card, projects page TeamFlow card, projects page DevCollab card — "WebSocket" replaced with "Socket.io", "Tiptap" replaced with "react-markdown", "Next.js" updated to "Next.js 15", CASL and Prisma added where missing
- ProjectCard component extended with optional `screenshot?: { src: string; alt: string }` prop — renders a Next.js Image above the featured badge in CardHeader; fully backward-compatible
- 4 live production screenshots captured via Playwright at 1280x800 (teamflow-kanban.png, teamflow-presence.png, devcollab-workspace.png, devcollab-search.png) from authenticated sessions on real production URLs
- Screenshots wired into TeamFlow and DevCollab case study pages in a 2-column Screenshots section placed before Results; screenshots also passed as props to ProjectCard on /projects listing

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix badge arrays on home page and projects listing** - `0c784d4` (fix)
2. **Task 2: Add screenshot prop to ProjectCard and capture live screenshots** - `5bd79ed` (feat)
3. **Task 3: Wire screenshots into case study pages and project cards** - `014a48d` (feat)
4. **Task 4: Human visual verification** - checkpoint approved by user, no separate commit

**Plan metadata:** (to be committed with this summary)

## Files Created/Modified

- `apps/web/app/(portfolio)/page.tsx` - TeamFlow badges updated to Socket.io/CASL; DevCollab badges updated to react-markdown/Prisma; "Next.js" -> "Next.js 15" throughout
- `apps/web/app/(portfolio)/projects/page.tsx` - Same badge corrections + screenshot props added to both ProjectCard usages
- `apps/web/components/portfolio/project-card.tsx` - Added optional screenshot prop and Next.js Image rendering in CardHeader
- `apps/web/app/(portfolio)/projects/teamflow/page.tsx` - Added Screenshots section (CaseStudySection) with 2 images before Results
- `apps/web/app/(portfolio)/projects/devcollab/page.tsx` - Added Screenshots section (CaseStudySection) with 2 images before Results
- `apps/web/public/screenshots/teamflow-kanban.png` - Kanban board screenshot from live production (1280x800)
- `apps/web/public/screenshots/teamflow-presence.png` - Presence indicator screenshot from live production (1280x800)
- `apps/web/public/screenshots/devcollab-workspace.png` - Workspace snippet list screenshot from live production (1280x800)
- `apps/web/public/screenshots/devcollab-search.png` - Cmd+K search modal screenshot from live production (1280x800)
- `scripts/capture-screenshots.mjs` - Playwright script for re-capturing screenshots in future

## Decisions Made

- Badge arrays corrected to match actual deployed stack: Socket.io (not WebSocket — confirmed in teamflow-api package.json), react-markdown (not Tiptap — confirmed in devcollab-web package.json), Prisma added to DevCollab, CASL added to TeamFlow
- Next.js Image with explicit `width={1280}` and `height={800}` used throughout to prevent Cumulative Layout Shift — human verification confirmed no CLS regression
- ProjectCard screenshot prop made optional to preserve backward compatibility — existing usages outside /projects page not affected

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 36 is complete. All four content update requirements (CONT-01 through CONT-04) are satisfied:
- CONT-01: DevCollab case study Tiptap references removed (Plan 01)
- CONT-02: TeamFlow case study v1.1 framing removed, real-time presented as shipped (Plan 02)
- CONT-03: Badge arrays accurate across home and projects pages (this plan)
- CONT-04: Live production screenshots in case studies and project cards (this plan)

The portfolio site is production-ready with accurate content, live screenshots, and no stale copy.

---
*Phase: 36-content-update*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: 0c784d4 (fix badge arrays commit)
- FOUND: 5bd79ed (add screenshot prop commit)
- FOUND: 014a48d (wire screenshots commit)
- FOUND: apps/web/public/screenshots/teamflow-kanban.png (80955 bytes)
- FOUND: apps/web/public/screenshots/teamflow-presence.png (65171 bytes)
- FOUND: apps/web/public/screenshots/devcollab-workspace.png (54969 bytes)
- FOUND: apps/web/public/screenshots/devcollab-search.png (60790 bytes)
- FOUND: .planning/phases/36-content-update/36-03-SUMMARY.md
