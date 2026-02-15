---
phase: 02-core-work-management
plan: 09
subsystem: task-detail-ui
tags: [nextjs, react, task-detail, inline-editing, comments, history, audit-timeline]
dependency-graph:
  requires: [02-04-tasks-comments-api, 02-07-kanban-list-ui]
  provides: [task-detail-page, comment-thread-ui, task-history-ui, inline-editing-ui]
  affects: [03-realtime-websockets]
tech-stack:
  added: []
  patterns: [inline-editing, tab-navigation, timeline-ui, optimistic-updates, activity-timeline]
key-files:
  created:
    - apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/tasks/[taskId]/page.tsx
    - apps/web/components/tasks/task-detail-panel.tsx
    - apps/web/components/tasks/comment-thread.tsx
    - apps/web/components/tasks/comment-form.tsx
    - apps/web/components/tasks/task-history.tsx
  modified: []
decisions:
  - inline-editing-pattern: "Click-to-edit for title (Enter/Escape), click-to-edit for description (save/cancel buttons), immediate save for dropdowns"
  - tab-navigation-comments-history: "Two tabs (Comments/History) instead of both visible to reduce vertical scroll"
  - client-side-history-filtering: "Fetch project activity and filter for task-specific events client-side (API should ideally support this)"
  - page-refresh-for-comments: "Router.refresh() after comment mutations to get fresh server data (simpler than manual state sync)"
  - author-only-edit-delete: "Edit/delete buttons visible on hover only for comment author (matches API author-only restriction)"
metrics:
  duration: 356
  completed: 2026-02-15T04:36:03Z
---

# Phase 2 Plan 9: Task Detail View with Comments and History Summary

Task detail page with inline editing, comment thread, and task history timeline showing full task lifecycle and collaborative workflow.

## Execution Report

**Status:** Complete ✓
**Tasks completed:** 2/2
**Duration:** 5.9 minutes

### Task Breakdown

| Task | Name                                                               | Status | Commit  |
| ---- | ------------------------------------------------------------------ | ------ | ------- |
| 1    | Create task detail page with editable fields and comment thread | ✓      | 68a0fc4 |
| 2    | Create task history timeline from audit log                      | ✓      | bccaa4c |

## What Was Built

### Task 1: Task Detail Page with Inline Editing and Comments

**`tasks/[taskId]/page.tsx`** - Server Component for task detail route:
- Fetches task detail via GET /tasks/:taskId (includes comments, labels, assignee, createdBy)
- Fetches team members via GET /teams/:teamId/members (for assignee dropdown)
- Fetches labels via GET /teams/:teamId/labels (for label multi-select)
- Breadcrumb navigation: Team > Projects > Project > Task Title
- Back button to project page
- Renders TaskDetailPanel with all data

**`task-detail-panel.tsx`** - Main task detail component:
- **Layout:** Two-column grid (main content left, metadata sidebar right)
- **Main content area:**
  - **Title editing:** Click to edit inline, Enter to save, Escape to cancel
  - **Description editing:** Click to edit textarea, Save/Cancel buttons
  - **Comments and History tabs:** Tabbed interface with active tab highlighting
- **Metadata sidebar (right column):**
  - **Status dropdown:** Colored badges (TODO=blue, IN_PROGRESS=yellow, DONE=green, BLOCKED=red)
  - **Priority dropdown:** Colored badges (URGENT=red, HIGH=orange, MEDIUM=yellow, LOW=slate)
  - **Assignee dropdown:** Team members with "Unassigned" option
  - **Labels multi-select:** Checkboxes with colored dots
  - **Due date picker:** HTML5 date input
  - **Created by:** Avatar + name (read-only)
  - **Created:** Relative timestamp (read-only)
  - **Last Updated:** Relative timestamp (read-only)
  - **Delete button:** Confirmation dialog ("Are you sure? This cannot be undone.")
- **Immediate save pattern:** All metadata field changes call PATCH /tasks/:id immediately (no separate save button)
- **Saving indicator:** Brief "Saving..." message during API calls
- **State management:** useState for current task, syncs with API responses
- **Error handling:** Alert on API errors, field values revert on failure

**`comment-thread.tsx`** - Comment list component:
- Props: comments (CommentWithAuthor[]), taskId, onUpdate callback
- Each comment displays:
  - Author avatar (image or initials in colored circle)
  - Author name
  - Relative timestamp (via date-fns formatDistanceToNow)
  - Comment content (whitespace-pre-wrap for line breaks)
  - Edit/Delete buttons (visible on hover, only for author)
- **Edit mode:** Textarea with Save/Cancel buttons
- **Delete:** Confirmation dialog via confirm()
- **Author-only restriction:** Edit/Delete only shown if session.user.id matches comment.authorId
- **Empty state:** "No comments yet. Be the first to comment."

**`comment-form.tsx`** - New comment form:
- Textarea for comment content
- "Comment" button (disabled when empty or submitting)
- POST /tasks/:taskId/comments on submit
- Clears textarea on success
- Calls onCommentAdded callback to refresh page
- Loading state: "Posting..." text during submission

### Task 2: Task History Timeline from Audit Log

**`task-history.tsx`** - Activity timeline component:
- Props: taskId, projectId
- **Data fetching:**
  - Fetches via GET /projects/:projectId/activity?offset=N&limit=20
  - Filters results client-side to only show events for this task
  - Task events: entityId matches taskId
  - Comment events: belong to this task (filtered by entityType)
- **Timeline UI:**
  - Vertical line connecting all entries (absolute positioned gray line)
  - Each entry shows:
    - Actor avatar (image or initials in colored circle with white border)
    - Actor name + action description
    - Relative timestamp
- **Human-readable descriptions:**
  - Created: "Created this task" or "Added a comment"
  - Deleted: "Deleted a comment"
  - Status changed: "Changed status from To Do to In Progress"
  - Updated: Parses changes field to detect:
    - Priority change: "Changed priority from Medium to High"
    - Assignee change: "assigned the task", "unassigned the task", or "changed assignee"
    - Due date change: "set due date", "removed due date", or "changed due date"
    - Title change: "changed title"
    - Description change: "updated description"
  - Fallback: Generic action name with underscores replaced by spaces
- **Pagination:**
  - "Load more" button at bottom
  - Fetches next 20 entries on click
  - Button hidden when no more results
  - Loading state: "Loading..." text
- **Empty state:** "No history yet."
- **Error state:** Displays error message in red text

**Integration into TaskDetailPanel:**
- Added "History" tab next to "Comments" tab
- Tab headers with border highlighting and hover effects
- Active tab: border-blue-600 text-blue-600
- Inactive tab: border-transparent text-gray-500 with hover effects
- Tab content conditionally renders CommentThread/CommentForm or TaskHistory

## Deviations from Plan

None. Plan executed exactly as written. All components built according to specifications with correct features and patterns.

## Verification Results

**Component functionality:**
- ✓ Task detail page shows all task fields with inline editing
- ✓ Title editing works (click, Enter to save, Escape to cancel)
- ✓ Description editing works (click, save/cancel buttons)
- ✓ Status/priority/assignee/labels/dueDate changes save immediately
- ✓ Comment form submits and refreshes page
- ✓ Comment thread shows all comments with author info
- ✓ Edit/delete own comments works (author-only)
- ✓ Task history shows timeline of changes
- ✓ Status changes display correctly ("Changed status from X to Y")
- ✓ Assignment changes show correctly
- ✓ Creation event shows
- ✓ Comments events show in history
- ✓ Timeline is chronological (newest first)
- ✓ Load more button works for pagination
- ✓ Delete task with confirmation works
- ✓ Breadcrumb navigation works
- ✓ Back button works

**TypeScript compilation:**
- ✓ No TypeScript errors in task detail components
- ✓ All types properly imported from @repo/shared
- ✓ TaskDetail type includes comments, createdBy, labels

**Routing:**
- ✓ Task detail route registered: /teams/[teamId]/projects/[projectId]/tasks/[taskId]
- ✓ Route builds successfully in Next.js
- ✓ Server Component data fetching works

## Dependencies

**Requires:**
- Phase 2 Plan 4 (Tasks/Comments API) - Task detail endpoint, comments CRUD, activity feed
- Phase 2 Plan 7 (Kanban/List UI) - Task card component, project page structure

**Provides:**
- Task detail page with full metadata view
- Inline editing for all task fields
- Comment thread with add/edit/delete
- Task history timeline from audit log
- Navigation from Kanban/List to task detail

**Affects:**
- Phase 3 (Real-time WebSockets) - will add live updates when task changes or new comments added

## Key Decisions

1. **Inline editing pattern** - Different patterns for different field types:
   - Title: Click to edit, Enter to save, Escape to cancel (single-line input)
   - Description: Click to edit, Save/Cancel buttons (multi-line textarea)
   - Metadata fields: Immediate save on dropdown/checkbox change (no explicit save button)
   - Rationale: Matches common UI patterns (GitHub, Linear, Notion) and provides appropriate controls for each field type.

2. **Tab navigation for Comments/History** - Two tabs instead of both sections visible:
   - Reduces vertical scroll length
   - Focuses user attention on one aspect at a time
   - Comments tab default (primary action)
   - History tab shows full audit trail when needed
   - Tab count shows comment count for quick reference

3. **Client-side history filtering** - Fetch project activity and filter for task-specific events in component:
   - API endpoint is /projects/:projectId/activity (project-scoped)
   - Filter client-side by entityId === taskId for Task events
   - Ideally API should support filtering by entityId (future improvement)
   - Current implementation works but makes extra network calls

4. **Page refresh for comments** - Use router.refresh() after comment mutations:
   - Ensures fresh server data (comments array, timestamps)
   - Simpler than manual state synchronization
   - Server Components re-fetch on refresh
   - Trade-off: slower than incremental updates, but more reliable
   - Consistent with pattern used in Kanban/List views (02-07)

5. **Author-only edit/delete** - Edit/Delete buttons only visible on hover for comment author:
   - Matches API restriction (author-only editing from 02-04)
   - Prevents UI clutter (buttons hidden by default)
   - Visual feedback on hover (reveals actions)
   - Check: session.user.id === comment.authorId

## Blockers Encountered

None.

## Known Issues (Pre-existing)

1. **rxjs duplication** - Two copies of rxjs cause TypeScript errors in audit.interceptor.ts (API build). Noted in STATE.md from Phase 1 Plan 3. Does not affect web app functionality.

2. **Activity feed filtering** - API should ideally support filtering by entityId to avoid client-side filtering. Current implementation fetches all project activities and filters in TaskHistory component. Works but not optimal for performance at scale.

## Next Steps

Phase 2 Plan 9 provides the complete task detail view with collaborative features. Next plans:

- **Phase 2 Plan 10** (if planned) - Additional task management features
- **Phase 2 Plan 11** (if planned) - Final phase 2 tasks
- **Phase 3 (Real-time WebSockets)** - Add live updates when tasks change or comments added

All UI requirements for task detail view are complete:
- ✓ TASK-02: User can edit any task field (inline editing UI) ✓
- ✓ TASK-03: User can delete tasks (UI with confirmation) ✓
- ✓ TASK-08: User can add comments to tasks (UI) ✓
- ✓ TASK-09: User can view task history and changes (UI) ✓

The task detail page demonstrates:
- Full CRUD operations on tasks
- Inline editing patterns
- Comment thread with collaborative features
- Audit trail visualization
- Professional UX patterns (click-to-edit, tabs, timelines)
- All interactions backed by secure REST API

## Self-Check

Verifying all claims in this summary...

### Files Created
- ✓ apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/tasks/[taskId]/page.tsx exists
- ✓ apps/web/components/tasks/task-detail-panel.tsx exists
- ✓ apps/web/components/tasks/comment-thread.tsx exists
- ✓ apps/web/components/tasks/comment-form.tsx exists
- ✓ apps/web/components/tasks/task-history.tsx exists

### Commits
- ✓ 68a0fc4 exists (Task 1: task detail page with inline editing and comments)
- ✓ bccaa4c exists (Task 2: task history timeline from audit log)

## Self-Check: PASSED
