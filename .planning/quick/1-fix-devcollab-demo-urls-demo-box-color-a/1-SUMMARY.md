---
phase: quick-1
plan: "01"
subsystem: portfolio/projects
tags: [fix, ux, links, styling, matrix-theme]
dependency_graph:
  requires: []
  provides: [corrected-devcollab-urls, matrix-consistent-demo-boxes, correct-github-links]
  affects: [devcollab-case-study, teamflow-case-study]
tech_stack:
  added: []
  patterns: [matrix-green-border-token, env-var-url-pattern]
key_files:
  modified:
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
    - apps/web/.env.local
decisions:
  - "Remaining bg-accent at teamflow/page.tsx:193 (Solution section note) intentionally left unchanged — plan scope is demo boxes only"
  - "NEXT_PUBLIC_DEVCOLLAB_URL not committed to git (correctly gitignored); file updated on disk only"
  - "Used https://devcollab.fernandomillan.dev as production URL per plan's best-guess domain pattern"
metrics:
  duration: "~5 min"
  completed: "2026-02-21"
  tasks: 2
  files: 3
---

# Quick Task 1: Fix DevCollab Demo URLs, Demo Box Color, and View Source Links Summary

**One-liner:** Fixed DevCollab production URL env var, replaced blue bg-accent demo boxes with Matrix green border styling on both project case study pages, and corrected View Source GitHub links to branch-specific monorepo URLs.

## Tasks Completed

### Task 1: Fix DevCollab demo URLs and add env var

**File:** `apps/web/.env.local`

Added `NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.dev` to the env file.

- The `devcollab/page.tsx` already had the correct pattern: `const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'http://localhost:3002'`
- Setting this env var causes the production build to resolve "View Live Demo" and "Launch Demo" buttons to the actual live URL
- File is gitignored (correct behavior for `.env.local`); change applied to disk only
- URL used: `https://devcollab.fernandomillan.dev` — best-guess production URL per domain pattern; confirm this is the actual deployed URL

**Commit:** N/A (file is gitignored — not committed, applied to disk)

### Task 2: Fix "Try the Demo" box colors and View Source links

**Files:** `apps/web/app/(portfolio)/projects/devcollab/page.tsx`, `apps/web/app/(portfolio)/projects/teamflow/page.tsx`

**Commit:** `8c0fdb0`

#### devcollab/page.tsx changes:

1. **View Source link fixed:**
   - Before: `https://github.com/fmillanjs/devcollab` (incorrect repo, does not exist)
   - After: `https://github.com/fmillanjs/fmjs/tree/devcollab` (correct branch-specific URL)

2. **Try the Demo box styling fixed:**
   - Before: `className="mt-8 p-6 bg-accent border border-border rounded-lg"` (renders as blue Radix accent)
   - After: `className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg"` (Matrix-consistent dark card with green border)

#### teamflow/page.tsx changes:

1. **View Source link fixed:**
   - Before: `https://github.com/fmillanjs/teamflow` (incorrect repo, does not exist)
   - After: `https://github.com/fmillanjs/fmjs/tree/teamflow` (correct branch-specific URL)

2. **Try the Demo box styling fixed:**
   - Before: `className="mt-8 p-6 bg-accent border border-border rounded-lg"` (renders as blue)
   - After: `className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg"` (Matrix green border)

**Note:** `teamflow/page.tsx` line 193 (Solution section informational note) still uses `bg-accent`. This box is NOT a "Try the Demo" box and was intentionally left unchanged per plan scope ("Do NOT change any other styling beyond the `bg-accent` replacement for the demo boxes").

## DevCollab URL Confirmation Needed

The production URL `https://devcollab.fernandomillan.dev` was used as a best-guess based on the domain pattern (portfolio is at `fernandomillan.dev`). If DevCollab is deployed at a different URL, update `apps/web/.env.local`:

```
NEXT_PUBLIC_DEVCOLLAB_URL=https://your-actual-devcollab-url.com
```

## Deviations from Plan

None — plan executed exactly as written. The `.env.local` not being committed is expected behavior (gitignored by design).

## Self-Check

- [x] `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — FOUND, modified
- [x] `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — FOUND, modified
- [x] `apps/web/.env.local` — FOUND, modified (not committed, gitignored)
- [x] Commit `8c0fdb0` — FOUND in git log
- [x] No `bg-accent` on demo boxes (devcollab: 0 instances, teamflow Try the Demo: 0 instances)
- [x] Both View Source links point to `fmillanjs/fmjs` branch URLs
- [x] `NEXT_PUBLIC_DEVCOLLAB_URL` present in `.env.local` with non-localhost value
- [x] TypeScript errors in output are pre-existing (e2e test files, api.test.ts) — not introduced by these changes

## Self-Check: PASSED
