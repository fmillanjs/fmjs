---
phase: 13-automation-optimization
plan: 02
subsystem: ui
tags: [eslint, bundle-analyzer, design-system, governance, component-migration]

# Dependency graph
requires:
  - phase: 12-critical-route-migration
    provides: fully-migrated components in tasks/teams/projects/portfolio/auth/layout
  - phase: 09-design-system-foundation
    provides: ESLint governance config with no-restricted-imports rules
provides:
  - ESLint governance active on all feature component directories (zero deprecated import tolerance)
  - @next/bundle-analyzer integrated with ANALYZE=true build mode
  - Bundle baseline documented (103 kB shared chunks, 243 kB largest route)
  - ConflictWarning replaced inline in task-detail-panel.tsx and kanban-board.tsx
  - EmptyState replaced inline in task-views.tsx, teams/page.tsx, teams/[teamId]/page.tsx
affects:
  - phase: 13-automation-optimization (subsequent plans)
  - future: any new component file importing deprecated components will now fail CI

# Tech tracking
tech-stack:
  added:
    - eslint (peer dep, not previously installed)
    - "@typescript-eslint/parser (for flat config TypeScript parsing)"
    - "@next/bundle-analyzer v16.1.6"
  patterns:
    - Inline amber conflict warning using Radix CSS variables (var(--amber-3/6/9/10/11/12))
    - Inline empty state using flex-col items-center justify-center pattern
    - ESLint flat config with TypeScript parser for governance enforcement

key-files:
  created: []
  modified:
    - apps/web/components/tasks/task-detail-panel.tsx
    - apps/web/components/tasks/task-views.tsx
    - apps/web/components/tasks/kanban-board.tsx
    - apps/web/eslint.config.mjs
    - apps/web/next.config.ts
    - apps/web/package.json
    - "apps/web/app/(dashboard)/teams/page.tsx"
    - "apps/web/app/(dashboard)/teams/[teamId]/page.tsx"

key-decisions:
  - "ESLint skeleton restriction removed: components/ui/skeleton.tsx is the active skeleton used by loading.tsx files; no Shadcn replacement installed at a different path"
  - "All Shadcn-installed ui/ components added to eslint.config.mjs ignores: alert-dialog, form, popover, select, tabs, textarea were missing from original exemption list"
  - "@typescript-eslint/parser required in flat config: TypeScript generics in Shadcn components failed without it"
  - "Inline conflict warning uses Radix CSS variables (var(--amber-*)) instead of hardcoded amber-50/amber-900 for dark mode compatibility"
  - "Auto-hide timer for kanban conflict warning implemented via useEffect since the old ConflictWarning had autoHideDuration=10000 built-in"
  - "EmptyState replacements use identical visual structure (icon+title+description+action) for no UX regression"
  - "app/(dashboard)/teams/page.tsx and teams/[teamId]/page.tsx fixed as part of ESLint governance hardening (Rule 3 blocking)"

patterns-established:
  - "Inline empty state: flex flex-col items-center justify-center py-12 text-center with icon, p.text-lg.font-semibold, p.text-sm.text-muted-foreground, action button"
  - "Inline conflict warning: border-l-4 border-amber-500 bg-[var(--amber-3)] text-[var(--amber-12)] with AlertTriangle/RefreshCw/X lucide icons"
  - "useEffect auto-hide: if (!showConflict) return; setTimeout 10s cleanup pattern"

requirements-completed:
  - COMP-05

# Metrics
duration: 25min
completed: 2026-02-17
---

# Phase 13 Plan 02: ESLint Governance Hardening + Bundle Analyzer Baseline Summary

**ESLint governance enforced on all feature directories via TypeScript-aware flat config; @next/bundle-analyzer integrated with 103 kB shared chunk baseline documented**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-17T17:15:00Z
- **Completed:** 2026-02-17T17:43:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Replaced all 3 deprecated component usages in components/tasks/ (ConflictWarning x2, EmptyState x1) with inline Shadcn-native patterns using Radix CSS variables
- Hardened eslint.config.mjs: removed all Phase 10-12 migration target exemptions (tasks/projects/teams/portfolio/auth/layout/activity) — ESLint now catches any new file importing deprecated components
- Installed eslint + @typescript-eslint/parser + @next/bundle-analyzer; next lint passes with zero violations
- Documented bundle baseline: 103 kB shared chunks, largest route 243 kB (projectId board)

## Task Commits

1. **Task 1: Replace deprecated usages + harden ESLint governance** - `0ff9236` (feat)
2. **Task 2: Install @next/bundle-analyzer + measure bundle baseline** - `65b1668` (feat)

## Bundle Baseline (After Phase 12)

| Route | First Load JS | Notes |
|-------|-------------|-------|
| Shared chunks | 103 kB | 46.4 kB + 54.2 kB + 2.07 kB |
| /teams/[teamId]/projects/[projectId] | 243 kB | Largest — Kanban+DnD+TaskForm |
| /teams/[teamId]/projects/[projectId]/tasks/[taskId] | 208 kB | TaskDetailPanel+Tabs+Comments |
| /teams/[teamId] | 182 kB | TeamPage |
| /teams/[teamId]/settings | 182 kB | TeamSettings |
| /login | 147 kB | Auth form |
| /signup | 147 kB | Auth form |
| /contact | 140 kB | ContactForm |
| /profile | 141 kB | ProfileForm |
| /reset-password | 144 kB | ResetPasswordForm |
| / (portfolio) | 106 kB | Static portfolio |

**Shared chunks breakdown:**
- `chunks/18-3ce15d1c...` — 46.4 kB (likely React + Next.js core)
- `chunks/87c73c54-...` — 54.2 kB (likely app router + shared Shadcn components)
- Other shared — 2.07 kB

**Comparison to Phase 11:** No previous baseline was documented. This is the first measured baseline. The 243 kB projectId route is expected given DnD Kit + TanStack Table + full Shadcn form system loaded for that page.

## Files Created/Modified
- `apps/web/components/tasks/task-detail-panel.tsx` - Removed ConflictWarning import; inlined amber conflict banner with Radix CSS vars
- `apps/web/components/tasks/task-views.tsx` - Removed EmptyState import; inlined flex empty state
- `apps/web/components/tasks/kanban-board.tsx` - Removed ConflictWarning import; inlined amber banner with useEffect auto-hide
- `apps/web/eslint.config.mjs` - Removed Phase 10-12 exemptions; added @typescript-eslint/parser; added all Shadcn UI files to ignores; removed broken skeleton restriction
- `apps/web/next.config.ts` - Wrapped with bundleAnalyzer({enabled: ANALYZE === 'true'})
- `apps/web/package.json` - Added eslint, @typescript-eslint/parser, @next/bundle-analyzer as devDependencies
- `apps/web/app/(dashboard)/teams/page.tsx` - Replaced EmptyState with inline pattern (ESLint enforcement fix)
- `apps/web/app/(dashboard)/teams/[teamId]/page.tsx` - Replaced EmptyState with inline pattern (ESLint enforcement fix)

## Decisions Made
- **ESLint skeleton restriction removed:** `components/ui/skeleton.tsx` is the active (not deprecated) skeleton used by loading.tsx files. There's no alternative Shadcn skeleton at a different path, so restricting it was incorrect. Only `empty-state` and `conflict-warning` are restricted.
- **TypeScript parser required:** Shadcn UI components use TypeScript generics that the default ESLint JS parser can't handle. Added `@typescript-eslint/parser` to flat config.
- **All Shadcn UI files in ignores:** The original ignores list only had 8 files but Phase 11-12 installed alert-dialog, form, popover, select, tabs, textarea — these needed to be added.
- **Inline patterns over Alert component:** Used raw Tailwind + Radix CSS variables for the conflict warning to avoid adding another Shadcn component (Alert) for a single-purpose inline use.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint parsing failures in Shadcn UI components**
- **Found during:** Task 1 (ESLint governance verification)
- **Issue:** next lint failed with "Parsing error: Unexpected token ," in alert-dialog.tsx, form.tsx, popover.tsx, select.tsx, tabs.tsx, textarea.tsx — TypeScript generics not parseable without TypeScript parser
- **Fix:** Installed `@typescript-eslint/parser`, added `languageOptions.parser` to eslint.config.mjs, added all installed Shadcn UI files to ignores list
- **Files modified:** apps/web/eslint.config.mjs, apps/web/package.json, package-lock.json
- **Verification:** next lint passes with zero violations
- **Committed in:** `0ff9236` (Task 1 commit)

**2. [Rule 3 - Blocking] ESLint catching EmptyState in app/ route files**
- **Found during:** Task 1 (ESLint verification — governance working correctly)
- **Issue:** app/(dashboard)/teams/page.tsx and teams/[teamId]/page.tsx still imported EmptyState. ESLint governance correctly flagged them — these were pre-existing violations not caught before because ESLint wasn't installed.
- **Fix:** Replaced EmptyState with inline Card+description pattern in both files
- **Files modified:** apps/web/app/(dashboard)/teams/page.tsx, apps/web/app/(dashboard)/teams/[teamId]/page.tsx
- **Verification:** next lint shows zero violations
- **Committed in:** `0ff9236` (Task 1 commit)

**3. [Rule 1 - Bug] Skeleton restriction incorrectly blocked loading.tsx files**
- **Found during:** Task 1 (ESLint verification)
- **Issue:** ESLint rule restricted `@/components/ui/skeleton` but that IS the active skeleton component used by all loading.tsx files. Rule was conceptually wrong — skeleton at the current path is the valid Shadcn-equivalent component.
- **Fix:** Removed skeleton restriction from ESLint rules. Only empty-state and conflict-warning remain restricted.
- **Files modified:** apps/web/eslint.config.mjs
- **Verification:** Loading.tsx files no longer flagged; governance still enforces deprecated components
- **Committed in:** `0ff9236` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 blocking or Rule 1 bug)
**Impact on plan:** All fixes necessary for ESLint governance to actually function. Governance is now stricter than planned (covers app/ routes too), not looser.

## Issues Encountered
- None beyond the auto-fixed deviations above.

## Next Phase Readiness
- COMP-05 satisfied: ESLint governance fully active on all feature component directories
- Bundle baseline documented for future comparison (Phase 13 plan 03+ can reference 243 kB projectId route)
- `ANALYZE=true npm run build` now generates HTML bundle reports in `.next/analyze/`
- Normal build unaffected

---
*Phase: 13-automation-optimization*
*Completed: 2026-02-17*
