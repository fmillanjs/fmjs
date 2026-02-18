---
phase: 18-discussions-reactions
plan: 01
subsystem: database
tags: [prisma, postgres, migration, comment, reaction, self-relation, nullable-fk]

# Dependency graph
requires:
  - phase: 17-content-creation
    provides: Post and Snippet models in schema.prisma that Comment and Reaction FKs reference

provides:
  - Comment model with self-referencing parentId (CommentReplies relation) and nullable postId/snippetId FKs
  - Reaction model with nullable postId/commentId FKs and @@unique constraints per target type
  - Migration 20260218061300_add_comments_reactions applied to devcollab-postgres
  - PrismaService .comment and .reaction getters ready for NestJS service injection

affects: [18-02, 18-03, 18-04, 19-search, 20-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PrismaService one-accessor-per-model pattern extended to comment, reaction
    - prisma migrate diff --from-url for non-interactive migration generation
    - prisma migrate deploy for applying migrations in non-interactive shell

key-files:
  created:
    - packages/devcollab-database/prisma/migrations/20260218061300_add_comments_reactions/migration.sql
  modified:
    - packages/devcollab-database/prisma/schema.prisma
    - apps/devcollab-api/src/core/database/prisma.service.ts

key-decisions:
  - "Comment self-relation uses onDelete: NoAction, onUpdate: NoAction on parentId FK — prevents cascade-delete of replies when parent soft-deleted"
  - "Reaction uses two separate nullable FKs (postId, commentId) not polymorphic targetType/targetId — preserves real referential integrity"
  - "prisma migrate diff --from-url used for migration SQL generation — consistent with Phase 17 approach for non-interactive shells"
  - "Prisma client regenerated after schema change — node_modules/.prisma/devcollab-client must be up to date for TypeScript getters to compile"

patterns-established:
  - "Non-interactive migration: prisma migrate diff --from-url + write migration.sql + prisma migrate deploy"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 18 Plan 01: Discussions + Reactions — Schema + Migration Summary

**Comment and Reaction Prisma models with self-relation, nullable FKs, and @@unique constraints migrated to devcollab-postgres; PrismaService exposes .comment and .reaction getters**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T06:13:06Z
- **Completed:** 2026-02-18T06:15:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added Comment model with parentId self-relation (CommentReplies), postId/snippetId nullable FKs, deletedAt soft-delete field, and five indexes
- Added Reaction model with userId/postId/commentId FKs and two @@unique constraints (per target type) enforcing one-reaction-per-emoji-per-target
- Added back-references (comments/reactions) to User and Post models; comments back-reference to Snippet model
- Applied migration 20260218061300_add_comments_reactions to devcollab-postgres — Comment and Reaction tables confirmed in DB
- Added .comment and .reaction getters to PrismaService; TypeScript compilation passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Comment and Reaction models to schema.prisma + back-references** - `4acef44` (feat)
2. **Task 2: Run migration and add PrismaService getters** - `df6188b` (feat)

## Files Created/Modified
- `packages/devcollab-database/prisma/schema.prisma` - Comment + Reaction models added; User/Post/Snippet back-references added
- `packages/devcollab-database/prisma/migrations/20260218061300_add_comments_reactions/migration.sql` - DDL for both tables with indexes and FK constraints
- `apps/devcollab-api/src/core/database/prisma.service.ts` - .comment and .reaction getters appended after existing .post getter

## Decisions Made
- Used `prisma migrate diff --from-url` for migration SQL generation (non-interactive shell, same pattern as Phase 17)
- Prisma client regenerated after schema change to ensure TypeScript types include Comment and Reaction
- Comment self-relation uses `onDelete: NoAction, onUpdate: NoAction` on parent side to avoid cascade-deleting replies
- Reaction uses separate nullable FKs rather than polymorphic targetType/targetId for real FK integrity

## Deviations from Plan

None - plan executed exactly as written.

The plan specified `prisma migrate dev` but also noted the docker container approach. Since the shell is non-interactive, `prisma migrate diff --from-url` + `prisma migrate deploy` was used — consistent with the established Phase 17 pattern documented in STATE.md decisions.

## Issues Encountered
- `prisma migrate dev` rejected non-interactive environment — resolved by using `prisma migrate diff --from-url` to generate SQL and `prisma migrate deploy` to apply, consistent with Phase 17 established pattern.

## User Setup Required
None - no external service configuration required. Migration runs against the already-running devcollab-postgres container.

## Next Phase Readiness
- Comment and Reaction tables are live in devcollab-postgres
- PrismaService .comment and .reaction getters are ready for injection into Phase 18 NestJS services (Plans 02-04)
- All Phase 18 plans (02: CommentsService, 03: ReactionsService, 04: frontend) can proceed

---
*Phase: 18-discussions-reactions*
*Completed: 2026-02-18*
