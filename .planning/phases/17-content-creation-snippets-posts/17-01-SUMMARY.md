---
phase: 17-content-creation-snippets-posts
plan: 01
subsystem: database-schema, prisma-service, rbac
tags: [prisma, migration, casl, snippet, post, rbac]
dependency_graph:
  requires: [phase-16-workspaces-membership-rbac]
  provides: [Snippet model, Post model, PrismaService.snippet, PrismaService.post, Contributor delete ability]
  affects: [17-02, 17-03, 17-04, 17-05]
tech_stack:
  added: [PostStatus enum]
  patterns: [one-accessor-per-model PrismaService pattern extended, owner-check deferred to service layer]
key_files:
  created:
    - packages/devcollab-database/prisma/migrations/20260218041400_add_snippet_post/migration.sql
  modified:
    - packages/devcollab-database/prisma/schema.prisma
    - apps/devcollab-api/src/core/database/prisma.service.ts
    - apps/devcollab-api/src/workspaces/workspace-ability.factory.ts
decisions:
  - "Migration applied via prisma migrate deploy locally against devcollab-postgres on port 5435 (container running, no devcollab-api/migrate containers needed)"
  - "Migration SQL generated with prisma migrate diff --from-url (live DB diff) — exact DDL, no drift"
  - "Owner-only (authorId) enforcement explicitly deferred to service layer — CASL guard grants delete to Contributor unconditionally, service throws ForbiddenException if not author"
metrics:
  duration: 2 min
  completed: 2026-02-18
  tasks_completed: 3
  files_modified: 4
---

# Phase 17 Plan 01: Prisma Schema Extension and RBAC Fix Summary

Prisma schema extended with Snippet and Post models, migration applied to devcollab-postgres Docker container, PrismaService getters added, and WorkspaceAbilityFactory updated to grant Contributor delete access on own content types.

## What Was Built

### Task 1: Prisma Schema Extension
Added PostStatus enum (Draft, Published), Snippet model (title, language, code, authorId, workspaceId, timestamps with GIN-free indexes), and Post model (title, content, status, publishedAt, authorId, workspaceId, timestamps with composite `workspaceId+status` index). Added back-references `User.snippets[]`, `User.posts[]`, `Workspace.snippets[]`, `Workspace.posts[]` to satisfy Prisma's bidirectional relation requirement.

### Task 2: Migration and PrismaService Getters
Generated migration SQL using `prisma migrate diff --from-url` against the live devcollab-postgres container (port 5435). Applied with `prisma migrate deploy` — all 3 migrations now complete. Regenerated Prisma client (`node_modules/.prisma/devcollab-client`). Added `get snippet()` and `get post()` typed getters to PrismaService following the established one-accessor-per-model pattern.

### Task 3: WorkspaceAbilityFactory Fix
Added `can('delete', 'Post')`, `can('delete', 'Snippet')`, `can('delete', 'Comment')` to the Contributor branch. The previous implementation only had `create` and `update` for these types — missing `delete` would have caused 403 errors on all Contributor delete operations in Plans 02+. Updated the deferred-phase comment to reflect that owner-only enforcement (authorId check) lives in the service layer, not in CASL conditions. Viewer branch unchanged (already denies all mutations via `cannot('create'/'update'/'delete', 'all')`).

## Verification Results

1. `schema.prisma` contains PostStatus enum, Snippet model, Post model — confirmed
2. `prisma validate` reports no errors — confirmed
3. Database has `snippet` and `post` tables (migration applied) — confirmed via `\dt`
4. `PrismaService` has `get snippet()` and `get post()` getters — confirmed
5. `workspace-ability.factory.ts` Contributor block includes `can('delete', 'Snippet')` and `can('delete', 'Post')` — confirmed
6. `npx tsc --noEmit` in devcollab-api succeeds — confirmed (zero errors)

## Decisions Made

- Migration applied via `prisma migrate deploy` locally against devcollab-postgres on port 5435 — container already running, no need to start devcollab-api or devcollab-migrate containers for this task.
- Migration SQL generated with `prisma migrate diff --from-url` (live DB diff) — produces exact DDL matching current DB state, no drift risk.
- Owner-only (authorId) enforcement deferred to service layer — CASL guard grants delete to Contributor unconditionally; service fetches record and throws `ForbiddenException` if requester is not the author. This is the same pattern chosen in Phase 16 for Contributor update.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | c623b8c | feat(17-01): extend Prisma schema with Snippet and Post models |
| 2 | 833f473 | feat(17-01): run add-snippet-post migration and extend PrismaService getters |
| 3 | 43a16a0 | feat(17-01): fix WorkspaceAbilityFactory — add Contributor delete on Post, Snippet, Comment |

## Self-Check: PASSED

- FOUND: packages/devcollab-database/prisma/schema.prisma
- FOUND: packages/devcollab-database/prisma/migrations/20260218041400_add_snippet_post/migration.sql
- FOUND: apps/devcollab-api/src/core/database/prisma.service.ts
- FOUND: apps/devcollab-api/src/workspaces/workspace-ability.factory.ts
- FOUND commit c623b8c: feat(17-01): extend Prisma schema with Snippet and Post models
- FOUND commit 833f473: feat(17-01): run add-snippet-post migration and extend PrismaService getters
- FOUND commit 43a16a0: feat(17-01): fix WorkspaceAbilityFactory — add Contributor delete on Post, Snippet, Comment
