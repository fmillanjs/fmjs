---
phase: 19-notifications-activity-feed
plan: 01
subsystem: database
tags: [prisma, postgres, casl, notifications, activity-feed]

# Dependency graph
requires:
  - phase: 18-discussions-reactions
    provides: Comment and Reaction Prisma models with back-references this plan extends
provides:
  - Notification Prisma model with recipientId/actorId/commentId/workspaceId relations and compound unique index
  - ActivityEvent Prisma model with ActivityEventType enum, workspaceId+actorId relations
  - Migration SQL applied to devcollab-postgres (Notification + ActivityEvent tables, enum, indexes, FKs)
  - PrismaService.notification and PrismaService.activityEvent getters
  - CASL Subject union extended with Reaction, Notification, ActivityEvent, User
  - Contributor role grants: read/update Notification, read ActivityEvent
affects: 19-02-services, 19-03-api-endpoints, 19-04-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "prisma migrate diff --from-url for live DB diff migration generation (consistent with Phase 17/18)"
    - "psql direct apply + prisma migrate resolve --applied for applying generated SQL"
    - "PrismaService one-accessor-per-model pattern extended to notification and activityEvent"
    - "CASL Subject union extended as new entity types are added"

key-files:
  created:
    - packages/devcollab-database/prisma/migrations/20260218_add_notifications_activity/migration.sql
  modified:
    - packages/devcollab-database/prisma/schema.prisma
    - apps/devcollab-api/src/core/database/prisma.service.ts
    - apps/devcollab-api/src/workspaces/workspace-ability.factory.ts

key-decisions:
  - "ActivityEventType is a Prisma enum (MemberJoined, PostCreated, PostUpdated, SnippetCreated, SnippetUpdated) — typed constraint at DB level"
  - "entityType on ActivityEvent is String not enum — stores 'Post', 'Snippet', 'User' as plain string for future flexibility"
  - "Notification @@unique([recipientId, actorId, commentId, type]) — prevents duplicate notifications at DB level"
  - "prisma migrate diff --from-url + direct psql apply + prisma migrate resolve --applied — consistent with Phase 17/18 migration pattern"
  - "Subject union now includes Reaction and User (were missing before) — safe to add, guard type cast on casl-auth.guard.ts line 73 accepts them"

patterns-established:
  - "PrismaService getter pattern: one get per model, returns this.client.[model] directly"
  - "CASL Subject union: extend with new model names when adding new Prisma models"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03, FEED-01]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 19 Plan 01: Notifications + Activity Feed Database Foundation Summary

**Prisma Notification and ActivityEvent models migrated to devcollab-postgres with PrismaService getters and CASL Subject union extended to include Notification, ActivityEvent, Reaction, and User**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T08:09:31Z
- **Completed:** 2026-02-18T08:11:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added Notification model (7 fields, 3 indexes, compound unique, FKs to User x2, Comment, Workspace)
- Added ActivityEvent model (6 fields, ActivityEventType enum, 2 indexes, FKs to Workspace and User)
- Added back-references on User (notificationsReceived, notificationsSent, activityEvents), Comment (notifications), Workspace (notifications, activityEvents)
- Applied migration to devcollab-postgres directly; marked as applied in _prisma_migrations with migrate resolve
- Regenerated Prisma client with new Notification and ActivityEvent types
- Extended CASL Subject union (Reaction, Notification, ActivityEvent, User added); Contributor granted read/update Notification and read ActivityEvent

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Notification + ActivityEvent models to schema.prisma** - `75eab9d` (feat)
2. **Task 2: Generate migration, apply, regenerate client, PrismaService getters, CASL Subject** - `afc764a` (feat)

**Plan metadata:** committed with docs commit after summary creation

## Files Created/Modified
- `packages/devcollab-database/prisma/schema.prisma` - Added ActivityEventType enum, Notification model, ActivityEvent model, back-references on User/Comment/Workspace
- `packages/devcollab-database/prisma/migrations/20260218_add_notifications_activity/migration.sql` - DDL for Notification table, ActivityEvent table, ActivityEventType enum, all indexes, all FK constraints
- `apps/devcollab-api/src/core/database/prisma.service.ts` - Added .notification and .activityEvent getters
- `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` - Extended Subject union with Reaction, Notification, ActivityEvent, User; added Contributor grants for new subjects

## Decisions Made
- Applied migration directly via psql (same pattern as Phase 17/18) then used `prisma migrate resolve --applied` to register in _prisma_migrations table — database schema and migration tracking now in sync
- entityType on ActivityEvent is String (not enum) — plan explicitly specified this for flexibility
- Added Reaction and User to Subject union (they were missing) — cleanup that prevents future TypeScript errors in guard type casts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `prisma validate` fails without DEVCOLLAB_DATABASE_URL set (env var not in .env). Fixed by passing the env var inline for validate/generate/status commands.
- `prisma migrate status` showed migration unapplied after direct psql apply — expected behavior. Used `prisma migrate resolve --applied` to register the migration, bringing status to "Database schema is up to date!".

## User Setup Required

None - no external service configuration required. devcollab-postgres was already running.

## Next Phase Readiness
- Notification and ActivityEvent Prisma types are ready for NestJS services (Plan 02)
- PrismaService exposes .notification and .activityEvent for injection into services
- CASL guard will accept 'Notification' and 'ActivityEvent' as Subject values in @CheckAbility decorators
- No blockers — Plan 02 can begin immediately

## Self-Check: PASSED

- FOUND: packages/devcollab-database/prisma/schema.prisma
- FOUND: packages/devcollab-database/prisma/migrations/20260218_add_notifications_activity/migration.sql
- FOUND: apps/devcollab-api/src/core/database/prisma.service.ts
- FOUND: apps/devcollab-api/src/workspaces/workspace-ability.factory.ts
- FOUND: .planning/phases/19-notifications-activity-feed/19-01-SUMMARY.md
- FOUND commit: 75eab9d (feat(19-01): add Notification + ActivityEvent models to schema.prisma)
- FOUND commit: afc764a (feat(19-01): migrate, regenerate client, add PrismaService getters, extend CASL Subject)

---
*Phase: 19-notifications-activity-feed*
*Completed: 2026-02-18*
