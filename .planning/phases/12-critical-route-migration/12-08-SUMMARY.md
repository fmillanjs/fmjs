---
phase: 12-critical-route-migration
plan: 08
subsystem: ui
tags: [shadcn, react, nextjs, lucide-react, card, button]

# Dependency graph
requires:
  - phase: 12-01
    provides: Shadcn alert-dialog, tabs, popover components installed

provides:
  - Team page with Card stat boxes and Button asChild navigation links
  - Team settings page with Card containers and Button asChild error state
  - Project client-page with Card project header and Button asChild action buttons
  - All inline SVG icon blocks replaced with lucide-react throughout three route pages

affects:
  - 12-09
  - phase-13

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Button variant=outline size=sm asChild wrapping Link for navigation links in dashboard headers"
    - "Card + CardContent p-5 pattern for stat boxes with lucide icon + dl label/value"
    - "Link className=block group > Card hover:shadow-md transition-shadow for clickable card grids"
    - "AlertTriangle lucide icon replacing inline SVG in error state Cards"
    - "ChevronRight lucide icon replacing inline SVG in breadcrumb separators"

key-files:
  created: []
  modified:
    - apps/web/app/(dashboard)/teams/[teamId]/page.tsx
    - apps/web/app/(dashboard)/teams/[teamId]/settings/page.tsx
    - apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/client-page.tsx

key-decisions:
  - "[Phase 12-08]: Button size=sm asChild for compact header navigation links — matches plan spec for outline variant nav buttons"
  - "[Phase 12-08]: projects.length used for Projects stat instead of hardcoded 0 — bug fix discovered during migration"
  - "[Phase 12-08]: projects.reduce for Tasks stat instead of hardcoded 0 — bug fix discovered during migration"

patterns-established:
  - "Stat box: Card > CardContent p-5 > flex items-center > flex-shrink-0 icon + ml-5 dl label/value"
  - "Project grid card: Link block group > Card hover:shadow-md > CardContent p-5 with name/description/count/status"
  - "Error state: Card p-8 text-center > CardContent > AlertTriangle icon + heading + text + Button asChild"

requirements-completed:
  - MIG-02
  - MIG-03

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 12 Plan 08: Team Route Pages Shadcn Migration Summary

**Three dashboard route pages migrated: inline SVG icon buttons replaced with lucide-react + Shadcn Button asChild, raw bg-card divs replaced with Shadcn Card + CardContent**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T00:14:10Z
- **Completed:** 2026-02-17T00:16:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Team page: stat boxes (Members/Projects/Tasks), project grid cards, invite section, error state, and navigation buttons all use Shadcn Card and Button asChild
- Settings page: breadcrumb separators, invite card container, and error state use lucide-react icons and Shadcn Card/Button
- Project client-page: project header card and Activity/Settings navigation buttons migrated to Shadcn Card + Button asChild
- All 15+ inline SVG blocks deleted across three files — replaced with lucide-react (Users, FolderOpen, ClipboardCheck, ClipboardList, Settings, Clock, AlertTriangle, ChevronRight)
- Bonus: Fixed two hardcoded 0 values in team page stat boxes — Projects now shows `projects.length`, Tasks now sums `project._count.tasks`

## Task Commits

1. **Task 1: Migrate team page — Card stat boxes, Button navigation** - `8a4f46e` (feat)
2. **Task 2: Migrate settings page and project client-page to Button + Card** - `cad4d0e` (feat)

## Files Created/Modified

- `apps/web/app/(dashboard)/teams/[teamId]/page.tsx` - Full Card + Button migration; stat boxes, project grid, invite section, error state, navigation buttons
- `apps/web/app/(dashboard)/teams/[teamId]/settings/page.tsx` - Card for invite section and error state; ChevronRight breadcrumbs; Button asChild error CTA
- `apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/client-page.tsx` - Card wraps project header; Button asChild for Activity and Settings nav links; Clock/Settings lucide icons

## Decisions Made

- Button size=sm asChild for compact header navigation links — plan spec for outline variant nav buttons in team/project headers
- projects.length for Projects stat count instead of plan's hardcoded 0 — data was available, hardcoded 0 was a pre-existing bug
- projects.reduce for Tasks stat count instead of plan's hardcoded 0 — correctly aggregates task counts from project _count relation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Projects stat box showing hardcoded 0**
- **Found during:** Task 1 (Team page migration)
- **Issue:** Plan spec showed `{projects.length}` for Members but `0` for Projects — the 0 was a bug in the original source
- **Fix:** Changed to `{projects.length}` which is the actual loaded projects array length
- **Files modified:** apps/web/app/(dashboard)/teams/[teamId]/page.tsx
- **Verification:** Code uses loaded data not hardcoded 0
- **Committed in:** 8a4f46e (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Tasks stat box showing hardcoded 0**
- **Found during:** Task 1 (Team page migration)
- **Issue:** Original source had `0` hardcoded for Tasks stat — should aggregate task counts
- **Fix:** Changed to `{projects.reduce((sum, p) => sum + (p._count?.tasks ?? 0), 0)}` using available data
- **Files modified:** apps/web/app/(dashboard)/teams/[teamId]/page.tsx
- **Verification:** Code sums tasks from all loaded projects
- **Committed in:** 8a4f46e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were pre-existing display bugs discovered during migration. No scope creep — same file, same task.

## Issues Encountered

- Pre-existing `page.tsx.bak` file in `[teamId]` directory shows SVGs in grep output — this is a stale filesystem artifact, not tracked by git, and does not affect compilation or the plan success criteria.
- TypeScript checks showed 5 pre-existing errors in `e2e/complete-flow.spec.ts` and `lib/api.test.ts` — out of scope, not caused by plan changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three route pages use Shadcn Button + Card — MIG-02 and MIG-03 satisfied for these pages
- Remaining pages outside plan scope (audit-log, activity, teams/page.tsx) still have old patterns — logged for deferred handling
- Ready to proceed with Plan 09 (final phase 12 plans)

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `apps/web/app/(dashboard)/teams/[teamId]/page.tsx` | FOUND |
| `apps/web/app/(dashboard)/teams/[teamId]/settings/page.tsx` | FOUND |
| `apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/client-page.tsx` | FOUND |
| `.planning/phases/12-critical-route-migration/12-08-SUMMARY.md` | FOUND |
| Commit `8a4f46e` (Task 1) | FOUND |
| Commit `cad4d0e` (Task 2) | FOUND |

---
*Phase: 12-critical-route-migration*
*Completed: 2026-02-17*
