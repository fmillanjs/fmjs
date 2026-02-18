---
phase: 21-seed-data-portfolio-integration
plan: 02
subsystem: ui
tags: [nextjs, portfolio, case-study, devcollab, recruiter-ux]

# Dependency graph
requires:
  - phase: 20-full-text-search
    provides: Cmd+K search modal, tsvector FTS, all DevCollab features documented in case study
  - phase: 21-01
    provides: seed data script — demo workspace with realistic content for recruiter visit
provides:
  - DevCollab case study page at /projects/devcollab
  - Portfolio homepage with two featured project cards (TeamFlow + DevCollab)
  - Projects listing with both ProjectCards
  - DevCollab login page with demo credentials hint and /w/devcollab-demo redirect
affects:
  - recruiter-demo — PORT-01 PORT-02 PORT-03 all satisfied

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NEXT_PUBLIC_DEVCOLLAB_URL env var with localhost:3002 fallback for environment-agnostic deep-links
    - Case study pages follow TeamFlow template: CaseStudySection + Button + ExternalLink + Github imports

key-files:
  created:
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
  modified:
    - apps/web/app/(portfolio)/projects/page.tsx
    - apps/web/app/(portfolio)/page.tsx
    - apps/devcollab-web/app/(auth)/login/page.tsx

key-decisions:
  - "NEXT_PUBLIC_DEVCOLLAB_URL env var with localhost:3002 fallback — environment-agnostic deep-link to /w/devcollab-demo"
  - "Login page post-auth redirect changed from /dashboard to /w/devcollab-demo — recruiter lands directly in seeded workspace"
  - "Homepage changed from single Featured Project to Featured Projects two-column grid — both apps equally prominent"
  - "Demo credentials panel uses inline styles matching existing plain login page style — no Tailwind, no purple"

patterns-established:
  - "Case study pages: model on teamflow/page.tsx with CaseStudySection, Button, ExternalLink, Github"
  - "Demo workspace deep-link pattern: NEXT_PUBLIC_APP_URL env var || localhost fallback + /w/slug"

requirements-completed: [PORT-01, PORT-02, PORT-03]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 21 Plan 02: Portfolio Integration Summary

**DevCollab added to portfolio: full case study at /projects/devcollab, two-card homepage grid, updated projects listing, and login page with demo credentials + /w/devcollab-demo redirect**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T19:01:38Z
- **Completed:** 2026-02-18T19:05:03Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created full DevCollab case study page with overview stats, problem statement, architecture diagram, five technical decisions table, three challenges/solutions, results grid, and demo credentials panel
- Updated homepage Featured Project section to Featured Projects two-column grid showing both TeamFlow and DevCollab equally
- Added DevCollab ProjectCard to projects listing page alongside TeamFlow
- Added Demo Credentials panel to DevCollab login page; post-login redirect now goes to /w/devcollab-demo

## Task Commits

1. **Task 1: Create DevCollab case study page and update portfolio listings** - `f889058` (feat)
2. **Task 2: Add demo credential hint to DevCollab login page** - `2dc107a` (feat)

## Files Created/Modified

- `apps/web/app/(portfolio)/projects/devcollab/page.tsx` - Full case study page with NEXT_PUBLIC_DEVCOLLAB_URL, /w/devcollab-demo deep-links, technical decisions table, and demo credentials panel
- `apps/web/app/(portfolio)/projects/page.tsx` - Added DevCollab ProjectCard to the md:grid-cols-2 grid
- `apps/web/app/(portfolio)/page.tsx` - Changed heading to "Featured Projects", converted single-card block to two-column grid with TeamFlow and DevCollab cards
- `apps/devcollab-web/app/(auth)/login/page.tsx` - Added Demo Credentials panel (gray-50 bordered box, monospace), changed router.push to /w/devcollab-demo

## Decisions Made

- NEXT_PUBLIC_DEVCOLLAB_URL env var with localhost:3002 fallback used for deep-links — same pattern as NEXT_PUBLIC_API_URL established in Phase 15
- Login redirect changed from /dashboard to /w/devcollab-demo — recruiter immediately lands in pre-seeded workspace instead of an empty dashboard
- Badge "Featured" removed from both homepage cards (neither uses Badge) — both equally prominent in grid, no visual ranking
- Demo credentials panel uses inline style matching existing plain login page (no Tailwind) to maintain visual consistency

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for these UI changes. NEXT_PUBLIC_DEVCOLLAB_URL will be set in Coolify environment variables during Phase 21 deployment.

## Next Phase Readiness

- PORT-01, PORT-02, PORT-03 all satisfied
- Portfolio shows two featured project cards — recruiters can navigate to either case study
- DevCollab login guides recruiters with demo credentials and drops them into the pre-seeded workspace
- Phase 21 Plan 01 (seed data) + Plan 02 (portfolio integration) together complete the full recruiter journey
- npx turbo build --filter=web succeeds — /projects/devcollab builds as static page (187 B, 106 kB First Load JS)

## Self-Check

Files exist:
- `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — FOUND
- `apps/web/app/(portfolio)/projects/page.tsx` — FOUND (DevCollab card added)
- `apps/web/app/(portfolio)/page.tsx` — FOUND (two-card grid)
- `apps/devcollab-web/app/(auth)/login/page.tsx` — FOUND (Demo1234! credentials panel)

Commits exist:
- f889058 — FOUND
- 2dc107a — FOUND

Build: npx turbo build --filter=web — PASSED (1 successful, /projects/devcollab in output)

## Self-Check: PASSED

---
*Phase: 21-seed-data-portfolio-integration*
*Completed: 2026-02-18*
