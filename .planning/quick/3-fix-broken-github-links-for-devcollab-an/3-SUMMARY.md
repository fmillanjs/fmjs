---
phase: quick-3
plan: "01"
subsystem: portfolio/projects
tags: [bug-fix, github-links, devcollab, teamflow]
dependency_graph:
  requires: []
  provides: [working-view-source-links]
  affects: [devcollab-case-study, teamflow-case-study]
tech_stack:
  added: []
  patterns: []
key_files:
  modified:
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
decisions:
  - "Both DevCollab and TeamFlow View Source buttons link to root monorepo https://github.com/fmillanjs/fmjs — branch-specific /tree/ URLs return 404 since neither branch exists"
metrics:
  duration: "~3 min"
  completed: "2026-02-22"
---

# Quick Task 3: Fix Broken GitHub View Source Links Summary

**One-liner:** Replaced 404-returning /tree/devcollab and /tree/teamflow branch URLs with the working root monorepo URL https://github.com/fmillanjs/fmjs on both case study pages.

## Objective

Fix "View Source" GitHub links on DevCollab and TeamFlow case study pages that returned 404 due to non-existent branches.

## What Was Done

Previous quick task 1 updated GitHub links from a wrong repo (`/devcollab`) to branch-specific URLs (`/fmjs/tree/devcollab`, `/fmjs/tree/teamflow`). Those branches do not exist in the `fmjs` monorepo, so both URLs still returned 404.

This task changes both links to the root monorepo URL `https://github.com/fmillanjs/fmjs`, which returns HTTP 200 and is the correct landing page for recruiters clicking "View Source".

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|---------------|
| 1 | Fix broken GitHub View Source links on both project case study pages | 73ea0d6 | devcollab/page.tsx, teamflow/page.tsx |

## Changes Made

### `apps/web/app/(portfolio)/projects/devcollab/page.tsx` (line 67)

Before: `href="https://github.com/fmillanjs/fmjs/tree/devcollab"`
After: `href="https://github.com/fmillanjs/fmjs"`

### `apps/web/app/(portfolio)/projects/teamflow/page.tsx` (line 65)

Before: `href="https://github.com/fmillanjs/fmjs/tree/teamflow"`
After: `href="https://github.com/fmillanjs/fmjs"`

## Verification

- Both files now contain `href="https://github.com/fmillanjs/fmjs"` with no `/tree/` suffix
- No `/tree/devcollab` or `/tree/teamflow` branch references remain in portfolio pages
- `curl https://github.com/fmillanjs/fmjs` returns HTTP 200

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — modified, contains `github.com/fmillanjs/fmjs` with no `/tree/` suffix
- [x] `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — modified, contains `github.com/fmillanjs/fmjs` with no `/tree/` suffix
- [x] Commit 73ea0d6 exists
- [x] Target URL returns HTTP 200
