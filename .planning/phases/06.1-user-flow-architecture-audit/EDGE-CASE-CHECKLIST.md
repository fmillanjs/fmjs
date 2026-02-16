# Edge Case Testing Checklist

**Phase:** 06.1-user-flow-architecture-audit
**Created:** 2026-02-16
**Purpose:** Comprehensive edge case coverage for TeamFlow application ensuring UX polish and resilient error handling

## Coverage Summary

| Category | Total Items | Automated | Manual | Passing | Failing | Coverage |
|----------|-------------|-----------|--------|---------|---------|----------|
| Loading States | 5 | 5 | 0 | 0 | 0 | 0% |
| Error States | 6 | 6 | 0 | 0 | 0 | 0% |
| Empty States | 6 | 5 | 1 | 0 | 0 | 0% |
| Navigation Edge Cases | 6 | 0 | 6 | 0 | 0 | 0% |
| Permission Edge Cases | 5 | 5 | 0 | 0 | 0 | 0% |
| Data Integrity Edge Cases | 5 | 0 | 5 | 0 | 0 | 0% |
| **TOTAL** | **33** | **21** | **12** | **0** | **0** | **0%** |

*Updated after each testing session*

---

## Loading States

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Initial page load shows skeleton/spinner (Teams page) | [ ] | Auto | E2E: loading-states.spec.ts | |
| Initial page load shows skeleton/spinner (Projects page) | [ ] | Auto | E2E: loading-states.spec.ts | |
| Initial page load shows skeleton/spinner (Task detail) | [ ] | Auto | E2E: loading-states.spec.ts | |
| Form submission shows loading state on button | [ ] | Auto | E2E: loading-states.spec.ts | |
| Infinite scroll shows loading indicator at bottom (Activity feed) | [ ] | Auto | E2E: loading-states.spec.ts | |

**Expected behavior:**
- Skeleton components (apps/web/components/ui/skeleton.tsx) appear immediately
- Loading states prevent duplicate submissions
- Loading indicators provide visual feedback for all async operations

---

## Error States

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Network error shows actionable error message with retry button | [ ] | Auto | E2E: error-states.spec.ts | |
| 404 page shows for invalid routes with navigation back to home | [ ] | Auto | E2E: error-states.spec.ts | |
| 500 error shows generic error with support contact | [ ] | Auto | E2E: error-states.spec.ts | |
| Form validation errors show next to fields | [ ] | Auto | E2E: error-states.spec.ts | |
| API error messages are user-friendly (not raw stack traces) | [ ] | Auto | E2E: error-states.spec.ts | |
| Error boundaries catch component errors without crashing app | [ ] | Auto | E2E: error-states.spec.ts | |

**Existing error handling:**
- Root error boundary: apps/web/app/error.tsx (AlertTriangle icon, "Try Again" button)
- 404 page: apps/web/app/not-found.tsx (FileQuestion icon, "Go Home" and "View Projects" links)
- Route-level error boundaries at /teams/[teamId] and /teams/[teamId]/projects/[projectId]

**Expected behavior:**
- All errors show user-friendly messages (not technical stack traces)
- Error boundaries provide retry/navigation options
- Network errors distinguish between client/server failures

---

## Empty States

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| No teams: Shows "Create your first team" CTA | [ ] | Auto | E2E: empty-states.spec.ts | |
| No projects in team: Shows "Create your first project" CTA | [ ] | Auto | E2E: empty-states.spec.ts | |
| No tasks in project: Shows "Add your first task" CTA | [ ] | Auto | E2E: empty-states.spec.ts | |
| No search results: Shows "No results found" with clear filters button | [ ] | Auto | E2E: empty-states.spec.ts | |
| No comments on task: Shows "Be the first to comment" placeholder | [ ] | Auto | E2E: empty-states.spec.ts | |
| No audit log entries: Shows "No activity yet" message | [ ] | Manual | Visual check in admin audit log | |

**Existing components:**
- EmptyState component: apps/web/components/ui/empty-state.tsx (icon, title, description, action prop)

**Expected behavior:**
- Empty states guide users to next action with clear CTAs
- Icons provide visual context (from lucide-react)
- Actionable buttons/links enable quick creation

---

## Navigation Edge Cases

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Browser back button works correctly (no broken state) | [ ] | Manual | Navigate Team → Project → Task, click back twice | |
| Breadcrumbs show correct hierarchy at all levels | [ ] | Manual | Verify breadcrumbs at Team/Project/Task levels | |
| Sidebar active state matches current page | [ ] | Manual | Navigate between pages, verify sidebar highlighting | |
| Deep links (direct URL access) work when logged in | [ ] | Manual | Copy task URL, paste in new tab, verify loads | |
| Invalid resource IDs show 404 not error page | [ ] | Manual | Navigate to /teams/invalid-id, verify 404 page | |
| Deleted resource redirects to parent (e.g., deleted project → team page) | [ ] | Manual | Delete project, verify redirect to team page | |

**Expected behavior:**
- Navigation state preserved across route changes
- Back button returns to previous page with scroll position maintained
- Invalid IDs trigger 404, not 500 errors
- Breadcrumbs dynamically update based on current route

---

## Permission Edge Cases

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Member cannot access admin-only audit log (redirect with error) | [ ] | Auto | E2E: permission-errors.spec.ts | |
| Member cannot see delete buttons (UI hidden) | [ ] | Auto | E2E: permission-errors.spec.ts | |
| Manager can archive but not delete projects | [ ] | Auto | E2E: permission-errors.spec.ts | |
| Last admin cannot remove themselves | [ ] | Auto | E2E: permission-errors.spec.ts | |
| Non-member cannot access organization resources | [ ] | Auto | E2E: permission-errors.spec.ts | |

**Existing RBAC:**
- Roles: ADMIN, MANAGER, MEMBER
- ADMIN: Full access (delete, archive, invite, remove)
- MANAGER: Invite, archive (no delete, no remove admins)
- MEMBER: Read/write tasks, no settings access

**Expected behavior:**
- Permission denials show clear error messages explaining required role
- UI elements hidden for unauthorized actions (no delete button for members)
- Attempts to access restricted resources redirect with error message

---

## Data Integrity Edge Cases

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Optimistic UI rollback on API failure (drag-drop task status) | [ ] | Manual | Disconnect network, drag task, verify rollback | |
| Concurrent edits show conflict warning | [ ] | Manual | Open task in two windows, edit both, verify conflict | |
| Form resubmission prevention (double-click submit) | [ ] | Manual | Double-click form submit button, verify single request | |
| Stale data refresh on focus (window focus listener) | [ ] | Manual | Leave tab idle 5 min, focus window, verify refresh | |
| Orphaned records handled (task without project shows error) | [ ] | Manual | Delete project with tasks, verify orphaned task error | |

**Existing patterns:**
- React 19 useOptimistic for Kanban drag-drop (apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx)
- Task version field for optimistic concurrency control

**Expected behavior:**
- Optimistic UI updates revert on API failure with error message
- Version conflicts detected and user warned to refresh
- Form submissions disabled during pending request (button loading state)
- Stale data refreshes on window focus (no manual refresh needed)

---

## Testing Instructions

### Automated Tests

Run all edge case E2E tests:
```bash
cd apps/web
npx playwright test e2e/edge-cases/ --project=chromium
```

Run specific test suite:
```bash
npx playwright test e2e/edge-cases/loading-states.spec.ts
npx playwright test e2e/edge-cases/error-states.spec.ts
npx playwright test e2e/edge-cases/empty-states.spec.ts
npx playwright test e2e/edge-cases/permission-errors.spec.ts
```

View test report:
```bash
npx playwright show-report
```

### Manual Verification

1. **Loading States:** Throttle network in DevTools (Slow 3G), navigate to pages, verify skeletons appear
2. **Error States:** Use DevTools to go offline, trigger network errors, verify error messages and retry buttons
3. **Empty States:** Create new test user, verify empty state CTAs for teams/projects/tasks
4. **Navigation:** Test browser back button, breadcrumbs, sidebar state across multiple navigation paths
5. **Permissions:** Login as different roles (admin, manager, member), verify UI visibility and access restrictions
6. **Data Integrity:** Test optimistic UI, concurrent edits, form resubmission, stale data scenarios

---

## Issue Tracking

### Discovered Issues

| ID | Category | Severity | Description | Status | Fix Plan |
|----|----------|----------|-------------|--------|----------|
| - | - | - | No issues discovered yet | - | - |

**Severity levels:**
- CRITICAL: Blocks core functionality, prevents task completion
- HIGH: Major UX issue, confusing error messages, broken navigation
- MEDIUM: Minor UX issue, missing guidance, inconsistent styling
- LOW: Edge case polish, nice-to-have improvements

---

## Definitions

**Test Types:**
- **Auto**: Automated E2E test with Playwright (e2e/edge-cases/*.spec.ts)
- **Manual**: Manual verification requiring visual/functional check by human

**Status:**
- [ ] Not tested
- [~] Partially tested (some scenarios passing, some failing)
- [x] Verified (all scenarios passing)

**Coverage Calculation:**
Coverage = (Passing items / Total items) × 100%

---

*Last updated: 2026-02-16*
*Next review: After E2E test execution and manual verification*
