---
phase: 02-core-work-management
plan: 04
subsystem: tasks-comments-api
tags: [nestjs, tasks, comments, rest-api, rbac, organization-scoping, filtering, activity-feed, audit-log]
dependency-graph:
  requires: [02-01-data-foundation, 02-02-teams-crud, 02-03-projects-labels, 01-06-rbac-foundations]
  provides: [tasks-crud-api, comments-crud-api, activity-feed-api, audit-log-api, kanban-status-update]
  affects: [02-10-board-ui, 02-11-task-ui, 03-realtime-websockets]
tech-stack:
  added: []
  patterns: [organization-scoping, project-scoping, author-only-editing, admin-only-audit, pagination, filtering, search]
key-files:
  created:
    - apps/api/src/modules/tasks/tasks.controller.ts
    - apps/api/src/modules/tasks/tasks.service.ts
    - apps/api/src/modules/tasks/tasks.module.ts
    - apps/api/src/modules/tasks/dto/create-task.dto.ts
    - apps/api/src/modules/tasks/dto/update-task.dto.ts
    - apps/api/src/modules/comments/comments.controller.ts
    - apps/api/src/modules/comments/comments.service.ts
    - apps/api/src/modules/comments/comments.module.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts
    - apps/api/src/modules/teams/teams.controller.ts
    - apps/api/src/modules/teams/teams.service.ts
    - packages/shared/src/types/enums.ts
    - packages/shared/src/types/events.ts
decisions:
  - task-comment-audit-events: "Added TASK_CREATED, TASK_UPDATED, TASK_STATUS_CHANGED, TASK_DELETED, COMMENT_CREATED, COMMENT_UPDATED, COMMENT_DELETED to AuditAction enum with TaskEvent and CommentEvent interfaces"
  - kanban-status-endpoint: "Separate PATCH /tasks/:id/status endpoint for optimized Kanban drag-drop (updates status only, not full task)"
  - author-only-comment-editing: "Comments can only be edited/deleted by author or ADMIN to prevent unauthorized modifications"
  - admin-only-audit-log: "Only ADMIN role can access organization-wide audit log via GET /teams/:id/audit-log"
  - project-activity-feed: "Activity feed scoped to project (not organization) for focused task/project history"
  - label-organization-verification: "Labels must belong to same organization as project when assigning to tasks"
metrics:
  duration: 408
  completed: 2026-02-15T04:06:14Z
---

# Phase 2 Plan 4: Tasks and Comments CRUD Summary

Tasks and Comments NestJS modules with full CRUD endpoints, filtering, search, Kanban status updates, activity feeds, and admin audit logs.

## Execution Report

**Status:** Complete ✓
**Tasks completed:** 2/2
**Duration:** 6.8 minutes

### Task Breakdown

| Task | Name                                                                                       | Status | Commit  |
| ---- | ------------------------------------------------------------------------------------------ | ------ | ------- |
| 1    | Create Tasks module with full CRUD, filtering, and audit events                          | ✓      | dd0dd97 |
| 2    | Create Comments module and activity/audit query endpoints                                | ✓      | dc23910 |

## What Was Built

### Tasks Module

**`tasks.service.ts`** - Business logic with organization scoping and filtering:

1. **verifyProjectAccess(projectId, userId):**
   - Private helper to verify user is member of project's organization
   - Returns project with organization data
   - Throws NotFoundException if project doesn't exist
   - Throws ForbiddenException if user not member of organization

2. **verifyTaskAccess(taskId, userId):**
   - Private helper to verify user has access to task
   - Loads task with project.organization relationship
   - Verifies user membership in task's organization
   - Throws NotFoundException/ForbiddenException as needed

3. **create(dto, user, metadata):**
   - Verify project access via verifyProjectAccess
   - Check RBAC permission can('create', 'Task')
   - If assigneeId provided, verify assignee is org member
   - If labelIds provided, verify all labels belong to org
   - Calculate position: count of tasks with same status in project
   - Create task with all fields (title, description, status, priority, dueDate, position, assigneeId, labelIds, createdById)
   - Include assignee, labels, createdBy in response
   - Emit 'task.created' event with full task data

4. **findAllByProject(projectId, userId, filters):**
   - Verify project access
   - Build WHERE clause with:
     - projectId (required)
     - project.organizationId (CRITICAL: prevent cross-tenant)
     - status filter (optional, from query param)
     - priority filter (optional)
     - assigneeId filter (optional)
     - labelIds filter (optional: tasks where labels.some.id in labelIds)
     - search filter (optional: title OR description contains, mode insensitive)
   - Include: assignee { id, name, image }, labels, _count { comments }
   - OrderBy: configurable (createdAt desc default, also support: dueDate, priority, status)
   - Return tasks array

5. **findById(taskId, userId):**
   - Verify task access via verifyTaskAccess
   - Include: assignee, labels, comments (with author, ordered by createdAt asc), createdBy, project
   - Return full task detail with all relationships

6. **update(taskId, dto, user, metadata):**
   - Verify task access
   - Check RBAC permission can('update', 'Task')
   - Capture previous state for audit diff
   - If assigneeId changed, verify new assignee is org member
   - If labelIds provided, verify all labels belong to org
   - Update task fields (set: [] then connect: new labels)
   - Emit 'task.updated' event with {previous, current} for audit trail
   - Include assignee, labels in response

7. **updateStatus(taskId, dto, user, metadata):**
   - Verify task access
   - Check RBAC permission can('update', 'Task')
   - Capture previous status
   - Update status field only (optimized for drag-drop)
   - Emit 'task.status_changed' event with {previousStatus, newStatus}
   - Return updated task with assignee and labels

8. **remove(taskId, user, metadata):**
   - Verify task access
   - Check RBAC permission can('delete', 'Task')
   - Delete task (cascade deletes comments via Prisma schema)
   - Emit 'task.deleted' event

9. **getProjectActivity(projectId, userId, offset, limit):**
   - Verify project access
   - Query audit log for entities: Project, Task, Comment
   - Filter results to only events belonging to this project:
     - Project events: entityId matches projectId
     - Task events: task.projectId matches projectId
     - Comment events: comment.task.projectId matches projectId
   - Include actor { id, name, image }
   - Order by timestamp desc
   - Paginated with offset/limit (default 20)
   - Return { activities, offset, limit, total }

**`tasks.controller.ts`** - REST endpoints:

| Method | Endpoint                        | RBAC Check      | Description                           |
| ------ | ------------------------------- | --------------- | ------------------------------------- |
| POST   | /api/projects/:id/tasks         | create, Task    | Create task in project                |
| GET    | /api/projects/:id/tasks         | read, Task      | List with filters (status, priority, assignee, labels, search, sortBy, sortOrder) |
| GET    | /api/tasks/:id                  | read, Task      | Get task detail with comments         |
| PATCH  | /api/tasks/:id                  | update, Task    | Update task fields                    |
| PATCH  | /api/tasks/:id/status           | update, Task    | Update status only (Kanban)           |
| DELETE | /api/tasks/:id                  | delete, Task    | Delete task                           |
| GET    | /api/projects/:id/activity      | read, Project   | Get project activity feed (paginated) |

**Notes:**
- All endpoints extract user from JWT via req.user
- Audit metadata (IP, user agent) extracted from request
- Service layer enforces organization scoping on all operations
- Filtering supports multiple criteria simultaneously
- Search performs case-insensitive match on title OR description
- Status update endpoint optimized for Kanban board real-time updates

### Comments Module

**`comments.service.ts`** - Business logic with author restrictions:

1. **verifyTaskAccess(taskId, userId):**
   - Same pattern as TasksService
   - Loads task with project.organization relationship
   - Verifies user is member of task's organization
   - Returns task on success

2. **create(taskId, content, user, metadata):**
   - Verify user has access to task's organization
   - Create comment with content, taskId, authorId: user.id
   - Emit 'comment.created' event
   - Return comment with author { id, name, image }

3. **findAllByTask(taskId, userId):**
   - Verify task access (user is member of task's org)
   - Find all comments for task, ordered by createdAt asc
   - Include author { id, name, image }

4. **update(commentId, content, user, metadata):**
   - Find comment with task.project.organization relationship
   - Verify user is author OR admin
   - Update content
   - Emit 'comment.updated' event
   - Return updated comment with author

5. **remove(commentId, user, metadata):**
   - Find comment with relationships
   - Verify user is author OR admin
   - Delete comment
   - Emit 'comment.deleted' event
   - Return { success: true }

**`comments.controller.ts`** - REST endpoints:

| Method | Endpoint                    | RBAC Check      | Description                          |
| ------ | --------------------------- | --------------- | ------------------------------------ |
| POST   | /api/tasks/:id/comments     | create, Task    | Add comment to task                  |
| GET    | /api/tasks/:id/comments     | read, Task      | List comments (ordered by createdAt) |
| PATCH  | /api/comments/:id           | update, Task    | Update comment (author/admin only)   |
| DELETE | /api/comments/:id           | delete, Task    | Delete comment (author/admin only)   |

**Notes:**
- Comments use Task RBAC permissions (anyone who can read task can read comments)
- Update and delete have additional author-only restriction at service layer
- ADMIN can edit/delete any comment (moderation capability)
- No validation DTO needed - only content field
- Audit events emitted for all mutations

### Activity Feed and Audit Log

**Activity Feed (Project-scoped):**
- Endpoint: GET /api/projects/:id/activity
- Returns audit log entries for Project, Task, Comment entities in this project
- Paginated with offset/limit query params (default 20 per page)
- Ordered by timestamp desc (newest first)
- Includes actor details (id, name, image)
- Available to all project members (read, Project permission)

**Audit Log (Organization-wide, Admin-only):**
- Endpoint: GET /api/teams/:id/audit-log
- Added to teams.service.ts and teams.controller.ts
- ADMIN-only access via RBAC check can('manage', 'AuditLog')
- Supports filtering:
  - entityType (e.g., "Task", "Comment", "Project")
  - action (case-insensitive search, e.g., "CREATED")
  - startDate/endDate (timestamp range)
- Paginated with offset/limit (default 20)
- Returns { logs, offset, limit, total }
- Includes actor details for each entry

### Shared Updates

**`enums.ts`** - Added task and comment audit actions:
- TASK_CREATED
- TASK_UPDATED
- TASK_STATUS_CHANGED
- TASK_DELETED
- COMMENT_CREATED
- COMMENT_UPDATED
- COMMENT_DELETED

**`events.ts`** - Added TaskEvent and CommentEvent interfaces:
- TaskEvent: entityType: 'Task', actions: task audit actions
- CommentEvent: entityType: 'Comment', actions: comment audit actions

### Integration

**Updated `app.module.ts`:**
- Imported TasksModule and CommentsModule
- Registered after LabelsModule, before EventsModule

**Updated `main.ts`:**
- Added 'tasks' and 'comments' tags to Swagger documentation

## Deviations from Plan

### Auto-fixed Issues (Deviation Rule 2)

**1. [Rule 2 - Missing critical functionality] Added task and comment audit actions**
- **Found during:** Task 1 - service implementation
- **Issue:** AuditAction enum lacked TASK_* and COMMENT_* actions needed for audit trail
- **Fix:** Added 7 new audit actions to enums.ts and created TaskEvent/CommentEvent interfaces in events.ts
- **Files modified:** packages/shared/src/types/enums.ts, packages/shared/src/types/events.ts
- **Commit:** dd0dd97 (included in Task 1)
- **Why critical:** Audit trail required for compliance and task history tracking

**2. [Rule 2 - Missing critical functionality] Added label organization verification**
- **Found during:** Task 1 - security review of create/update methods
- **Issue:** Labels could be assigned to tasks without verifying they belong to same organization (potential data leak)
- **Fix:** Added label verification in create() and update() methods - query labels by ID and organizationId, verify count matches
- **Files modified:** apps/api/src/modules/tasks/tasks.service.ts
- **Commit:** dd0dd97 (included in Task 1)
- **Why critical:** Security vulnerability - prevents cross-tenant label assignment

**3. [Rule 2 - Missing critical functionality] Added organization-wide audit log to teams module**
- **Found during:** Task 2 - implementing audit log endpoint
- **Issue:** Plan specified adding audit endpoint but didn't specify location. Teams module is natural fit for organization-level features
- **Fix:** Added getAuditLog method to teams.service.ts and GET /teams/:id/audit-log endpoint to teams.controller.ts
- **Files modified:** apps/api/src/modules/teams/teams.service.ts, apps/api/src/modules/teams/teams.controller.ts
- **Commit:** dc23910 (included in Task 2)
- **Why critical:** Audit log access is organization-level feature, teams controller already handles org operations

## Verification Results

**Code quality verification:**
- ✓ All task operations enforce organization scoping via project.organizationId
- ✓ All comment operations enforce organization scoping via task.project.organizationId
- ✓ Task filtering supports all specified criteria (status, priority, assignee, labels, search)
- ✓ Search performs case-insensitive match on title OR description
- ✓ Kanban status update endpoint optimized (updates status field only)
- ✓ Comments enforce author-only editing (or admin)
- ✓ Activity feed scoped to project, paginated
- ✓ Audit log admin-only, filterable, searchable, paginated
- ✓ All mutations emit audit events with metadata
- ✓ Label and assignee verification ensures org membership
- ✓ Position field auto-calculated for task ordering

**TypeScript compilation:**
- ✓ Only pre-existing rxjs duplication error in audit.interceptor.ts
- ✓ All new code compiles successfully
- ✓ No new type errors introduced

**Module registration:**
- ✓ TasksModule registered in app.module.ts
- ✓ CommentsModule registered in app.module.ts
- ✓ Swagger tags added for tasks and comments

## Dependencies

**Requires:**
- Phase 2 Plan 1 (Data Foundation) - Task, Comment, Label Prisma models
- Phase 2 Plan 2 (Teams CRUD) - Membership verification pattern
- Phase 2 Plan 3 (Projects/Labels) - ProjectsService for project access verification
- Phase 1 Plan 6 (RBAC Foundations) - CASL ability factory and RBAC guard

**Provides:**
- Tasks CRUD API with filtering and search
- Comments CRUD API with author restrictions
- Activity feed endpoint for project-scoped audit history
- Audit log endpoint for organization-wide admin access
- Kanban status update endpoint for drag-drop
- Organization-scoped task and comment management

**Affects:**
- Phase 2 Plan 10 (Board UI) - will consume tasks endpoints for Kanban board
- Phase 2 Plan 11 (Task UI) - will consume tasks and comments endpoints for task detail view
- Phase 3 (Real-time WebSockets) - will emit events for task/comment mutations

## Key Decisions

1. **Task and comment audit events** - Added 7 new audit actions (TASK_CREATED, TASK_UPDATED, TASK_STATUS_CHANGED, TASK_DELETED, COMMENT_CREATED, COMMENT_UPDATED, COMMENT_DELETED) to AuditAction enum. Tasks and comments are core business entities requiring full audit trail. Status change is separate event because it's high-frequency (Kanban drag-drop) and needs distinct tracking.

2. **Kanban status endpoint** - Separate PATCH /tasks/:id/status endpoint for optimized Kanban drag-drop. Updates status field only (not full task), reducing payload size and database operations. Emits TASK_STATUS_CHANGED event distinct from TASK_UPDATED for analytics and real-time updates.

3. **Author-only comment editing** - Comments can only be edited/deleted by author or ADMIN. Implemented at service layer (not RBAC layer) because it's content ownership, not role-based. Prevents unauthorized modifications while allowing admin moderation.

4. **Admin-only audit log** - Only ADMIN role can access organization-wide audit log via GET /teams/:id/audit-log. Implemented via RBAC check can('manage', 'AuditLog'). Audit logs contain sensitive data (IP addresses, user agents, change history) requiring highest privilege level.

5. **Project activity feed** - Activity feed scoped to project (not organization) for focused task/project history. Returns events for Project, Task, Comment entities belonging to this project only. Paginated with default 20 per page. Available to all project members (same permissions as project read).

6. **Label organization verification** - Labels must belong to same organization as project when assigning to tasks. Prevents cross-tenant data leaks. Implemented via query: find labels where id IN (labelIds) AND organizationId = project.organizationId, verify count matches. Security-critical validation.

## Blockers Encountered

None. Deviations were auto-fixed using established patterns.

## Known Issues (Pre-existing)

1. **rxjs duplication** - Two copies of rxjs cause TypeScript errors in audit.interceptor.ts. Noted in STATE.md from Phase 1 Plan 3 as deferred. Does not affect tasks or comments module functionality.

2. **Activity feed performance** - getProjectActivity performs individual queries to verify each Task/Comment belongs to project. In production, this should be optimized with denormalization (add projectId to Comment model) or database-level filtering. Current implementation is correct but not performant at scale.

## Next Steps

Phase 2 plans can now proceed:
- Plan 10 (Board UI) can consume tasks endpoints for Kanban board with drag-drop status updates
- Plan 11 (Task UI) can consume tasks and comments endpoints for task detail view with comment threads
- Phase 3 (Real-time WebSockets) can emit socket events when tasks/comments are created/updated

All backend requirements for task and comment management are complete:
- ✓ Create tasks with all fields (title, description, due date, priority, status, labels, assignee)
- ✓ Edit any task field
- ✓ Delete tasks
- ✓ Assign tasks to team members
- ✓ Set task priority
- ✓ Set task status (including Kanban drag-drop)
- ✓ Add labels to tasks
- ✓ Add comments to tasks
- ✓ Task history via audit events
- ✓ Activity feed endpoint
- ✓ Audit log endpoint
- ✓ Organization-scoped RBAC
- ✓ Filtering by status, priority, assignee, labels
- ✓ Search by title/description
- ✓ Configurable sorting
- ✓ Pagination
- ✓ Author-only comment editing
- ✓ Admin audit log access

## Self-Check

Verifying all claims in this summary...

### Files Created
- ✓ apps/api/src/modules/tasks/tasks.controller.ts exists
- ✓ apps/api/src/modules/tasks/tasks.service.ts exists
- ✓ apps/api/src/modules/tasks/tasks.module.ts exists
- ✓ apps/api/src/modules/tasks/dto/create-task.dto.ts exists
- ✓ apps/api/src/modules/tasks/dto/update-task.dto.ts exists
- ✓ apps/api/src/modules/comments/comments.controller.ts exists
- ✓ apps/api/src/modules/comments/comments.service.ts exists
- ✓ apps/api/src/modules/comments/comments.module.ts exists

### Files Modified
- ✓ apps/api/src/app.module.ts modified
- ✓ apps/api/src/main.ts modified
- ✓ apps/api/src/modules/teams/teams.controller.ts modified
- ✓ apps/api/src/modules/teams/teams.service.ts modified
- ✓ packages/shared/src/types/enums.ts modified
- ✓ packages/shared/src/types/events.ts modified

### Commits
- ✓ dd0dd97 exists (Task 1: Tasks module)
- ✓ dc23910 exists (Task 2: Comments and activity endpoints)

## Self-Check: PASSED
