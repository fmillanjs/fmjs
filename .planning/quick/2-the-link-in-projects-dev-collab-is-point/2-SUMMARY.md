---
phase: quick-2
plan: "01"
subsystem: portfolio/devcollab-page
tags: [bug-fix, url, devcollab, env]
key-files:
  modified:
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/.env.local
decisions:
  - "Production URL as hardcoded fallback in DEVCOLLAB_URL constant — .env.local is gitignored so localhost fallback was firing in all deployments"
  - "NEXT_PUBLIC_DEVCOLLAB_URL in .env.local corrected from .dev to .me suffix for local dev parity"
metrics:
  duration: "< 2 min"
  completed: "2026-02-21"
  tasks_completed: 1
  files_modified: 2
---

# Quick Task 2: Fix DevCollab Live Demo URL Summary

**One-liner:** Replaced `http://localhost:3002` hardcoded fallback with `https://devcollab.fernandomillan.me` in devcollab/page.tsx so "View Live Demo" and "Launch Demo" buttons work in production without needing the env var.

## What Was Changed

### apps/web/app/(portfolio)/projects/devcollab/page.tsx (line 8)

Before:
```
const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'http://localhost:3002';
```

After:
```
const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'https://devcollab.fernandomillan.me';
```

The `.env.local` file is gitignored and not present in any deployment environment. The previous fallback `http://localhost:3002` fired on every production visit, sending recruiters to a broken localhost URL. The fix makes the production URL the actual default — the env var can still override for local dev if desired.

### apps/web/.env.local (line 17)

Before:
```
NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.dev
```

After:
```
NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.me
```

The quick-1 task had set this value but used the wrong `.dev` TLD. Corrected to `.me` to match the actual deployed domain.

## Verification Results

- `devcollab.fernandomillan.me` appears at line 8 of page.tsx — PASS
- `NEXT_PUBLIC_DEVCOLLAB_URL` in .env.local shows `.me` URL — PASS
- No `localhost:3002` remains in the DEVCOLLAB_URL constant — PASS
- No `fernandomillan.dev` remains in .env.local — PASS

## Git Commit

- **Commit:** `3d3eabd` — `fix(quick-2): fix DevCollab URL fallback from localhost to production .me domain`
- **Files committed:** `apps/web/app/(portfolio)/projects/devcollab/page.tsx` (1 change)
- Note: `.env.local` is gitignored — change made locally, not in git history (by design)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `apps/web/app/(portfolio)/projects/devcollab/page.tsx` exists with correct URL
- [x] `apps/web/.env.local` exists with correct URL
- [x] Commit `3d3eabd` exists in git log
