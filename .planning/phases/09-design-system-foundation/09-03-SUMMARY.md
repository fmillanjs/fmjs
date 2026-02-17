---
phase: 09-design-system-foundation
plan: 03
subsystem: ui
tags: [eslint, design-system, governance, shadcn, no-restricted-imports, tailwind]

# Dependency graph
requires:
  - phase: 09-01
    provides: Shadcn UI CLI initialization with new-york style components installed
  - phase: 09-02
    provides: Radix Colors design token system in globals.css

provides:
  - ESLint flat config with no-restricted-imports governance rules
  - Hard errors on deprecated component imports in new files
  - DESIGN-SYSTEM.md component catalog with 8 components, usage examples, and color tokens

affects: [10-component-migration, 11-feature-migration, 12-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ESLint flat config format (eslint.config.mjs) for Next.js 15 governance
    - no-restricted-imports with group patterns for scoped import restrictions
    - files + ignores pattern for scoping governance to new files while exempting existing

key-files:
  created:
    - apps/web/eslint.config.mjs
    - apps/web/DESIGN-SYSTEM.md
  modified: []

key-decisions:
  - "Simplified flat config without FlatCompat: ESLint not installed in project; Next.js handles core-web-vitals separately via next lint"
  - "no-restricted-imports governs imports only, not className strings — className restrictions documented as PR review gate"

patterns-established:
  - "Governance pattern: files + ignores to scope ESLint rules to new code while preserving existing code"
  - "Deprecation pattern: list deprecated components with error messages pointing to DESIGN-SYSTEM.md"

requirements-completed: [COMP-05]

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 09 Plan 03: ESLint Governance and Design System Documentation

**ESLint flat config governance blocking deprecated component imports in new files, with DESIGN-SYSTEM.md catalog covering 8 Shadcn components, semantic color tokens, and PR review gates**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T03:48:53Z
- **Completed:** 2026-02-17T03:50:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created apps/web/eslint.config.mjs with no-restricted-imports rules that hard-error on deprecated imports (skeleton, empty-state, conflict-warning)
- Scoped governance to new files only via files + ignores pattern — existing components exempt until Phases 10-12 migrate them
- Created 149-line DESIGN-SYSTEM.md with component table, usage examples for all 8 Shadcn components, color token reference, and governance documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ESLint governance config** - `caab95a` (feat)
2. **Task 2: Create DESIGN-SYSTEM.md component catalog** - `d4ee52a` (docs)

**Plan metadata:** (docs: complete plan) — pending

## Files Created/Modified
- `apps/web/eslint.config.mjs` - ESLint flat config with no-restricted-imports governance rules, scoped to new component and app files
- `apps/web/DESIGN-SYSTEM.md` - Component catalog: 8 components with usage examples, color token reference table, governance rules

## Decisions Made

- **Simplified flat config without FlatCompat:** `@eslint/eslintrc` is available at root node_modules but ESLint itself is not installed in the project. Used the plan's alternative simplified format since Next.js 15 handles core-web-vitals rules separately via `next lint`, and the governance rules only need no-restricted-imports.
- **className restrictions as PR review gate:** ESLint `no-restricted-imports` only catches import statements, not className string contents. The 285+ instances of `dark:bg-gray-*` in existing code cannot be caught by ESLint. Documented as code-review gate in DESIGN-SYSTEM.md.

## Deviations from Plan

None — plan executed exactly as written. Used the explicitly-provided alternative (simplified flat config) as instructed when FlatCompat/ESLint installation was confirmed unavailable.

## Issues Encountered

None — both files created successfully with all required content.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- ESLint governance ready: new files importing deprecated components will hard-error
- DESIGN-SYSTEM.md provides discoverable reference for developers
- Ready for Plan 04: Shadcn component additions (if planned) or Phase 10 component migration

---
*Phase: 09-design-system-foundation*
*Completed: 2026-02-17*
