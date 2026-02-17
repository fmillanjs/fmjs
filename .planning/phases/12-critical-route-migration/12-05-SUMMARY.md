---
phase: 12-critical-route-migration
plan: 05
subsystem: ui

tags: [shadcn, badge, card, dnd-kit, kanban, react]

# Dependency graph
requires:
  - phase: 12-01
    provides: Shadcn components installed (badge.tsx, card.tsx available)

provides:
  - TaskCard uses Shadcn Badge for priority and status labels
  - KanbanColumn uses Shadcn Card as outer container with CardHeader/CardContent
  - dnd-kit setNodeRef preserved on inner droppable div

affects: [phase-13, any component consuming kanban-column or task-card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Badge variant=outline + cn(border-0, colorToken) for Radix Color token-aware badges"
    - "Card wrapping pattern: Card > CardHeader + CardContent; setNodeRef stays on inner div for dnd-kit compatibility"

key-files:
  created: []
  modified:
    - apps/web/components/tasks/task-card.tsx
    - apps/web/components/tasks/kanban-column.tsx

key-decisions:
  - "Badge variant=outline with border-0 override preserves CVA base styles while applying Radix Color tokens via cn()"
  - "setNodeRef from useDroppable MUST stay on inner div — not moved to Card component — to preserve drag detection"
  - "CardHeader pb-2 / CardContent flex-1 pt-0 spacing matches column layout without adding extra padding"

patterns-established:
  - "Badge with Radix tokens: variant=outline + cn('border-0', colorBg, colorText) for semantic color pills"
  - "Shadcn Card wrapping dnd-kit columns: outer Card for visuals, inner div holds droppable ref"

requirements-completed:
  - MIG-02
  - MIG-03

# Metrics
duration: 1min
completed: 2026-02-17
---

# Phase 12 Plan 05: TaskCard Badge + KanbanColumn Card Migration Summary

**TaskCard priority/status labels replaced with Shadcn Badge; KanbanColumn outer div replaced with Shadcn Card — dnd-kit drag-drop logic completely untouched**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-17T17:05:57Z
- **Completed:** 2026-02-17T17:07:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced two inline `<span>` badge elements in task-card.tsx with Shadcn Badge using `variant="outline"` + `cn()` for Radix Color token compatibility
- Replaced outer `<div className="flex flex-col bg-muted rounded-lg p-4 min-h-[500px]">` in kanban-column.tsx with `<Card>` + `<CardHeader>` + `<CardContent>` structure
- Confirmed `ref={setNodeRef}` from `useDroppable` remains on the inner droppable div — dnd-kit drag-and-drop fully preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace inline badge spans with Shadcn Badge** - `b1b1d1f` (feat)
2. **Task 2: Wrap KanbanColumn outer container in Shadcn Card** - `41ccde8` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `apps/web/components/tasks/task-card.tsx` - Badge import added; priority and status `<span>` elements replaced with `<Badge variant="outline" className={cn(...)}>`
- `apps/web/components/tasks/kanban-column.tsx` - Card/CardHeader/CardContent imported; outer bg-muted div replaced with Card; column header in CardHeader; droppable area in CardContent with setNodeRef on inner div

## Decisions Made

- Badge `variant="outline"` with `border-0` className override: preserves CVA base styles (inline-flex, rounded, text-xs) while applying Radix Color token classes for background and text
- `setNodeRef` intentionally left on the inner div inside `CardContent` — moving it to the `Card` component would break dnd-kit droppable hit detection
- `CardHeader className="pb-2"` and `CardContent className="flex-1 pt-0"` override default Shadcn spacing (p-6) to maintain the original column layout proportions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors exist in `e2e/user-journey/complete-flow.spec.ts` and `lib/api.test.ts` — unrelated to this plan's changes. Out of scope per deviation scope boundary rules. No new errors introduced.

## Next Phase Readiness

- Task board Kanban view now fully uses Shadcn design tokens for column containers and label badges
- MIG-02 (inline badge spans eliminated) and MIG-03 (raw div column containers eliminated) satisfied for task-card and kanban-column
- Phase 12 plans 12-06 through 12-09 remain — continue with next plan in wave 2/3

---
*Phase: 12-critical-route-migration*
*Completed: 2026-02-17*
