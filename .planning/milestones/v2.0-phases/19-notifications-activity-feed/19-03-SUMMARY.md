---
phase: 19-notifications-activity-feed
plan: "03"
subsystem: frontend-notifications-activity
tags: [notifications, activity-feed, bell-icon, polling, next-js, react]
dependency_graph:
  requires: [19-02]
  provides: [notification-bell-ui, activity-feed-ui, workspace-nav-v2]
  affects: [apps/devcollab-web/app/w/[slug]/layout.tsx]
tech_stack:
  added: []
  patterns: [setInterval-cleanup, ssr-cookie-forwarding, merge-pagination-polling]
key_files:
  created:
    - apps/devcollab-web/components/notifications/BellIcon.tsx
    - apps/devcollab-web/components/notifications/NotificationList.tsx
    - apps/devcollab-web/components/WorkspaceNav.tsx
    - apps/devcollab-web/components/activity/ActivityFeed.tsx
    - apps/devcollab-web/app/w/[slug]/activity/page.tsx
  modified:
    - apps/devcollab-web/app/w/[slug]/layout.tsx
decisions:
  - "BellIcon badge uses red (#ef4444) — no purple per project rule"
  - "layout.tsx stays Server Component; only nav extracted into WorkspaceNav client component"
  - "ActivityFeed merge logic: new events prepended, existing items not discarded on 30s poll — prevents Load More collapse"
  - "NotificationList fetches on open (not on mount of BellIcon) — avoids unnecessary API calls when panel closed"
  - "Activity page SSR-fetches initial events with cookie forwarding — consistent with Phase 17-18 detail page pattern"
metrics:
  duration: "2 min"
  completed_date: "2026-02-18"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 19 Plan 03: Notifications + Activity Feed Frontend Summary

**One-liner:** Bell icon with 60s unread-count polling + notification panel, WorkspaceNav client component, and activity feed page with 30s refresh merge and cursor Load More.

## What Was Built

### Task 1 — BellIcon, NotificationList, WorkspaceNav, layout update

**BellIcon** (`components/notifications/BellIcon.tsx`): Client component that polls `/notifications/unread-count` every 60 seconds using `setInterval` with `clearInterval` cleanup on unmount. Shows a red (#ef4444) badge for unread count. Clicking toggles the notification panel.

**NotificationList** (`components/notifications/NotificationList.tsx`): Fetches the full notification list on panel open. Renders each item with a link to the source content (post or snippet). Provides per-item "Mark read" and "Mark all read" actions. Unread items highlighted with #eff6ff background.

**WorkspaceNav** (`components/WorkspaceNav.tsx`): Client component with nav links (Overview, Posts, Snippets, Activity, Dashboard) plus BellIcon. Replaces the inline nav that was in layout.tsx.

**layout.tsx** (`app/w/[slug]/layout.tsx`): Remains a Server Component (no 'use client'). Awaits `params` as Promise (Next.js 15 pattern). Renders `<WorkspaceNav slug={slug} />` as child.

### Task 2 — ActivityFeed component and activity feed page

**ActivityFeed** (`components/activity/ActivityFeed.tsx`): Client component initialized with `initialEvents` from SSR. Every 30 seconds, fetches the first page and merges new events at the top — existing items are never discarded (prevents Load More collapse). "Load More" button appends older events using `nextCursor`. `setInterval` cleaned up on unmount.

**activity/page.tsx** (`app/w/[slug]/activity/page.tsx`): Server Component that SSR-fetches initial feed events with cookie forwarding using `next/headers` cookies() — consistent with Phase 17-18 detail page pattern. Passes `initialEvents` and `initialNextCursor` to `ActivityFeed`.

## Verification Results

- `tsc --noEmit`: 0 TypeScript errors (both tasks)
- `next build`: Succeeds — 17 routes including `/w/[slug]/activity` as dynamic (ƒ)
- No purple colors in any new file (badge: #ef4444 red, links: #3b82f6 blue, text: gray palette)
- layout.tsx has no 'use client' — confirmed Server Component

## API Endpoints Wired

| Component | Endpoint | Method | Behavior |
|-----------|----------|--------|----------|
| BellIcon | `/notifications/unread-count` | GET | 60s poll |
| NotificationList | `/notifications` | GET | Fetch on panel open |
| NotificationList | `/notifications/:id/read` | PATCH | Mark individual read |
| NotificationList | `/notifications/read-all` | PATCH | Mark all read |
| ActivityFeed | `/workspaces/:slug/activity` | GET | 30s poll + Load More |
| activity/page.tsx | `/workspaces/:slug/activity` | GET | SSR initial fetch |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 5 created files confirmed present. Both task commits (613328a, 00b02ed) verified in git log.
