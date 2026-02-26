---
phase: 40-integration-qa
plan: 01
subsystem: data-layer
tags: [walkthrough, data, lighthouse, accessibility, ci]
dependency_graph:
  requires:
    - "39-01 — WalkthroughSection component (WalkthroughScreenshot interface)"
    - "38-03 — screenshots-manifest.ts (alt text strings)"
  provides:
    - "TEAMFLOW_WALKTHROUGH_SCREENSHOTS — typed callout data for TeamFlow case study"
    - "DEVCOLLAB_WALKTHROUGH_SCREENSHOTS — typed callout data for DevCollab case study"
  affects:
    - "apps/web/app/projects/teamflow/page.tsx (will import TEAMFLOW_WALKTHROUGH_SCREENSHOTS)"
    - "apps/web/app/projects/devcollab/page.tsx (will import DEVCOLLAB_WALKTHROUGH_SCREENSHOTS)"
    - "Lighthouse CI pipeline — accessibility failures now block builds"
tech_stack:
  added: []
  patterns:
    - "Typed data arrays matching component interface exactly"
    - "Reuse of alt text from existing manifest (single source of truth)"
key_files:
  created:
    - apps/web/src/data/walkthrough-data.ts
  modified:
    - apps/web/lighthouserc.json
    - apps/web/lighthouserc.production.json
decisions:
  - "Alt text reused verbatim from screenshots-manifest.ts to maintain single source of truth"
  - "Accessibility Lighthouse gate upgraded from warn to error per user decision in 40-CONTEXT.md"
metrics:
  duration: "2 min"
  completed_date: "2026-02-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 40 Plan 01: Walkthrough Data and Lighthouse Accessibility Gate Summary

**One-liner:** Typed WalkthroughScreenshot arrays for 10 screenshots with 2-3 pixel-coordinate callout steps each, plus Lighthouse accessibility assertion hardened from warn to error.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create walkthrough-data.ts with typed callout step definitions | 9c1043f | apps/web/src/data/walkthrough-data.ts |
| 2 | Harden Lighthouse CI accessibility gate to error in both configs | 83c0a3a | apps/web/lighthouserc.json, apps/web/lighthouserc.production.json |

## What Was Built

### walkthrough-data.ts

Created `apps/web/src/data/walkthrough-data.ts` exporting two `WalkthroughScreenshot[]` arrays:

- `TEAMFLOW_WALKTHROUGH_SCREENSHOTS` — 5 screenshots: kanban (3 steps), presence (2 steps), task-modal (3 steps), rbac (3 steps), audit-log (3 steps)
- `DEVCOLLAB_WALKTHROUGH_SCREENSHOTS` — 5 screenshots: workspace (2 steps), code-snippet (3 steps), thread (3 steps), search (3 steps), activity (3 steps)

Every callout step has pixel x/y coordinates, a 2-4 word label, and a one-sentence explanation. All alt text strings match `screenshots-manifest.ts` verbatim. TypeScript compiles with zero errors on this file.

### Lighthouse CI Hardening

Both `lighthouserc.json` and `lighthouserc.production.json` updated:
- Before: `"categories:accessibility": ["warn", { "minScore": 1 }]`
- After: `"categories:accessibility": ["error", { "minScore": 1 }]`

Accessibility failures now block CI instead of issuing warnings. Performance assertion was not touched.

## Verification Results

- `apps/web/src/data/walkthrough-data.ts` exists and exports both named arrays
- TypeScript compilation: zero errors on this file (pre-existing e2e/api.test.ts errors are out of scope per STATE.md)
- Both lighthouserc files: `"categories:accessibility": ["error", { "minScore": 1 }]`
- No "warn" next to accessibility in either lighthouse config

## Decisions Made

- **Alt text reuse:** Verbatim strings from `screenshots-manifest.ts` rather than rewriting, maintaining a single source of truth across the data layer.
- **Accessibility as error:** Per user decision captured in 40-CONTEXT.md — accessibility failures must block builds, not emit warnings.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Checks

- [x] `apps/web/src/data/walkthrough-data.ts` exists
- [x] Exports `TEAMFLOW_WALKTHROUGH_SCREENSHOTS` and `DEVCOLLAB_WALKTHROUGH_SCREENSHOTS`
- [x] 10 total screenshots (5 TeamFlow + 5 DevCollab)
- [x] TypeScript: zero errors on walkthrough-data.ts
- [x] `lighthouserc.json` accessibility = "error"
- [x] `lighthouserc.production.json` accessibility = "error"
- [x] Commit 9c1043f exists
- [x] Commit 83c0a3a exists

## Self-Check: PASSED
