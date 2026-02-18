---
phase: 16-workspaces-membership-rbac
plan: "03"
subsystem: workspaces
tags: [workspaces, rbac, nestjs, prisma, invite-links, last-admin-protection]
dependency_graph:
  requires:
    - 16-01  # Prisma schema: Workspace, WorkspaceMember, InviteLink models
    - 16-02  # WorkspaceAbilityFactory, CaslAuthGuard, WorkspacesModule skeleton
  provides:
    - WorkspacesService (all workspace business logic)
    - WorkspacesController (8 REST endpoints)
    - 3 DTOs (create, join, update-role)
    - Updated WorkspacesModule (controller + service registered)
  affects:
    - apps/devcollab-api/src/workspaces/
tech_stack:
  added: []
  patterns:
    - NestJS route ordering: static segments before dynamic (:slug) to prevent routing collision
    - Last-admin protection: count admins before demote/remove, throw BadRequestException if 1
    - Single-use invite link: mark usedAt before membership creation
    - Auto-slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    - Prisma P2002 unique violation caught and re-thrown as ConflictException
key_files:
  created:
    - apps/devcollab-api/src/workspaces/dto/create-workspace.dto.ts
    - apps/devcollab-api/src/workspaces/dto/join-workspace.dto.ts
    - apps/devcollab-api/src/workspaces/dto/update-member-role.dto.ts
    - apps/devcollab-api/src/workspaces/workspaces.service.ts
    - apps/devcollab-api/src/workspaces/workspaces.controller.ts
  modified:
    - apps/devcollab-api/src/workspaces/workspaces.module.ts
decisions:
  - "POST /workspaces/join declared before GET /workspaces/:slug — NestJS resolves routes top-to-bottom, static segments must precede dynamic"
  - "JwtPayload imported from current-user.decorator.ts in controller — avoids local redefinition, keeps single source of truth"
  - "DTO properties use ! definite assignment assertion (e.g., name!: string) — matches project strict TS pattern established in auth DTOs"
metrics:
  duration: "~2 minutes"
  completed: "2026-02-18"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 16 Plan 03: WorkspacesService, WorkspacesController, and DTOs Summary

**One-liner:** WorkspacesController (8 CASL-guarded endpoints) + WorkspacesService (create/invite/join/manage) with last-admin protection and 72-hour single-use invite links.

## What Was Built

Implemented the functional workspace layer: creating workspaces, generating and consuming invite links, managing members, and enforcing last-admin protection.

### Task 1: DTOs and WorkspacesService (commit 2223ea3)

Three DTOs created:
- `CreateWorkspaceDto` — `name!: string`, optional `slug?` (auto-generated from name if absent)
- `JoinWorkspaceDto` — `token!: string` for invite link consumption
- `UpdateMemberRoleDto` — `role!: 'Admin' | 'Contributor' | 'Viewer'`

WorkspacesService methods:
- `create()` — auto-slug generation, nested member create with Admin role, P2002 → ConflictException
- `findAll()` — returns workspaces where user is a member
- `findOne()` — by slug, includes member + user data, throws NotFoundException if absent
- `generateInviteLink()` — UUID token, 72-hour expiry via `Date.now() + 72 * 60 * 60 * 1000`
- `joinWorkspace()` — validates not used, not expired; marks usedAt; creates Contributor membership
- `listMembers()` — returns members with user details
- `updateMemberRole()` — last-admin protection: counts admins before demoting an Admin
- `removeMember()` — last-admin protection: counts admins before removing an Admin

### Task 2: WorkspacesController and WorkspacesModule update (commit e0d3e21)

WorkspacesController with 8 endpoints, all decorated with `@CheckAbility`:

| Method | Route | Ability | Requirement |
|--------|-------|---------|-------------|
| POST | /workspaces | create Workspace | WORK-01 |
| GET | /workspaces | read Workspace | WORK-01 |
| POST | /workspaces/join | create WorkspaceMember | WORK-03 |
| GET | /workspaces/:slug | read Workspace | WORK-01 |
| POST | /workspaces/:slug/invite-links | create InviteLink | WORK-02 |
| GET | /workspaces/:slug/members | read WorkspaceMember | WORK-04 |
| PATCH | /workspaces/:slug/members/:userId/role | update WorkspaceMember | RBAC-01 |
| DELETE | /workspaces/:slug/members/:userId | delete WorkspaceMember | WORK-04/05 |

WorkspacesModule updated to register WorkspacesController and WorkspacesService.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DTO definite assignment assertions required by strict TypeScript**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** DTO class properties without initializers caused TS2564 errors under strictPropertyInitialization
- **Fix:** Added `!` assertion to required properties (`name!`, `token!`, `role!`) matching the pattern in `auth/dto/signup.dto.ts`
- **Files modified:** All three DTOs
- **Commit:** 2223ea3

**2. [Rule 1 - DRY] Used exported JwtPayload from current-user.decorator.ts**
- **Found during:** Task 2 implementation
- **Issue:** Plan defined a local `interface JwtPayload` in the controller; this type already exists and is exported from `current-user.decorator.ts`
- **Fix:** Imported `JwtPayload` from `'../common/decorators/current-user.decorator'` instead of redeclaring locally
- **Files modified:** `workspaces.controller.ts`
- **Commit:** e0d3e21

## Verification Results

1. TypeScript: `tsc --noEmit` exits 0
2. Controller has 8 `@CheckAbility` decorators (grep -c output: 8)
3. POST join (line 38) before GET :slug (line 45) — confirmed
4. Last-admin protection strings present in service
5. Module updated with WorkspacesController and WorkspacesService

## Self-Check: PASSED

All 5 created files verified present on disk. Both task commits (2223ea3, e0d3e21) confirmed in git log. TypeScript compilation exits 0.
