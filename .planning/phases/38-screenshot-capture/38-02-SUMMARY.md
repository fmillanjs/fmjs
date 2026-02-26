---
phase: 38-screenshot-capture
plan: "02"
subsystem: screenshot-assets
tags: [playwright, screenshots, devcollab, assets]
dependency_graph:
  requires: []
  provides: [devcollab-screenshot-assets]
  affects: [phase-39-walkthrough-component]
tech_stack:
  added: []
  patterns: [chromium-launch-headless, viewport-1280x800, tsx-e2e-script]
key_files:
  created:
    - apps/web/e2e/screenshots/devcollab-capture.ts
    - apps/web/public/screenshots/devcollab-workspace.png
    - apps/web/public/screenshots/devcollab-code-snippet.png
    - apps/web/public/screenshots/devcollab-thread.png
    - apps/web/public/screenshots/devcollab-search.png
    - apps/web/public/screenshots/devcollab-activity.png
  modified:
    - apps/web/public/screenshots/devcollab-workspace.png
    - apps/web/public/screenshots/devcollab-search.png
decisions:
  - "Used admin@demo.devcollab / Demo1234! credentials found in packages/devcollab-database/prisma/seed.ts"
  - "Path correction: ../../public/screenshots (not ../../../) from apps/web/e2e/screenshots/ when run via tsx"
  - "Used input[type=email]/input[type=password] selectors instead of getByLabel (labels lack htmlFor)"
  - "ID helper filters out /new path to get actual resource IDs from listing pages"
metrics:
  duration: "~12 minutes"
  completed: "2026-02-26"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 38 Plan 02: DevCollab Screenshot Capture Summary

**One-liner:** Playwright headless capture of 5 DevCollab workflow screenshots (workspace, Shiki code snippet, @mention thread, Cmd+K search, activity feed) at 1280x800 against live production app.

## What Was Built

A standalone Playwright script (`devcollab-capture.ts`) that authenticates against `devcollab.fernandomillan.me`, navigates to each of 5 workflow areas, and captures PNG screenshots at exactly 1280x800 viewport dimensions.

### Screenshots Produced

| File | Size | Path | Content |
|------|------|------|---------|
| devcollab-workspace.png | 49KB | apps/web/public/screenshots/ | Posts feed — 3 published posts listed with author/date, nav bar visible |
| devcollab-code-snippet.png | 53KB | apps/web/public/screenshots/ | TypeScript JWT middleware snippet with Shiki syntax highlighting |
| devcollab-thread.png | 78KB | apps/web/public/screenshots/ | Post detail with threaded comments and @Casey Contributor mention visible |
| devcollab-search.png | 71KB | apps/web/public/screenshots/ | Cmd+K search modal open, "auth" query typed, results showing |
| devcollab-activity.png | 74KB | apps/web/public/screenshots/ | Activity feed with MemberJoined + PostCreated + SnippetCreated events |

## Credentials That Worked

- **Email:** `admin@demo.devcollab`
- **Password:** `Demo1234!`
- Found in: `packages/devcollab-database/prisma/seed.ts`
- Post-login redirect: `/w/devcollab-demo`

## Navigation Paths Used

| Screenshot | URL Pattern | Notes |
|-----------|-------------|-------|
| workspace | `/w/devcollab-demo/posts` | Posts list page provides richest feed overview |
| code-snippet | `/w/devcollab-demo/snippets/{first-id}` | First snippet from listing = TypeScript auth middleware |
| thread | `/w/devcollab-demo/posts/{first-id}` | First post has threaded comment with @mention from seed data |
| search | `/w/devcollab-demo/posts` + `Control+K` | Mounted in WorkspaceNav, opens on Ctrl+K; typed "auth" for results |
| activity | `/w/devcollab-demo/activity` | ActivityFeed component at `/activity` route |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect SCREENSHOTS_DIR path**
- **Found during:** Task 2 execution
- **Issue:** Script used `../../../public/screenshots` which resolved to `apps/public/screenshots` instead of `apps/web/public/screenshots` when tsx sets `__dirname` to the actual file directory
- **Fix:** Changed to `../../public/screenshots`
- **Files modified:** `apps/web/e2e/screenshots/devcollab-capture.ts`
- **Commit:** 848f755

**2. [Rule 1 - Bug] Fixed login form locator**
- **Found during:** Task 2 execution (first run)
- **Issue:** `getByLabel('Email')` timed out because the login page `<label>` elements lack `htmlFor` attributes (no association to inputs)
- **Fix:** Replaced with `locator('input[type="email"]')` and `locator('input[type="password"]')`
- **Files modified:** `apps/web/e2e/screenshots/devcollab-capture.ts`
- **Commit:** 848f755

**3. [Rule 1 - Bug] Fixed ID extraction to exclude /new path**
- **Found during:** Task 2 first successful run (screenshots were too small — code-snippet was 31KB)
- **Issue:** `getFirstSnippetId()` returned `"new"` (matched `/snippets/new`) so the code snippet page was the "New Snippet" form, not an actual snippet with Shiki highlight
- **Fix:** Iterates all matching links and skips any where the extracted ID equals `"new"`
- **Files modified:** `apps/web/e2e/screenshots/devcollab-capture.ts`
- **Commit:** 848f755

## Existing Screenshots Overwritten

Both `devcollab-workspace.png` and `devcollab-search.png` existed from v4.0 work. Both were intentionally overwritten by this plan's script to ensure consistent 1280x800 dimensions and fresh content.

## Self-Check: PASSED

All 6 files verified present on disk. Both task commits (59bd306, 848f755) confirmed in git log.
