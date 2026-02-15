---
phase: 03-real-time-collaboration
plan: 02
subsystem: frontend-real-time-integration
tags: [websocket, react, real-time, optimistic-ui, hooks, presence]
completed: 2026-02-15T05:39:41Z

dependency-graph:
  requires:
    - phase-03-01 (WebSocket broadcasting infrastructure)
    - next-auth session for user identification
    - existing Kanban board and task views
  provides:
    - WebSocket provider managing connection lifecycle
    - Real-time task updates in Kanban board and list views
    - Connection status indicator
    - User presence tracking in projects
  affects:
    - all future real-time frontend features (comments, notifications)
    - task management UX (instant updates without refresh)

tech-stack:
  added:
    - socket.io-client (already installed, now integrated)
  patterns:
    - React Context for WebSocket connection sharing
    - Custom hooks for real-time event subscriptions
    - Event filtering by userId to prevent self-update loops
    - Reconnection with data refetch for consistency

key-files:
  created:
    - apps/web/providers/websocket-provider.tsx
    - apps/web/hooks/use-websocket.ts
    - apps/web/hooks/use-real-time-tasks.ts
    - apps/web/hooks/use-project-presence.ts
    - apps/web/components/project/connection-status.tsx
    - apps/web/components/project/project-header-client.tsx
    - apps/web/components/project/presence-indicator.tsx
  modified:
    - apps/web/lib/websocket.ts
    - apps/web/app/(dashboard)/layout.tsx
    - apps/web/components/tasks/task-views.tsx

decisions:
  - WebSocket provider wraps dashboard layout (authenticated pages only)
  - Session fetch via /api/auth/session for JWT token in provider
  - Real-time integration in TaskViews component (parent of both board and list)
  - Event filtering by currentUserId prevents infinite loops from self-updates
  - Reconnection triggers full task refetch to reconcile missed events
  - Connection status shows Live/Offline with green/gray dot
  - Presence tracking shows active users with avatars (reusing Phase 3 work)

metrics:
  duration: 234 seconds (3.9 minutes)
  tasks_completed: 2
  files_created: 7
  files_modified: 3
  commits: 2
---

# Phase 03 Plan 02: Frontend Real-Time Task Updates Summary

**One-liner:** WebSocket provider with real-time task hooks integrated into Kanban board and list views, enabling instant task updates from other users without page refresh.

## Overview

Built the complete frontend real-time task update system. Created a WebSocket provider for connection management, a custom hook for real-time task state updates, and integrated it into the task views so users see live changes from other users without page refresh. Added connection status indicator and user presence tracking.

**Key achievement:** Users now see tasks appear, move, change, and disappear in real-time as other users interact with the project. Demonstrates React 19 useOptimistic with WebSocket synchronization.

## Tasks Completed

### Task 1: Create WebSocket provider and real-time task hooks
**Commit:** 26a8a33

Created the WebSocket connection management infrastructure and custom hooks for real-time task updates.

**Changes:**
- Updated websocket.ts to log reconnection events
- Created WebSocketProvider managing connection lifecycle with JWT auth from session
- Created useWebSocket convenience hook for accessing socket from context
- Created useRealTimeTasks hook with event listeners for task:created, task:updated, task:status_changed, task:deleted
- Implemented event filtering by userId to prevent self-update loops
- Added reconnection handler that refetches all tasks to reconcile missed events
- Proper cleanup with socket.off for all event listeners

**Files:**
- apps/web/lib/websocket.ts (modified)
- apps/web/providers/websocket-provider.tsx (created)
- apps/web/hooks/use-websocket.ts (created)
- apps/web/hooks/use-real-time-tasks.ts (created)

**Technical Details:**
```typescript
// Provider fetches session and initializes socket on mount
const session = await fetch('/api/auth/session').then((r) => r.json());
const ws = getSocket(token);

// Hook filters events by userId to prevent loops
if (payload.userId === currentUserId) return;

// Reconnection triggers data refetch
socket.on('connect', handleReconnect);
```

### Task 2: Integrate real-time hooks into Kanban board, list view, and project layout
**Commit:** 815f8d1

Integrated real-time hooks into the task views and added connection status indicators.

**Changes:**
- Added WebSocketProvider to dashboard layout wrapping all authenticated pages
- Integrated useRealTimeTasks in TaskViews component (parent of both board and list)
- TaskViews manages task state and passes to both KanbanBoard and TaskListView
- Created ConnectionStatus component showing WebSocket connection with Live/Offline indicator
- Created useProjectPresence hook tracking active users in project rooms
- Created PresenceIndicator component showing active user avatars
- Updated ProjectHeaderClient to display connection status and presence

**Files:**
- apps/web/app/(dashboard)/layout.tsx (modified)
- apps/web/components/tasks/task-views.tsx (modified)
- apps/web/components/project/connection-status.tsx (created)
- apps/web/components/project/project-header-client.tsx (created)
- apps/web/components/project/presence-indicator.tsx (created)
- apps/web/hooks/use-project-presence.ts (created)

**Technical Details:**
```typescript
// WebSocketProvider in layout
<WebSocketProvider>
  {children}
</WebSocketProvider>

// TaskViews manages state for both views
const [tasks, setTasks] = useState(initialTasks);
useRealTimeTasks(projectId, session?.user?.id || '', tasks, setTasks);

// Both views receive the same real-time updated tasks
<KanbanBoard initialTasks={tasks} ... />
<TaskListView tasks={tasks} ... />
```

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Event Flow
1. User A creates/updates/deletes a task
2. Backend emits WebSocket event to project room
3. User B's browser receives event via useRealTimeTasks hook
4. Hook checks `event.userId !== currentUserId` to filter self-updates
5. If not self-update, task state is updated via setTasks
6. React re-renders Kanban board or list view with new data

### Optimistic UI Integration
- KanbanBoard maintains its own useState(initialTasks) + useOptimistic pattern
- Real-time updates from other users flow into the tasks state
- Local user's drag-drop uses optimistic updates as before
- No conflicts because self-updates are filtered out of real-time events

### Connection Management
- WebSocket connects on dashboard mount with JWT auth
- Provider tracks connection state with isConnected boolean
- Reconnection automatically triggers task refetch to catch missed events
- Connection status visible in project header (green = Live, gray = Offline)

### Presence Tracking
- useProjectPresence hook listens for presence:join and presence:leave events
- Tracks active users in project room with deduplication
- PresenceIndicator shows up to 3 user avatars + count
- Hidden if only 0-1 users (self only)

## Verification Results

- TypeScript compilation: PASSED (0 errors)
- WebSocketProvider in layout: PASSED
- useRealTimeTasks integration in TaskViews: PASSED
- Event filtering by currentUserId: PASSED (4 event handlers check)
- Event listener cleanup: PASSED (5 socket.off calls)
- Reconnect handling: PASSED (connect event listener with refetch)

## Self-Check: PASSED

**Files created:**
- FOUND: apps/web/providers/websocket-provider.tsx
- FOUND: apps/web/hooks/use-websocket.ts
- FOUND: apps/web/hooks/use-real-time-tasks.ts
- FOUND: apps/web/hooks/use-project-presence.ts
- FOUND: apps/web/components/project/connection-status.tsx
- FOUND: apps/web/components/project/project-header-client.tsx
- FOUND: apps/web/components/project/presence-indicator.tsx

**Files modified:**
- FOUND: apps/web/lib/websocket.ts (reconnect event listener)
- FOUND: apps/web/app/(dashboard)/layout.tsx (WebSocketProvider wrapper)
- FOUND: apps/web/components/tasks/task-views.tsx (useRealTimeTasks integration)

**Commits:**
- FOUND: 26a8a33 (feat(03-02): create WebSocket provider and real-time task hooks)
- FOUND: 815f8d1 (feat(03-02): integrate real-time hooks into Kanban board and project views)

**Integrations verified:**
- WebSocketProvider wraps dashboard layout: CONFIRMED
- useRealTimeTasks called in TaskViews: CONFIRMED
- Event filtering prevents self-updates: CONFIRMED
- Reconnection triggers refetch: CONFIRMED
- Connection status indicator present: CONFIRMED

## Next Steps

**For Phase 03 Plan 03:**
- Add real-time comment updates to task detail view
- Integrate comment:created, comment:updated, comment:deleted events
- Show typing indicators when users are composing comments
- Handle comment conflicts with version tracking

**For Phase 03 Plan 04:**
- Add real-time notifications for task assignments and mentions
- Implement notification badge and dropdown
- Add browser notifications for important events
- Track notification read/unread state
