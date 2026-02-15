---
phase: 03-real-time-collaboration
plan: 03
subsystem: frontend-real-time-presence-comments
tags: [websocket, presence, real-time-comments, collaboration, ui]
completed: 2026-02-15T05:44:05Z

dependency-graph:
  requires:
    - phase-03-01 (WebSocket infrastructure and Redis adapter)
    - phase-03-02 (WebSocketProvider and real-time task hooks)
  provides:
    - presence tracking showing active users in project rooms
    - real-time comment updates on task detail view
    - task update sync for collaborative editing
  affects:
    - project page header (displays presence indicator)
    - task detail panel (live comment feed and task sync)

tech-stack:
  added: []
  patterns:
    - useProjectPresence hook for active user tracking
    - useRealTimeComments hook for live comment updates
    - Server Component + Client Component wrapper pattern for presence UI
    - Self-update filtering (userId !== currentUserId) to prevent duplicates

key-files:
  created:
    - apps/web/hooks/use-project-presence.ts
    - apps/web/hooks/use-real-time-comments.ts
    - apps/web/components/project/presence-indicator.tsx
    - apps/web/components/project/project-header-client.tsx
  modified:
    - apps/api/src/modules/events/events.gateway.ts
    - apps/web/components/tasks/task-detail-panel.tsx
    - apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx

decisions:
  - presence:request handler uses fetchSockets() API to query active users in room
  - User name fetched from database for all presence events (join/leave/disconnect)
  - Presence indicator shows max 3 avatars with "+N more" overflow indicator
  - Avatar colors rotate through blue/green/orange (NO purple per user constraint)
  - Hide presence indicator when 0 or 1 user (self only) to reduce noise
  - Comments converted to local state in task detail panel for real-time updates
  - Self-update filter prevents duplicate comments when user adds their own
  - Task updates from other users sync to detail panel (title, description, all fields)
  - handleCommentsUpdate refetches from API instead of router.refresh for better UX

metrics:
  duration: 502 seconds (8.4 minutes)
  tasks_completed: 2
  files_created: 4
  files_modified: 3
  commits: 3
---

# Phase 03 Plan 03: Presence Tracking & Real-Time Comments Summary

**One-liner:** Presence indicators showing active users in project rooms and real-time comment updates on task detail view for live collaboration awareness.

## Overview

Implemented presence tracking to show which users are actively viewing a project, and real-time comment updates for live discussion on tasks. Both features enhance collaboration awareness and demonstrate WebSocket capabilities for the portfolio.

**Key achievement:** Users now see who else is working on the same project and receive instant comment updates without refresh, creating a live collaborative experience.

## Tasks Completed

### Task 1: Backend presence tracking + frontend presence indicator
**Commits:** 4c9447a, 5640b18

Added presence:request handler to the WebSocket gateway and created frontend components for displaying active users.

**Backend changes:**
- Added `presence:request` handler using `fetchSockets()` API to get all sockets in project room
- Deduplicates users by userId (handles multiple tabs from same user)
- Fetches user name from database for all presence events
- Enhanced join/leave/disconnect handlers to include `name` field in presence events
- Returns `{ activeUsers, count }` with array of `{ userId, email, name }`

**Frontend changes:**
- Created `useProjectPresence` hook that requests initial presence and listens for join/leave events
- Created `PresenceIndicator` component with overlapping avatar circles
- Avatar colors rotate through blue-500, green-500, orange-500 (NO purple)
- Shows max 3 avatars, then "+N more" badge for overflow
- Displays user count text: "N active users"
- Hides indicator when 0 or 1 user (self only)
- Created `ProjectHeaderClient` wrapper for Server Component integration
- Integrated presence indicator into project page header

**Files:**
- apps/api/src/modules/events/events.gateway.ts
- apps/web/hooks/use-project-presence.ts
- apps/web/components/project/presence-indicator.tsx
- apps/web/components/project/project-header-client.tsx
- apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx

### Task 2: Real-time comment updates hook and task detail integration
**Commit:** cc40052

Created hook for real-time comment updates and integrated into task detail panel for live comment feed.

**Changes:**
- Created `useRealTimeComments` hook listening for comment:created/updated/deleted events
- Filters events by taskId and userId to show only relevant updates from other users
- Self-update filter (`userId !== currentUserId`) prevents duplicate comments
- Converted task detail panel comments from `currentTask.comments` to local state
- Added `useRealTimeComments` integration to task detail panel
- Added `task:updated` listener to sync task changes from other users
- When another user edits task title/description/fields, detail panel updates live
- Updated `handleCommentsUpdate` to refetch from API (cleaner than router.refresh)
- Updated comment count in tab header to use local state

**Files:**
- apps/web/hooks/use-real-time-comments.ts
- apps/web/components/tasks/task-detail-panel.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Presence Tracking Flow
1. User opens project page → ProjectHeaderClient renders
2. PresenceIndicator mounts → useProjectPresence hook subscribes
3. Hook emits `presence:request` with projectId
4. Backend calls `this.server.in('project:X').fetchSockets()`
5. Deduplicates by userId, fetches names from database
6. Returns `{ activeUsers, count }` as acknowledgment callback
7. Hook listens for `presence:join` and `presence:leave` events
8. Updates local state, component re-renders with new count/avatars

### Real-Time Comments Flow
1. User opens task detail → TaskDetailPanel renders
2. Comments converted to local state: `const [comments, setComments] = useState(task.comments)`
3. useRealTimeComments hook subscribes to comment events
4. Another user adds comment → backend emits `comment:created` to project room
5. Hook receives event, filters by taskId and userId
6. If taskId matches and userId differs, adds comment to local state
7. CommentThread re-renders with new comment instantly
8. Same flow for comment:updated (replaces in array) and comment:deleted (filters out)

### Self-Update Prevention
Both presence and comments use `userId !== currentUserId` filter:
- Presence: Current user already knows they're present, no need to add self
- Comments: User who posted comment already sees it optimistically, no need for broadcast update

This prevents duplicate display and infinite loops.

## Verification Results

- TypeScript compilation: PASSED (0 errors in web, 1 known rxjs issue in API)
- presence:request handler: PASSED (line 225 in gateway)
- PresenceIndicator component: PASSED (exists)
- useProjectPresence hook: PASSED (exports)
- useRealTimeComments hook: PASSED (exports)
- No purple color: PASSED (grep returns nothing)
- comment event listeners: PASSED (all 3 events: created/updated/deleted)
- Integration: PASSED (task detail panel uses hook, project page uses indicator)

## Self-Check: PASSED

**Files created:**
- FOUND: apps/web/hooks/use-project-presence.ts
- FOUND: apps/web/hooks/use-real-time-comments.ts
- FOUND: apps/web/components/project/presence-indicator.tsx
- FOUND: apps/web/components/project/project-header-client.tsx

**Files modified:**
- FOUND: apps/api/src/modules/events/events.gateway.ts (presence:request handler)
- FOUND: apps/web/components/tasks/task-detail-panel.tsx (comment state + hooks)
- FOUND: apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx (ProjectHeaderClient)

**Commits:**
- FOUND: 4c9447a (feat(03-03): add presence tracking with backend handler and frontend indicator)
- FOUND: 5640b18 (feat(03-03): add presence:request handler and enhance presence events with name field)
- FOUND: cc40052 (feat(03-03): add real-time comment updates and task sync to detail panel)

## Next Steps

**For Phase 03 Plan 04:**
- Testing real-time features with multiple browser windows
- Verifying presence updates on join/leave/disconnect
- Confirming comment updates appear instantly for other users
- Testing task detail sync when another user edits
- Edge case handling: network reconnection, missed events, etc.
