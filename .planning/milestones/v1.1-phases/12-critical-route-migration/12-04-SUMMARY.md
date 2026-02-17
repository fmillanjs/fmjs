---
phase: 12-critical-route-migration
plan: "04"
subsystem: ui
tags: [react, shadcn, popover, button, badge, input, nuqs, task-filters, task-search]

requires:
  - phase: 12-01
    provides: popover.tsx, button.tsx, badge.tsx, input.tsx installed via shadcn CLI

provides:
  - task-filters.tsx with 5 independent Popover dropdowns replacing custom absolute-positioned divs
  - task-search.tsx with Shadcn Input replacing raw input element
  - openDropdown shared state removed from task-filters.tsx

affects: [12-05, 12-06, 12-07, 12-08, 12-09]

tech-stack:
  added: []
  patterns:
    - "Popover with PopoverTrigger asChild + Button for filter dropdowns"
    - "Badge component for active filter count indicators"
    - "Independent Popover state per dropdown (no shared openDropdown state)"

key-files:
  created: []
  modified:
    - apps/web/components/tasks/task-filters.tsx
    - apps/web/components/tasks/task-search.tsx

key-decisions:
  - "Each filter dropdown is an independent Popover — no shared openDropdown state needed"
  - "Badge variant=default for active filter counts in PopoverTrigger buttons"
  - "Shadcn Input pl-10 pr-10 preserves search icon and clear button absolute positioning"

patterns-established:
  - "Popover + PopoverTrigger asChild + Button pattern for all filter dropdown triggers"

requirements-completed:
  - MIG-02
  - MIG-03

duration: 2min
completed: 2026-02-17
---

# Phase 12 Plan 04: TaskFilters + TaskSearch Migration Summary

**5 custom absolute-positioned dropdown divs replaced with independent Shadcn Popover components; TaskSearch raw input replaced with Shadcn Input; openDropdown shared state eliminated; nuqs URL filter logic unchanged**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T00:02:45Z
- **Completed:** 2026-02-17T00:04:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced 5 manual `relative/absolute z-10` dropdown divs in task-filters.tsx with independent `<Popover>` components — each handles its own open/close state, click-outside dismissal, and collision detection
- Removed the `openDropdown` shared `useState` and all `setOpenDropdown(null)` calls from `setAssignee` and `setSortBy` functions
- Migrated all trigger buttons to Shadcn `Button variant="outline" size="sm"` and count indicators to `Badge variant="default"`
- Replaced raw `<input>` in task-search.tsx with Shadcn `Input` component, preserving `pl-10 pr-10` padding for search icon and clear button spacing

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate task-filters.tsx — replace 5 custom dropdowns with Popover + Button** - `43cc95a` (feat)
2. **Task 2: Migrate task-search.tsx — replace raw input with Shadcn Input** - `173a9a4` (feat)

**Plan metadata:** (docs commit following self-check)

## Files Created/Modified
- `apps/web/components/tasks/task-filters.tsx` - All 5 filter dropdowns now use Popover; openDropdown state removed; Button wraps all triggers; Badge for counts
- `apps/web/components/tasks/task-search.tsx` - Raw input replaced with Shadcn Input; debounce and nuqs logic unchanged

## Decisions Made
- Each filter dropdown is an independent `<Popover>` — no shared state needed. Radix Popover handles open/close internally per instance.
- `Badge variant="default"` used for active filter count badges inside `PopoverTrigger` buttons — consistent with Shadcn patterns from task-detail-panel.
- Shadcn `Input` used with `pl-10 pr-10` only — hardcoded `focus:ring-2 focus:ring-blue-500` styles removed (handled by Shadcn Input's built-in focus ring using `ring-ring`).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in `e2e/user-journey/complete-flow.spec.ts` and `lib/api.test.ts` were present before this plan. Confirmed neither modified file (`task-filters.tsx`, `task-search.tsx`) produces any TypeScript errors. Pre-existing test file errors are out of scope per deviation rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- task-filters.tsx and task-search.tsx fully migrated to Shadcn components
- MIG-02 (replace custom dropdowns with Shadcn Popover/Select) and MIG-03 (replace raw inputs with Shadcn Input) satisfied for these two components
- Ready for Phase 12 Plan 05 (next migration target)

## Self-Check: PASSED

- FOUND: apps/web/components/tasks/task-filters.tsx
- FOUND: apps/web/components/tasks/task-search.tsx
- FOUND: .planning/phases/12-critical-route-migration/12-04-SUMMARY.md
- FOUND commit 43cc95a: feat(12-04): migrate task-filters.tsx to Shadcn Popover + Button
- FOUND commit 173a9a4: feat(12-04): migrate task-search.tsx to Shadcn Input

---
*Phase: 12-critical-route-migration*
*Completed: 2026-02-17*
