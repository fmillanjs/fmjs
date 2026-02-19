---
phase: 22-token-foundation
plan: "02"
subsystem: ui
tags: [motion, gsap, lenis, npm-workspaces, animation, frontend]

# Dependency graph
requires: []
provides:
  - motion@12.34.2 workspace-scoped to apps/web (import via motion/react)
  - gsap@3.14.2 workspace-scoped to apps/web
  - "@gsap/react@2.1.2 workspace-scoped to apps/web (useGSAP hook)"
  - lenis@1.3.17 workspace-scoped to apps/web (smooth scroll, not initialized yet)
affects:
  - 23-canvas (imports from motion, gsap)
  - 24-scroll-animations (imports from motion, gsap, lenis)
  - 25-personality-effects (imports from motion, gsap)

# Tech tracking
tech-stack:
  added:
    - "motion@12.34.2 — React animation library (formerly framer-motion); import from motion/react"
    - "gsap@3.14.2 — Professional-grade animation engine"
    - "@gsap/react@2.1.2 — GSAP React hooks (useGSAP)"
    - "lenis@1.3.17 — Smooth scroll; installed but not initialized until Phase 26"
  patterns:
    - "npm --workspace apps/web flag for workspace-scoped install (never --workspaces plural)"
    - "Packages hoisted to root node_modules per npm workspace behavior; dependency declaration stays in apps/web/package.json only"

key-files:
  created: []
  modified:
    - "apps/web/package.json — four new runtime dependencies added"
    - "package-lock.json — lockfile updated with 102 new packages"

key-decisions:
  - "Use motion (NOT framer-motion) — import path is motion/react"
  - "Lenis installed but not initialized in Phase 22 — intentional; activation deferred to Phase 26 (ANIM-06)"
  - "Pre-existing build failure (ENOENT 500.html rename) logged to deferred-items.md, out of scope for Plan 02"
  - "Runtime dependencies not devDependencies — motion, gsap, @gsap/react, lenis are used in client components at runtime"

patterns-established:
  - "Pattern: workspace-scoped install — npm install <pkg> --workspace apps/web from monorepo root"
  - "Pattern: verify no workspace contamination — grep root package.json and all workspace package.jsons after install"

requirements-completed: [THEME-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 02: Token Foundation — Animation Libraries Summary

**motion@12.34.2, gsap@3.14.2, @gsap/react@2.1.2, and lenis@1.3.17 installed workspace-scoped to apps/web with zero contamination of other workspaces**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T03:34:36Z
- **Completed:** 2026-02-19T03:36:58Z
- **Tasks:** 1/1
- **Files modified:** 2

## Accomplishments

- All four animation libraries installed at researched exact versions (motion@12.34.2, gsap@3.14.2, @gsap/react@2.1.2, lenis@1.3.17)
- Dependency declarations appear exclusively in `apps/web/package.json` — no root package.json contamination, no other workspace contaminated
- Lockfile (`package-lock.json`) updated with 102 new packages reflecting the transitive dependency tree
- THEME-03 requirement satisfied: animation packages workspace-scoped, no TeamFlow/DevCollab bundle contamination

## Task Commits

Each task was committed atomically:

1. **Task 1: Install animation packages workspace-scoped to apps/web** - `e62b756` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/web/package.json` — Four new runtime dependencies: motion, gsap, @gsap/react, lenis
- `package-lock.json` — Lockfile updated with 102 new packages (transitive dependencies of the four libraries)

## Decisions Made

- Used `motion` (not `framer-motion`) as specified in the critical constraints. Import path for downstream phases: `motion/react`.
- All four packages installed as runtime `dependencies` (not `devDependencies`) because they are used in client components at runtime.
- Lenis installed but intentionally not initialized — Phase 26 (ANIM-06) handles activation with a `"use client"` wrapper.

## Deviations from Plan

None — plan executed exactly as written. The workspace-scoped install ran with no complications.

## Issues Encountered

**Pre-existing build failure (out of scope):** `npm run build --workspace apps/web` fails with `ENOENT: rename .next/export/500.html`. This is a pre-existing Next.js 15.5.12 static export issue, not caused by the animation library installation. All 16 pages generate successfully; the failure occurs during a file rename step in Next.js internals. Logged to `deferred-items.md`. Package installation verified independently via `node -e "require('./node_modules/motion/package.json')"` checks — all four packages resolve correctly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 23 (canvas): Can import from `motion` and `gsap`. Packages are in lockfile.
- Phase 24 (scroll animations): Can import from `motion`, `gsap`, and `lenis`. Lenis CSS import (`lenis/dist/lenis.css`) must come from a `"use client"` component when activated.
- Phase 25 (personality effects): Can import from `motion` and `gsap`.
- Deferred concern: Pre-existing build failure in Next.js export step should be investigated before deployment phases.

---
*Phase: 22-token-foundation*
*Completed: 2026-02-19*
