---
phase: 02-core-work-management
plan: 01
subsystem: data-foundation
tags: [prisma, database, types, validation, schema]
dependency-graph:
  requires: [01-02-database-setup, 01-04-nextauth]
  provides: [work-management-models, work-management-types, work-management-validators]
  affects: [all-phase-2-plans]
tech-stack:
  added: []
  patterns: [composite-unique-constraints, cascade-delete, implicit-m2m]
key-files:
  created:
    - packages/shared/src/types/team.ts
    - packages/shared/src/types/project.ts
    - packages/shared/src/types/task.ts
    - packages/shared/src/validators/team.schema.ts
    - packages/shared/src/validators/project.schema.ts
    - packages/shared/src/validators/task.schema.ts
  modified:
    - packages/database/prisma/schema.prisma
    - packages/shared/src/types/enums.ts
    - packages/shared/src/types/index.ts
    - packages/shared/src/validators/index.ts
decisions:
  - slug-based-organization-urls: "Use slug field for user-friendly URLs instead of CUID IDs"
  - composite-unique-constraints: "Prevent duplicate memberships (userId + organizationId) and duplicate project names per org"
  - position-field-for-ordering: "Task.position enables drag-drop reordering within Kanban columns"
  - cascade-delete-behavior: "Deleting organization/project/task cascades to related entities to maintain referential integrity"
  - implicit-m2m-for-labels: "Prisma implicit many-to-many between Task and Label (auto-creates _LabelToTask table)"
  - task-creator-vs-assignee: "Separate createdBy and assignee fields to track ownership vs responsibility"
metrics:
  duration: 165
  completed: 2026-02-15T03:34:44Z
---

# Phase 2 Plan 1: Data Foundation for Work Management Summary

Database models, shared types, and Zod validators for Organizations, Projects, Tasks, Labels, and Comments - foundation for all Phase 2 work management features.

## Execution Report

**Status:** Complete ✓
**Tasks completed:** 2/2
**Duration:** 2.8 minutes

### Task Breakdown

| Task | Name                                      | Status | Commit  |
| ---- | ----------------------------------------- | ------ | ------- |
| 1    | Add Prisma models for work management     | ✓      | ad0805c |
| 2    | Create shared types and Zod validators    | ✓      | f41c92f |

## What Was Built

### Database Schema (Prisma)

Added 6 new models to `packages/database/prisma/schema.prisma`:

**Enums:**
- `ProjectStatus`: ACTIVE, ARCHIVED
- `TaskStatus`: TODO, IN_PROGRESS, DONE, BLOCKED
- `TaskPriority`: LOW, MEDIUM, HIGH, URGENT

**Models:**

1. **Organization** - Top-level team entity
   - Fields: id, name, slug (unique), createdAt, updatedAt
   - Relations: members (Membership[]), projects (Project[]), labels (Label[])
   - Indexes: slug

2. **Membership** - User-Organization relationship
   - Fields: id, role (UserRole), userId, organizationId, joinedAt
   - Composite unique: (userId, organizationId) - prevents duplicate memberships
   - Indexes: userId, organizationId

3. **Project** - Work containers within organizations
   - Fields: id, name, description, status, organizationId, createdAt, updatedAt
   - Composite unique: (organizationId, name) - prevents duplicate project names per org
   - Indexes: organizationId, status
   - Cascade delete when organization deleted

4. **Task** - Core work items
   - Fields: id, title, description, status, priority, dueDate, position, projectId, assigneeId, createdById, createdAt, updatedAt
   - Relations: project (cascade), assignee (set null), createdBy, labels (m2m), comments
   - Indexes: projectId, assigneeId, createdById, status, priority, dueDate, createdAt
   - Composite index: (projectId, status) for efficient Kanban queries
   - `position` field enables drag-drop ordering within status columns

5. **Label** - Reusable tags for tasks
   - Fields: id, name, color (default #64748b), organizationId
   - Composite unique: (organizationId, name) - prevents duplicate labels per org
   - Implicit many-to-many with Task (Prisma creates _LabelToTask join table)
   - Cascade delete when organization deleted

6. **Comment** - Task discussions
   - Fields: id, content, taskId, authorId, createdAt, updatedAt
   - Indexes: taskId, authorId, createdAt
   - Cascade delete when task deleted

**User Model Updates:**
- Added relations: memberships, assignedTasks (@relation("TaskAssignee")), createdTasks (@relation("TaskCreator")), comments

### Shared Types (TypeScript)

Created comprehensive type definitions in `packages/shared/src/types/`:

**team.ts:**
- `OrganizationBase` - Base organization fields
- `MembershipBase` - Base membership fields
- `TeamMember` - Membership with populated user data
- `OrganizationWithMembers` - Organization with member list

**project.ts:**
- `ProjectBase` - Base project fields
- `ProjectWithTaskCount` - Project with task count aggregate

**task.ts:**
- `LabelBase` - Base label fields
- `CommentBase` - Base comment fields
- `CommentWithAuthor` - Comment with populated author
- `TaskBase` - Base task fields
- `TaskWithRelations` - Task with assignee, labels, comment count (for list views)
- `TaskDetail` - Full task with assignee, labels, comments, createdBy (for detail views)

**enums.ts additions:**
- `ProjectStatus` enum and type
- `TaskStatus` enum and type
- `TaskPriority` enum and type

### Zod Validators

Created validation schemas in `packages/shared/src/validators/`:

**team.schema.ts:**
- `createTeamSchema` - name (2-50 chars, trimmed)
- `inviteMemberSchema` - email, role (default MEMBER)

**project.schema.ts:**
- `createProjectSchema` - name (2-100 chars), description (optional, max 2000)
- `updateProjectSchema` - all fields optional (partial)

**task.schema.ts:**
- `createTaskSchema` - title (1-200 chars), description, status (default TODO), priority (default MEDIUM), dueDate, assigneeId, labelIds, projectId
- `updateTaskSchema` - partial of createTaskSchema, excluding projectId (can't change project)
- `updateTaskStatusSchema` - status only (for drag-drop Kanban updates)
- `createCommentSchema` - content (1-5000 chars)

All validators export inferred TypeScript types using `z.infer`.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification steps passed:

1. ✓ `npx prisma db push` succeeded - database synced with schema
2. ✓ All 6 new models exist in database (Organization, Membership, Project, Task, Label, Comment)
3. ✓ Implicit m2m join table `_LabelToTask` created automatically by Prisma
4. ✓ `npx tsc --noEmit` passes in packages/shared - no TypeScript errors
5. ✓ New types and validators are importable from `@repo/shared`

## Dependencies

**Requires:**
- Phase 1 Plan 2 (Database setup) - Postgres + Prisma configured
- Phase 1 Plan 4 (NextAuth) - User model already exists

**Provides:**
- Database models for all Phase 2 features
- Shared types for API contracts and frontend UI
- Validation schemas for all CRUD operations

**Affects:**
- All Phase 2 plans depend on these models
- Backend API plans (02-02, 02-03, 02-04, 02-05, 02-07) will use these validators
- Frontend UI plans (02-08, 02-09, 02-10) will use these types

## Key Decisions

1. **Slug-based organization URLs** - Organizations have a `slug` field (unique, indexed) for user-friendly URLs (`/org/acme-corp` instead of `/org/clxyz123`). Frontend will need slug generation logic.

2. **Composite unique constraints** - Prevents data integrity issues:
   - User can't join same organization twice
   - Organization can't have duplicate project names
   - Organization can't have duplicate label names

3. **Task position field** - `position: Int @default(0)` enables drag-drop reordering within Kanban status columns. Backend will need to handle position updates on status changes.

4. **Cascade delete behavior** - Deleting organization cascades to projects, tasks, labels. Deleting project cascades to tasks. Deleting task cascades to comments. This maintains referential integrity but requires confirmation UIs to prevent accidental data loss.

5. **Implicit many-to-many for labels** - Prisma automatically creates `_LabelToTask` join table. Simpler than explicit junction model but less flexible if we later need metadata on the relationship (e.g., when label was applied).

6. **Separate task creator and assignee** - `createdById` tracks who created the task, `assigneeId` tracks who's responsible. Both are useful for audit trails and filtering.

## Blockers Encountered

None.

## Next Steps

Phase 2 plans can now proceed:
- Plan 2: Team/Org CRUD endpoints can use Membership/Organization models
- Plan 3: Project CRUD endpoints can use Project model
- Plan 4: Task CRUD endpoints can use Task model
- Plan 5: Comments/Labels endpoints can use Comment/Label models

All plans have access to:
- TypeScript types from `@repo/shared/types`
- Zod validators from `@repo/shared/validators`
- Prisma models from `@repo/database`

## Self-Check

Verifying all claims in this summary...

### Files Created
- ✓ packages/shared/src/types/team.ts exists
- ✓ packages/shared/src/types/project.ts exists
- ✓ packages/shared/src/types/task.ts exists
- ✓ packages/shared/src/validators/team.schema.ts exists
- ✓ packages/shared/src/validators/project.schema.ts exists
- ✓ packages/shared/src/validators/task.schema.ts exists

### Files Modified
- ✓ packages/database/prisma/schema.prisma modified
- ✓ packages/shared/src/types/enums.ts modified
- ✓ packages/shared/src/types/index.ts modified
- ✓ packages/shared/src/validators/index.ts modified

### Commits
- ✓ ad0805c exists (Task 1: Prisma models)
- ✓ f41c92f exists (Task 2: Types and validators)

## Self-Check: PASSED
