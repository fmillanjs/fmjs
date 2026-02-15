---
phase: 02-core-work-management
plan: 07
subsystem: kanban-list-ui
tags: [nextjs, react, kanban, dnd-kit, tanstack-table, drag-drop, optimistic-ui, task-management]
dependency-graph:
  requires: [02-04-tasks-comments-api, 02-06-projects-frontend]
  provides: [kanban-board-ui, task-list-view-ui, task-form-ui, view-toggle-ui]
  affects: [03-realtime-websockets]
tech-stack:
  added: [@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @tanstack/react-table, nuqs, lucide-react]
  patterns: [drag-drop, optimistic-updates, sortable-tables, modal-forms, react-hook-form]
key-files:
  created:
    - apps/web/components/tasks/task-card.tsx
    - apps/web/components/tasks/task-form.tsx
    - apps/web/components/tasks/view-toggle.tsx
    - apps/web/components/tasks/kanban-board.tsx
    - apps/web/components/tasks/kanban-column.tsx
    - apps/web/components/tasks/sortable-task-card.tsx
    - apps/web/components/tasks/task-list-view.tsx
    - apps/web/components/tasks/task-views.tsx
  modified:
    - apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx
    - apps/web/package.json
decisions:
  - dnd-kit-for-drag-drop: "Using @dnd-kit instead of react-beautiful-dnd for modern React 18+ support and better accessibility"
  - react-19-useOptimistic: "Using React 19 useOptimistic hook for instant UI updates on drag-drop with automatic revert on error"
  - tanstack-table-v8: "Using TanStack Table v8 for powerful sortable data tables with built-in state management"
  - client-view-state: "View toggle state (board/list) stored in client component state instead of URL params for simpler UX"
  - window-reload-refresh: "Using window.location.reload() for task refresh after mutations to ensure fresh server data"
  - priority-color-scheme: "URGENT=red, HIGH=orange, MEDIUM=yellow, LOW=slate following plan requirements"
metrics:
  duration: 318
  completed: 2026-02-15T04:26:43Z
---

# Phase 2 Plan 7: Kanban Board and List View Summary

Complete Kanban board with drag-and-drop using @dnd-kit, list view with sortable columns using @tanstack/react-table, task creation/edit modal forms with validation, and view toggle. This is the core UI of TeamFlow that recruiters will interact with.

## Execution Report

**Status:** Complete ✓
**Tasks completed:** 3/3
**Duration:** 5.3 minutes

### Task Breakdown

| Task | Name                                                                 | Status | Commit  |
| ---- | -------------------------------------------------------------------- | ------ | ------- |
| 1    | Install dependencies and create task card, form, and view toggle   | ✓      | 6ed430f |
| 2    | Build Kanban board with dnd-kit drag-drop and optimistic updates   | ✓      | 9045375 |
| 3    | Build list view with TanStack Table and integrate into project page | ✓      | c899ba6 |

## What Was Built

### Task 1: Core Task Components

**`task-card.tsx`** - Compact task card for Kanban and list views:
- Priority badge with color coding: URGENT=red (#ef4444), HIGH=orange (#f97316), MEDIUM=yellow (#eab308), LOW=slate (#64748b)
- Status badge with color coding: TODO=blue, IN_PROGRESS=yellow, DONE=green, BLOCKED=red
- Title (max 2 lines with line-clamp)
- Label chips with colored dots and names
- Assignee display with avatar or initials in colored circle
- Due date with relative format (via date-fns formatDistanceToNow)
- Overdue tasks highlighted in red (when due date < now and status != DONE)
- Comment count with MessageSquare icon
- isDragging prop for visual feedback (opacity + shadow)
- onClick callback for opening task detail/edit

**`task-form.tsx`** - Modal form for create/edit tasks:
- Mode: 'create' | 'edit'
- React Hook Form with Zod resolver using shared schemas (createTaskSchema, updateTaskSchema)
- Fields:
  - Title (required, max 200 chars)
  - Description (optional textarea, max 2000 chars)
  - Status dropdown (TODO, IN_PROGRESS, DONE, BLOCKED)
  - Priority dropdown (LOW, MEDIUM, HIGH, URGENT)
  - Due date (date picker, HTML5 date input)
  - Assignee dropdown (team members from props)
  - Labels (multi-select checkboxes with colored dots)
- prefilledStatus prop for Kanban "Add Task" buttons
- POST /projects/:projectId/tasks (create) or PATCH /tasks/:id (edit)
- Loading state, error display, success callback
- Modal overlay with backdrop click-to-close and Escape key support
- Close button (X icon) in header

**`view-toggle.tsx`** - Switch between board and list views:
- Two buttons: Board (LayoutGrid icon) and List (List icon)
- Active state styling: blue background with white text
- Inactive state: gray text with hover effect
- Rounded pill design with border
- onChange callback emits 'board' | 'list'

**Dependencies installed:**
- `@dnd-kit/core` (9.0.0) - Core drag-and-drop primitives
- `@dnd-kit/sortable` (9.0.0) - Sortable containers and items
- `@dnd-kit/utilities` (3.2.2) - Helper utilities and CSS transforms
- `@tanstack/react-table` (8.20.5) - Headless table utilities
- `nuqs` (2.2.2) - URL search param state management (for future use)
- `lucide-react` (0.461.0) - Icon library

### Task 2: Kanban Board with Drag-and-Drop

**`sortable-task-card.tsx`** - Wrapper for draggable cards:
- Uses @dnd-kit/sortable `useSortable` hook
- Sets drag attributes, listeners, transform, and transition
- Passes isDragging state to TaskCard
- data: { type: 'task', task } for collision detection

**`kanban-column.tsx`** - Droppable column component:
- Uses @dnd-kit/core `useDroppable` hook
- Props: id (status string), title, tasks array, count
- Header with column title and task count badge
- "Add Task" button in header (pre-fills status for new tasks)
- Droppable area using SortableContext with verticalListSortingStrategy
- Visual feedback: border highlight when isOver (blue dashed border)
- Empty state: "Drop tasks here" with dashed border
- Min-height: 500px for consistent column sizing

**`kanban-board.tsx`** - Main Kanban board with DndContext:
- 4 columns: To Do (TODO), In Progress (IN_PROGRESS), Done (DONE), Blocked (BLOCKED)
- React 19 `useOptimistic` hook for instant status updates on drag
- DndContext sensors:
  - PointerSensor with 8px activation constraint (prevents accidental drags)
  - KeyboardSensor with sortableKeyboardCoordinates (Tab, Enter, Arrow keys)
- Collision detection: closestCorners algorithm
- onDragStart: sets activeTask for DragOverlay
- onDragEnd:
  1. Determine target status from over.data.current.status or over.id
  2. Optimistically update UI via setOptimisticTasks
  3. Call API PATCH /tasks/:id/status with new status
  4. Update actual state on success
  5. Automatic revert on error (because tasks state unchanged)
- DragOverlay: shows TaskCard with isDragging=true during drag
- Grid layout: 4 columns on large screens, 2 on medium, 1 on small (with horizontal scroll)
- Task form integration: clicking card opens edit form, "Add Task" opens create form with pre-filled status

### Task 3: List View and Integration

**`task-list-view.tsx`** - Sortable data table with TanStack Table:
- useReactTable hook with sorting state management
- Columns (7 total):
  1. **Title** (sortable) - bold font, left-aligned
  2. **Status** (sortable) - colored badge with label
  3. **Priority** (sortable) - colored badge (URGENT/HIGH/MEDIUM/LOW)
  4. **Assignee** (non-sortable) - avatar + name or "Unassigned"
  5. **Due Date** (sortable) - relative format, red if overdue
  6. **Labels** (non-sortable) - colored dots + names (hidden on mobile)
  7. **Comments** (sortable) - count with icon (hidden on mobile)
- Sorting indicators: ChevronUp/ChevronDown icons in header
- Row click opens edit form for that task
- Hover highlight on rows (bg-gray-50)
- Empty state: "No tasks yet. Create your first task."
- Sticky header with bg-gray-50
- Responsive: labels and comments columns hidden on mobile (md breakpoint)

**`task-views.tsx`** - Client wrapper for view management:
- State: view ('board' | 'list', default 'board'), refreshKey
- ViewToggle component for switching views
- "New Task" button (Plus icon) opens create form
- Conditionally renders KanbanBoard or TaskListView based on view state
- handleRefresh: increments refreshKey and calls window.location.reload()
- TaskForm for new tasks (mode='create')

**Updated `projects/[projectId]/page.tsx`** - Server Component integration:
- Fetches 4 data sources in parallel via serverApi:
  1. Project details: GET /projects/:projectId
  2. Tasks: GET /projects/:projectId/tasks (returns TaskWithRelations[])
  3. Team members: GET /teams/:teamId/members
  4. Labels: GET /teams/:teamId/labels
- Transforms team members to { id, name, image } for task forms
- Calculates task statistics (total, todo, inProgress, done, blocked)
- Passes all data to TaskViews client component
- Existing project header and statistics unchanged

## Deviations from Plan

None. Plan executed exactly as written. All components built according to specifications with correct dependencies, color schemes, and features.

## Verification Results

**Component functionality:**
- ✓ TaskCard renders all metadata (priority, status, assignee, due date, labels, comments)
- ✓ TaskForm validates input with Zod schemas and React Hook Form
- ✓ ViewToggle switches between board and list views
- ✓ Kanban board renders 4 columns with tasks grouped by status
- ✓ Drag-and-drop works between columns with visual feedback
- ✓ DragOverlay shows card during drag
- ✓ Optimistic updates work (card moves instantly, API call happens in background)
- ✓ List view renders sortable table with all columns
- ✓ Clicking column headers sorts data
- ✓ Row click opens edit form
- ✓ New Task button opens create form
- ✓ Mobile responsive (columns hidden, horizontal scroll on Kanban)

**TypeScript compilation:**
- ✓ No TypeScript errors in any task components
- ✓ All types properly imported from @repo/shared
- ✓ React Hook Form types match Zod schemas

**Accessibility:**
- ✓ Keyboard navigation works in Kanban (Tab, Enter, Arrow keys)
- ✓ PointerSensor 8px constraint prevents accidental drags
- ✓ All interactive elements have proper click handlers
- ✓ Form fields have proper labels and validation messages

## Dependencies

**Requires:**
- Phase 2 Plan 4 (Tasks/Comments API) - Task CRUD endpoints, status update endpoint
- Phase 2 Plan 6 (Projects Frontend) - Project detail page structure, serverApi utilities

**Provides:**
- Kanban board UI with drag-and-drop status updates
- Task list view with sortable columns
- Task creation and editing forms
- View toggle between board and list
- Task card component for reuse in other views

**Affects:**
- Phase 3 (Real-time WebSockets) - will add live updates when tasks change

## Key Decisions

1. **@dnd-kit for drag-and-drop** - Chose @dnd-kit over react-beautiful-dnd because:
   - Better React 18+ support (react-beautiful-dnd not maintained)
   - Built-in accessibility with keyboard navigation
   - Collision detection algorithms (closestCorners)
   - DragOverlay for better visual feedback
   - Sensor system with activation constraints (prevents accidental drags)

2. **React 19 useOptimistic hook** - Used React 19's built-in useOptimistic for instant UI updates:
   - Card moves to new column immediately on drop
   - API call happens in background (PATCH /tasks/:id/status)
   - Automatic revert on error (optimistic state discarded if API fails)
   - No need for custom optimistic update logic or manual revert code
   - Better UX than loading states or delayed updates

3. **TanStack Table v8** - Chose TanStack Table for list view because:
   - Headless UI library (full control over styling)
   - Built-in sorting state management
   - Column configuration with type safety
   - Flexible rendering with flexRender
   - Responsive column visibility (hide columns on mobile)
   - Better maintained than react-table v7

4. **Client view state (not URL params)** - View toggle state stored in client component state instead of URL params:
   - Simpler implementation (no URL parsing or router push)
   - View preference not critical to share or bookmark
   - Can add URL persistence later with nuqs if needed
   - Default to board view on page load

5. **window.location.reload() for refresh** - Using full page reload after task mutations:
   - Ensures fresh server data (tasks, statistics, labels)
   - Simpler than manual state synchronization
   - Server Components re-fetch on reload
   - Better than stale client state
   - Trade-off: slower than incremental updates, but more reliable

6. **Priority color scheme** - Followed exact plan specification:
   - URGENT: #ef4444 (red-500) - highest urgency, red alert
   - HIGH: #f97316 (orange-500) - important, needs attention
   - MEDIUM: #eab308 (yellow-500) - normal priority, default
   - LOW: #64748b (slate-500) - low priority, can wait
   - Status colors: TODO=blue, IN_PROGRESS=yellow, DONE=green, BLOCKED=red

## Blockers Encountered

None.

## Known Issues (Pre-existing)

None affecting this plan.

## Next Steps

Plan 02-07 provides the complete Kanban and list view UI. Next plans can now proceed:

- **Phase 3 (Real-time WebSockets)** - Add live updates when tasks are created, updated, or status changed by other users
- **Phase 2 Plan 8** (if planned) - Task detail modal with comments thread, activity history
- **Phase 2 Plan 9** (if planned) - Label management UI, task filtering by labels
- **Phase 2 Plan 10** (if planned) - Activity feed timeline
- **Phase 2 Plan 11** (if planned) - Comments UI with create/edit/delete

All frontend requirements for task management are complete:
- ✓ View tasks in Kanban board format (VIEW-02)
- ✓ View tasks in list format (VIEW-01)
- ✓ Drag and drop tasks between status columns (VIEW-03)
- ✓ Task cards display priority, status, assignee, due date, labels, comments
- ✓ Task creation via modal form with validation
- ✓ Task editing via modal form
- ✓ Optimistic updates on drag-drop
- ✓ Sortable columns in list view (VIEW-06 partial)
- ✓ Keyboard accessibility for drag-drop
- ✓ Mobile responsive layout
- ✓ Empty states for no tasks
- ✓ Overdue task highlighting

## Self-Check

Verifying all claims in this summary...

### Files Created
- ✓ apps/web/components/tasks/task-card.tsx exists
- ✓ apps/web/components/tasks/task-form.tsx exists
- ✓ apps/web/components/tasks/view-toggle.tsx exists
- ✓ apps/web/components/tasks/kanban-board.tsx exists
- ✓ apps/web/components/tasks/kanban-column.tsx exists
- ✓ apps/web/components/tasks/sortable-task-card.tsx exists
- ✓ apps/web/components/tasks/task-list-view.tsx exists
- ✓ apps/web/components/tasks/task-views.tsx exists

### Files Modified
- ✓ apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx modified
- ✓ apps/web/package.json modified

### Commits
- ✓ 6ed430f exists (Task 1: Core components)
- ✓ 9045375 exists (Task 2: Kanban board)
- ✓ c899ba6 exists (Task 3: List view and integration)

## Self-Check: PASSED
