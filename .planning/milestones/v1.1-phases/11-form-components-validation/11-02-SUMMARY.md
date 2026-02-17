---
phase: 11-form-components-validation
plan: "02"
subsystem: auth-forms
tags: [accessibility, shadcn-form, aria, react-hook-form, wcag-aa]
dependency_graph:
  requires: [11-01]
  provides: [accessible-auth-forms, aria-wiring]
  affects: [login, signup, reset-password, profile, change-password]
tech_stack:
  added: []
  patterns: [FormField-render-prop, mode-onBlur, role-alert, role-status]
key_files:
  created: []
  modified:
    - apps/web/components/auth/login-form.tsx
    - apps/web/components/auth/signup-form.tsx
    - apps/web/components/auth/reset-password-request-form.tsx
    - apps/web/components/auth/reset-password-form.tsx
    - apps/web/components/auth/profile-form.tsx
    - apps/web/components/auth/change-password-form.tsx
decisions:
  - "FormField render prop replaces register() spread for automatic aria-invalid + aria-describedby wiring"
  - "mode: 'onBlur' prevents keystroke-level validation noise — fires only when field loses focus"
  - "role=alert for errors (assertive — interrupts screen reader), role=status for success (polite — waits for idle)"
  - "Hidden token field uses form.register('token') directly — appropriate for non-UI fields outside FormField context"
  - "Read-only email/role fields in profile-form use plain divs — not part of schema, no ARIA wiring needed"
  - "profile-form image field: value={field.value ?? ''} coercion to satisfy Input type constraints (null vs undefined)"
metrics:
  duration: 2 min
  completed_date: 2026-02-17
  tasks_completed: 2
  files_modified: 6
---

# Phase 11 Plan 02: Auth Form ARIA Migration Summary

**One-liner:** All 6 auth forms migrated from raw input/register() to Shadcn FormField pattern — automatic aria-invalid and aria-describedby wiring now active for all fields.

## What Was Built

Migrated all 6 auth form components from manual `register()` + manual `htmlFor`/`id` coordination to the Shadcn Form component pattern. FormControl now automatically sets `aria-invalid` when a field has a validation error, and automatically manages `aria-describedby` to link inputs to their FormMessage elements.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate login-form and signup-form | d2dca90 | login-form.tsx, signup-form.tsx |
| 2 | Migrate 4 remaining auth forms | 8614de4 | reset-password-request-form.tsx, reset-password-form.tsx, profile-form.tsx, change-password-form.tsx |

## Changes Made

### login-form.tsx
- Added Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Input, Button imports
- Changed `useForm` destructuring to `const form = useForm<LoginDto>({ ..., mode: 'onBlur' })`
- Wrapped `<form>` with `<Form {...form}>`
- Replaced email field div with `<FormField control={form.control} name="email" ...>`
- Replaced password field div with `<FormField control={form.control} name="password" ...>`
- Added `role="alert"` to server error div
- Replaced raw `<button>` with `<Button type="submit" disabled={isLoading} className="w-full">`

### signup-form.tsx
- Same transformation as login-form
- FormField for name, email, password fields
- role="alert" on server error div
- Button component replacing raw button

### reset-password-request-form.tsx
- FormField for email field
- role="alert" on error message div, role="status" on success message div
- Button component replacing raw button

### reset-password-form.tsx
- FormField for password and confirmPassword fields
- Hidden token field: `<input type="hidden" {...form.register('token')} />` — unchanged
- role="alert" on error message div

### profile-form.tsx
- FormField for name and image editable fields
- Read-only email and role display fields kept as plain HTML (not part of schema)
- role="alert" on error div, role="status" on success div

### change-password-form.tsx
- FormField for currentPassword, newPassword, confirmPassword
- role="alert" on error div, role="status" on success div
- `form.reset()` replaces `reset()` destructured variable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed null type mismatch for image field in profile-form**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `updateProfileSchema` infers `image` as `string | null | undefined`, but Input expects `string | undefined`. TypeScript error TS2322 on field spread.
- **Fix:** Added `value={field.value ?? ''} ` to coerce null to empty string while keeping field spread
- **Files modified:** apps/web/components/auth/profile-form.tsx
- **Commit:** 8614de4

## Verification Results

- [x] All 6 auth form files import Form, FormField, FormControl, FormMessage from '@/components/ui/form'
- [x] All 6 forms have mode: 'onBlur' in useForm options
- [x] No register() calls remain (token field uses form.register() — appropriate for hidden non-UI field)
- [x] Server error divs have role="alert" in all 6 forms
- [x] Success divs have role="status" in all 3 forms that have them
- [x] Shadcn Button component used in all 6 forms
- [x] No TypeScript errors in auth/ directory

## Self-Check: PASSED
