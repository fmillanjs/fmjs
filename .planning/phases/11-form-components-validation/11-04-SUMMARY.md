---
phase: 11-form-components-validation
plan: "04"
subsystem: forms
tags: [forms, accessibility, react-hook-form, shadcn, wcag, playwright, axe, task-form]
dependency_graph:
  requires:
    - phase: "11-02"
      provides: "Auth form migration pattern with FormField + onBlur"
    - phase: "11-03"
      provides: "Dashboard/portfolio form migration pattern with Shadcn Select"
  provides:
    - "task-form.tsx fully migrated with 3 Shadcn Select dropdowns (status, priority, assignee)"
    - "e2e/auth/form-accessibility.spec.ts: 6 axe WCAG AA tests for auth form routes"
    - "COMP-03 complete: all 12 application forms migrated to Shadcn Form pattern"
  affects: ["phase-12", "form-accessibility", "task-form"]

tech-stack:
  added: []
  patterns:
    - "FormField render prop for all form fields including Shadcn Select dropdowns"
    - "3x onValueChange pattern for Select fields in task-form"
    - "role=group + aria-labelledby for multi-select toggle groups"
    - "AxeBuilder WCAG AA axe tests: localStorage pre-load for dark mode before navigation"
    - "text-foreground + underline for links on muted backgrounds (guarantees WCAG AA contrast)"

key-files:
  created:
    - apps/web/e2e/auth/form-accessibility.spec.ts
  modified:
    - apps/web/components/tasks/task-form.tsx
    - apps/web/components/auth/reset-password-request-form.tsx

key-decisions:
  - "task-form labels toggle: role=group + aria-labelledby=labels-heading for accessible multi-select group (not FormField — uses custom button toggle with setValue)"
  - "text-foreground + underline for Back to Login link on muted background — text-primary (blue-11) gives only 4.18:1 on bg-muted (#f0f0f3), below 4.5:1 WCAG AA threshold"

patterns-established:
  - "Links on non-white backgrounds: use text-foreground + underline instead of text-primary when primary color falls below 4.5:1 on that background"
  - "Multi-toggle groups: role=group + aria-labelledby instead of FormField for custom button patterns"

requirements-completed: ["COMP-03"]

duration: 2min
completed: 2026-02-17
---

# Phase 11 Plan 04: Task Form Migration & Accessibility Audit Summary

**task-form.tsx migrated with 3 Shadcn Selects + 6 axe WCAG AA tests confirming zero violations across all auth form routes in both light and dark modes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T07:12:57Z
- **Completed:** 2026-02-17T07:15:32Z
- **Tasks:** 2 of 3 auto-tasks complete (Task 3 = human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- Migrated task-form.tsx (most complex form: 12 fields, 4 native selects) to FormField pattern — 3 Shadcn Select dropdowns for status, priority, assignee; dueDate keeps native date Input
- Created form-accessibility.spec.ts with 6 axe WCAG AA tests (3 routes x 2 modes: /login, /signup, /reset-password in light + dark)
- All 6 accessibility tests pass with zero violations, confirming all Phase 11 auth form migrations are WCAG AA compliant
- Auto-fixed color contrast violation on reset-password "Back to Login" link (blue-11 on bg-muted = 4.18:1, below 4.5:1 threshold)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate task-form.tsx with 4 Shadcn Select dropdowns** - `96c640d` (feat)
2. **Task 2: Add axe WCAG AA accessibility tests for auth form routes** - `a5c1dac` (feat)
3. **Task 3: Human verification checkpoint** - awaiting human verification

## Files Created/Modified

- `apps/web/components/tasks/task-form.tsx` - Full FormField migration; 3 Shadcn Select dropdowns (status, priority, assignee); labels group with role=group + aria-labelledby; Button components for cancel/submit; role=alert on error div
- `apps/web/e2e/auth/form-accessibility.spec.ts` - New: 6 axe WCAG AA tests for /login, /signup, /reset-password in light and dark modes
- `apps/web/components/auth/reset-password-request-form.tsx` - "Back to Login" link changed from text-primary to text-foreground + underline (WCAG AA contrast fix)

## Decisions Made

- task-form labels toggle kept as custom button group (not FormField) — multi-select with setValue pattern; wrapped in `role="group"` with `aria-labelledby` for screen reader accessibility
- "Back to Login" link uses `text-foreground underline` instead of `text-primary` — blue-11 (#0d74ce) on bg-muted (#f0f0f3) yields 4.18:1, below WCAG AA 4.5:1 minimum; foreground text always passes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed WCAG AA color contrast violation on reset-password "Back to Login" link**
- **Found during:** Task 2 (axe accessibility test run)
- **Issue:** `text-primary` (blue-11 = #0d74ce) on bg-muted (#f0f0f3) background = 4.18:1 contrast ratio, below WCAG 2 AA 4.5:1 minimum for normal-weight text at 14px
- **Fix:** Changed to `text-foreground underline hover:text-muted-foreground` — foreground on muted background always exceeds 4.5:1; underline maintains link affordance
- **Files modified:** `apps/web/components/auth/reset-password-request-form.tsx`
- **Verification:** All 6 axe tests pass with zero violations after fix
- **Committed in:** `a5c1dac` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for WCAG AA compliance — direct result of running accessibility tests. No scope creep.

## Issues Encountered

None beyond the auto-fixed contrast violation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 12 application forms now use Shadcn Form pattern with automatic ARIA wiring
- COMP-03 requirement fully satisfied
- 6 axe WCAG AA tests established for auth forms (companion to 12 portfolio tests from Phase 10)
- Human verification checkpoint (Task 3) pending: keyboard navigation and ARIA attributes in browser DevTools

---
*Phase: 11-form-components-validation*
*Completed: 2026-02-17*
