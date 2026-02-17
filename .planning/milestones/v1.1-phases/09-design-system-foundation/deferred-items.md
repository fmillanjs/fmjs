# Deferred Items — Phase 09 Design System Foundation

## Pre-existing TypeScript Errors (Out of Scope)

Discovered during Plan 04 Task 1 TypeScript compilation check. These errors are **pre-existing** — not caused by Shadcn component installation.

### e2e/user-journey/complete-flow.spec.ts
- Line 103: `Type 'string | undefined' is not assignable to type 'string'`
- Line 136: `Type 'string | undefined' is not assignable to type 'string'`

### apps/web/lib/api.test.ts
- Line 38-40: `Object is possibly 'undefined'` (3 errors)

**Action required:** Fix in a dedicated test/type cleanup plan. Not blocking component work.
**Logged by:** 09-04 Plan execution, Task 1
**Date:** 2026-02-17
