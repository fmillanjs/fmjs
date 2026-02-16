# Edge Case Testing Checklist

**Phase:** 06.1-user-flow-architecture-audit
**Created:** 2026-02-16
**Purpose:** Comprehensive edge case coverage for TeamFlow application ensuring UX polish and resilient error handling

## Coverage Summary

| Category | Total Items | Automated | Manual | Passing | Failing | Coverage |
|----------|-------------|-----------|--------|---------|---------|----------|
| Loading States | 5 | 5 | 0 | 5 | 0 | 100% |
| Error States | 6 | 6 | 0 | 6 | 0 | 100% |
| Empty States | 6 | 5 | 1 | 6 | 0 | 100% |
| Navigation Edge Cases | 6 | 0 | 6 | 6 | 0 | 100% |
| Permission Edge Cases | 5 | 5 | 0 | 5 | 0 | 100% |
| Data Integrity Edge Cases | 5 | 0 | 5 | 4 | 1 | 80% |
| **TOTAL** | **33** | **21** | **12** | **32** | **1** | **97%** |

*Updated: 2026-02-16 - Manual verification complete*

---

## Loading States

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Initial page load shows skeleton/spinner (Teams page) | [x] | Auto | E2E: loading-states.spec.ts | E2E Test Suite |
| Initial page load shows skeleton/spinner (Projects page) | [x] | Auto | E2E: loading-states.spec.ts | E2E Test Suite |
| Initial page load shows skeleton/spinner (Task detail) | [x] | Auto | E2E: loading-states.spec.ts | E2E Test Suite |
| Form submission shows loading state on button | [x] | Auto | E2E: loading-states.spec.ts | E2E Test Suite |
| Infinite scroll shows loading indicator at bottom (Activity feed) | [x] | Auto | E2E: loading-states.spec.ts | E2E Test Suite |

**Expected behavior:**
- Skeleton components (apps/web/components/ui/skeleton.tsx) appear immediately
- Loading states prevent duplicate submissions
- Loading indicators provide visual feedback for all async operations

---

## Error States

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Network error shows actionable error message with retry button | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |
| 404 page shows for invalid routes with navigation back to home | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |
| 500 error shows generic error with support contact | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |
| Form validation errors show next to fields | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |
| API error messages are user-friendly (not raw stack traces) | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |
| Error boundaries catch component errors without crashing app | [x] | Auto | E2E: error-states.spec.ts | E2E Test Suite |

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
| No teams: Shows "Create your first team" CTA | [x] | Auto | E2E: empty-states.spec.ts | E2E Test Suite |
| No projects in team: Shows "Create your first project" CTA | [x] | Auto | E2E: empty-states.spec.ts | E2E Test Suite |
| No tasks in project: Shows "Add your first task" CTA | [x] | Auto | E2E: empty-states.spec.ts | E2E Test Suite |
| No search results: Shows "No results found" with clear filters button | [x] | Auto | E2E: empty-states.spec.ts | E2E Test Suite |
| No comments on task: Shows "Be the first to comment" placeholder | [x] | Auto | E2E: empty-states.spec.ts | E2E Test Suite |
| No audit log entries: Shows "No activity yet" message | [x] | Manual | Visual check in admin audit log | Manual Verification |

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
| Browser back button works correctly (no broken state) | [x] | Manual | Navigate Team → Project → Task, click back twice | Manual Verification |
| Breadcrumbs show correct hierarchy at all levels | [x] | Manual | Verify breadcrumbs at Team/Project/Task levels | Manual Verification |
| Sidebar active state matches current page | [x] | Manual | Navigate between pages, verify sidebar highlighting | Manual Verification |
| Deep links (direct URL access) work when logged in | [x] | Manual | Copy task URL, paste in new tab, verify loads | Manual Verification |
| Invalid resource IDs show 404 not error page | [x] | Manual | Navigate to /teams/invalid-id, verify 404 page | Manual Verification |
| Deleted resource redirects to parent (e.g., deleted project → team page) | [x] | Manual | Delete project, verify redirect to team page | Manual Verification |

**Expected behavior:**
- Navigation state preserved across route changes
- Back button returns to previous page with scroll position maintained
- Invalid IDs trigger 404, not 500 errors
- Breadcrumbs dynamically update based on current route

---

## Permission Edge Cases

| Item | Status | Test Type | Notes | Verified By |
|------|--------|-----------|-------|-------------|
| Member cannot access admin-only audit log (redirect with error) | [x] | Auto | E2E: permission-errors.spec.ts | E2E Test Suite |
| Member cannot see delete buttons (UI hidden) | [x] | Auto | E2E: permission-errors.spec.ts | E2E Test Suite |
| Manager can archive but not delete projects | [x] | Auto | E2E: permission-errors.spec.ts | E2E Test Suite |
| Last admin cannot remove themselves | [x] | Auto | E2E: permission-errors.spec.ts | E2E Test Suite |
| Non-member cannot access organization resources | [x] | Auto | E2E: permission-errors.spec.ts | E2E Test Suite |

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
| Optimistic UI rollback on API failure (drag-drop task status) | [x] | Manual | Disconnect network, drag task, verify rollback | Manual Verification |
| Concurrent edits show conflict warning | [x] | Manual | Open task in two windows, edit both, verify conflict | Manual Verification |
| Form resubmission prevention (double-click submit) | [~] | Manual | Task creation works but shows errors - needs investigation | Manual Verification |
| Stale data refresh on focus (window focus listener) | [x] | Manual | Leave tab idle 5 min, focus window, verify refresh | Manual Verification |
| Orphaned records handled (task without project shows error) | [x] | Manual | Delete project with tasks, verify orphaned task error | Manual Verification |

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
| 001 | Data Integrity | MEDIUM | Task creation works but displays errors during submission | Open | Investigate form error handling and validation messages |

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
*Verification Status: COMPLETE - 97% coverage (32/33 items passing)*
*Next review: After task creation error investigation and fix*
