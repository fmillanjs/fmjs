---
phase: 28-devcollab-ui-debt-closure
plan: "02"
subsystem: ui
tags: [react, nextjs, typescript, members, invite, role-management]

# Dependency graph
requires:
  - phase: 28-devcollab-ui-debt-closure
    provides: "Plan 01 — dashboard auth guard server component pattern"
provides:
  - "WorkspaceNav Members link navigating to /w/[slug]/members"
  - "Members page server component fetching list + currentUser concurrently"
  - "MembersTable client component with role change, member removal, invite link modal"
affects: [28-devcollab-ui-debt-closure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component page with concurrent API fetches via Promise.all"
    - "Client component with optimistic updates and rollback on failure"
    - "Invite modal with backdrop click-to-close and inner stopPropagation"

key-files:
  created:
    - apps/devcollab-web/app/w/[slug]/members/page.tsx
    - apps/devcollab-web/components/members/MembersTable.tsx
  modified:
    - apps/devcollab-web/components/WorkspaceNav.tsx

key-decisions:
  - "window.location.origin used for invite join URL construction (not API_URL which would point to backend)"
  - "Remove button guarded by both !isCurrentUser AND member.role !== 'Admin' to prevent removing last admin"
  - "Role selector disabled for current user's own row — admin cannot change own role via UI"
  - "Optimistic updates on both role change and member removal with full rollback on API failure"

patterns-established:
  - "Concurrent server-side fetches: Promise.all([getMembers(), getCurrentUser()]) before rendering"
  - "Client component receives initialMembers + currentUserId as props from server component"

requirements-completed: [UI-02, UI-03, UI-04, UI-05, UI-06]

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 28 Plan 02: Members Management UI Summary

**Workspace members table with role management, member removal, and invite link modal — fully implemented as server + client component split using existing CASL-guarded API endpoints**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-20T23:53:56Z
- **Completed:** 2026-02-20T23:55:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- WorkspaceNav updated with Members link using same inline style as existing nav links
- Members page server component fetches members list and currentUser concurrently via Promise.all
- MembersTable client component delivers full feature set: role dropdown with optimistic update, Remove button with optimistic removal, Generate Invite Link button, invite modal with Copy and Regenerate
- All guard conditions implemented: "You" badge on current user row, role selector disabled for own row, Remove button hidden for self and for Admin members

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Members link to WorkspaceNav** - `d099a4c` (feat)
2. **Task 2: Create members page and MembersTable client component** - `b00c3ed` (feat)

## Files Created/Modified

- `apps/devcollab-web/components/WorkspaceNav.tsx` - Added Members anchor link after Activity link
- `apps/devcollab-web/app/w/[slug]/members/page.tsx` - Server component: concurrent fetch of members + currentUser, renders MembersTable with props
- `apps/devcollab-web/components/members/MembersTable.tsx` - Client component: full member management UI with optimistic state, invite modal, inline styles only

## Decisions Made

- `window.location.origin` for invite join URL construction — `API_URL` points to backend (`localhost:3003`), the join URL must use the web app's origin
- Remove button only shown for `!isCurrentUser && member.role !== 'Admin'` — preserves workspace integrity by preventing Admin removal through UI
- Role selector is a plain `<select>` (no custom dropdown library) — consistent with devcollab-web inline-styles-only constraint
- `/auth/me` endpoint exists in devcollab-api (`apps/devcollab-api/src/auth/auth.controller.ts:59`) — used directly instead of JWT decode fallback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — `/auth/me` endpoint was confirmed present before starting, eliminating the JWT decode fallback path.

## User Setup Required

None - no external service configuration required. All API endpoints used (`/workspaces/:slug/members`, `PATCH /workspaces/:slug/members/:userId/role`, `DELETE /workspaces/:slug/members/:userId`, `POST /workspaces/:slug/invite-links`) already existed and are CASL-guarded.

## Next Phase Readiness

- Members management UI is complete and deployable
- Plan 03 (join page for invite links) and Plan 04 (resume PDF) remain in Phase 28
- Invite link token construction uses `window.location.origin/join?token=` — Plan 03 must handle the `/join` route

## Self-Check: PASSED

- FOUND: apps/devcollab-web/components/WorkspaceNav.tsx
- FOUND: apps/devcollab-web/app/w/[slug]/members/page.tsx
- FOUND: apps/devcollab-web/components/members/MembersTable.tsx
- FOUND: .planning/phases/28-devcollab-ui-debt-closure/28-02-SUMMARY.md
- FOUND: d099a4c (Task 1 commit)
- FOUND: b00c3ed (Task 2 commit)

---
*Phase: 28-devcollab-ui-debt-closure*
*Completed: 2026-02-20*
