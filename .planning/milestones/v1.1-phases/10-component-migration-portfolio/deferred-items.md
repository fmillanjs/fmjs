# Deferred Items - Phase 10: Component Migration Portfolio

## Pre-existing TypeScript Errors (Out of Scope)

Found during plan 10-02 Task 2 TypeScript verification. These are pre-existing issues not caused by this phase.

### 1. apps/web/e2e/user-journey/complete-flow.spec.ts
- Line 103: `Type 'string | undefined' is not assignable to type 'string'`
- Line 136: `Type 'string | undefined' is not assignable to type 'string'`
- **Action needed:** Add non-null assertion or undefined guard

### 2. apps/web/lib/api.test.ts
- Lines 38-40: `Object is possibly 'undefined'`
- **Action needed:** Add optional chaining or type narrowing

These do not affect runtime behavior of the portfolio pages or the new test files.
