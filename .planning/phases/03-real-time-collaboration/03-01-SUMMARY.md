---
phase: 03-real-time-collaboration
plan: 01
subsystem: backend-websocket-infrastructure
tags: [websocket, redis, real-time, event-broadcasting, pub-sub]
completed: 2026-02-15T05:32:45Z

dependency-graph:
  requires:
    - phase-02 (EventEmitter2 audit events from tasks/comments services)
    - redis container running
    - postgres container running
  provides:
    - redis-backed WebSocket gateway for horizontal scaling
    - project room management with membership verification
    - event listeners bridging EventEmitter2 to WebSocket broadcasts
    - version field on Task model for optimistic concurrency
  affects:
    - all future real-time features (depend on this broadcasting infrastructure)
    - frontend WebSocket client implementation (next plan)

tech-stack:
  added:
    - "@socket.io/redis-adapter": "^8.3.0"
  patterns:
    - Redis pub/sub adapter for multi-instance Socket.IO broadcasting
    - EventEmitter2 bridge to WebSocket (dual listeners on same events)
    - Project-based room isolation with membership verification
    - Version field for optimistic concurrency control

key-files:
  created:
    - apps/api/src/modules/events/dto/ws-events.dto.ts
    - apps/api/src/modules/events/listeners/task.listener.ts
    - apps/api/src/modules/events/listeners/comment.listener.ts
  modified:
    - apps/api/src/modules/events/events.gateway.ts
    - apps/api/src/modules/events/events.module.ts
    - apps/api/src/modules/tasks/tasks.service.ts
    - apps/api/src/modules/comments/comments.service.ts
    - packages/database/prisma/schema.prisma
    - packages/shared/src/types/events.ts
    - packages/shared/src/types/task.ts

decisions:
  - Redis adapter with two ioredis clients (pub/sub) for horizontal scaling
  - Project-level room isolation (project:projectId) instead of task-level for efficiency
  - Membership verification on join:project to prevent unauthorized room access
  - Version field on Task model increments on update/status change for conflict detection
  - Extended TaskEvent and CommentEvent interfaces with optional projectId/taskId/task/comment fields
  - Event listeners are ADDITIONAL to existing audit listener (dual listeners pattern)
  - Presence events (presence:join, presence:leave) for user awareness features

metrics:
  duration: 375 seconds (6.3 minutes)
  tasks_completed: 2
  files_created: 3
  files_modified: 8
  commits: 2
---

# Phase 03 Plan 01: WebSocket Broadcasting Infrastructure Summary

**One-liner:** Redis-backed WebSocket gateway with project room management and event listeners bridging EventEmitter2 audit events to real-time broadcasts for tasks and comments.

## Overview

Set up the complete backend WebSocket broadcasting infrastructure for real-time collaboration. Configured Socket.IO with Redis pub/sub adapter for horizontal scaling, implemented project-based room management with membership verification, and created event listeners that bridge existing EventEmitter2 audit events to WebSocket broadcasts.

**Key achievement:** All real-time features can now be built on this broadcasting pipeline — service emits event -> EventEmitter2 -> listener catches -> broadcasts to project room via Redis-backed Socket.IO.

## Tasks Completed

### Task 1: Redis Adapter and Project Room Management
**Commit:** 6e4f102

Installed @socket.io/redis-adapter and configured the WebSocket gateway with Redis pub/sub for horizontal scaling. Implemented project room join/leave handlers with membership verification.

**Changes:**
- Installed @socket.io/redis-adapter package
- Added Redis adapter initialization in `afterInit()` using two ioredis clients (pub/sub)
- Implemented `join:project` handler with membership verification via PrismaService
- Implemented `leave:project` handler
- Added presence:join and presence:leave events for user awareness
- Updated handleDisconnect to emit presence:leave for all joined project rooms
- Created WsTaskEvent, WsCommentEvent, WsPresenceEvent DTOs
- Added version field to TaskBase type in shared types
- Exported EventsGateway from EventsModule for listener injection

**Files:**
- apps/api/src/modules/events/events.gateway.ts
- apps/api/src/modules/events/events.module.ts
- apps/api/src/modules/events/dto/ws-events.dto.ts (created)
- packages/shared/src/types/events.ts
- packages/shared/src/types/task.ts
- apps/api/package.json
- package-lock.json

### Task 2: Event Listeners and Version Tracking
**Commit:** 5456b61

Added version field to Task model in database, updated services to increment version on updates, and created event listeners that bridge EventEmitter2 events to WebSocket broadcasts.

**Changes:**
- Added `version Int @default(0)` field to Task model in Prisma schema
- Ran `prisma db push` to sync database schema
- Updated tasks service to increment version on `update()` and `updateStatus()`
- Extended TaskEvent and CommentEvent interfaces with optional projectId, taskId, task, comment fields
- Updated tasks service to include projectId and full task object in all event emissions
- Updated comments service to include projectId, taskId, and full comment object in all event emissions
- Created TaskListener with 4 handlers: task.created, task.updated, task.status_changed, task.deleted
- Created CommentListener with 3 handlers: comment.created, comment.updated, comment.deleted
- Registered TaskListener and CommentListener in EventsModule providers

**Files:**
- packages/database/prisma/schema.prisma
- apps/api/src/modules/tasks/tasks.service.ts
- apps/api/src/modules/comments/comments.service.ts
- apps/api/src/modules/events/listeners/task.listener.ts (created)
- apps/api/src/modules/events/listeners/comment.listener.ts (created)
- apps/api/src/modules/events/events.module.ts
- packages/shared/src/types/events.ts

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Redis Adapter Configuration
```typescript
afterInit(server: Server) {
  const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
  const subClient = pubClient.duplicate();
  server.adapter(createAdapter(pubClient, subClient));
}
```

### Project Room Management
- Clients join rooms via `join:project` message with projectId
- Membership verification checks userId_organizationId composite key
- Unauthorized join attempts return error event
- Disconnect automatically emits presence:leave to all joined rooms

### Event Flow Architecture
1. User action (create/update/delete task or comment)
2. Service method executes business logic
3. Service emits EventEmitter2 event with projectId/taskId in event payload
4. TWO listeners receive the event:
   - AuditListener: Persists to audit_log table (existing from Phase 2)
   - TaskListener/CommentListener: Broadcasts via WebSocket to project room (new in Phase 3)
5. All clients in `project:${projectId}` room receive the WebSocket event

### Version Field Purpose
- Enables optimistic concurrency control for task updates
- Increments on every update/status change
- Frontend can detect conflicts by comparing version numbers
- Will be used in Phase 3 conflict resolution (next plans)

## Verification Results

- TypeScript compilation: PASSED (0 errors excluding known rxjs duplicate issue)
- Redis adapter installed: PASSED (@socket.io/redis-adapter@8.3.0 in node_modules)
- Gateway contains createAdapter, join:project, leave:project: PASSED
- Event listeners registered: PASSED (7 @OnEvent handlers total)
- Version field in schema: PASSED (`version Int @default(0)`)
- Database sync: PASSED (prisma db push succeeded)

## Self-Check: PASSED

**Files created:**
- FOUND: apps/api/src/modules/events/dto/ws-events.dto.ts
- FOUND: apps/api/src/modules/events/listeners/task.listener.ts
- FOUND: apps/api/src/modules/events/listeners/comment.listener.ts

**Files modified:**
- FOUND: apps/api/src/modules/events/events.gateway.ts (contains afterInit, join:project, leave:project)
- FOUND: apps/api/src/modules/events/events.module.ts (exports EventsGateway, includes listeners)
- FOUND: apps/api/src/modules/tasks/tasks.service.ts (version increment, projectId in events)
- FOUND: apps/api/src/modules/comments/comments.service.ts (projectId/taskId in events)
- FOUND: packages/database/prisma/schema.prisma (version field)
- FOUND: packages/shared/src/types/events.ts (WS event types)
- FOUND: packages/shared/src/types/task.ts (version in TaskBase)

**Commits:**
- FOUND: 6e4f102 (feat(03-01): configure Redis adapter and project room management)
- FOUND: 5456b61 (feat(03-01): add WebSocket event listeners and version tracking)

## Next Steps

**For Phase 03 Plan 02:**
- Create frontend WebSocket client hook
- Implement project room auto-join on project page mount
- Add real-time task updates to Kanban board
- Add real-time comment updates to task detail view
- Handle version conflicts on optimistic updates
