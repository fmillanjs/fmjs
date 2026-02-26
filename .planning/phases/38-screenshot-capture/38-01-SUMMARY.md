---
phase: 38-screenshot-capture
plan: 01
subsystem: testing
tags: [playwright, screenshot, chromium, typescript, tsx]

# Dependency graph
requires: []
provides:
  - "5 TeamFlow PNG screenshots at exactly 1280x800 pixels in apps/web/public/screenshots/"
  - "Playwright capture script at apps/web/e2e/screenshots/teamflow-capture.ts"
affects: [39-walkthrough-component]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone Playwright chromium.launch() script (not test runner) for production screenshot capture"
    - "tsx as TypeScript executor for standalone scripts"
    - "Per-screenshot try/catch with fallback to current page state ensures all 5 files always exist"

key-files:
  created:
    - apps/web/e2e/screenshots/teamflow-capture.ts
    - apps/web/public/screenshots/teamflow-kanban.png
    - apps/web/public/screenshots/teamflow-presence.png
    - apps/web/public/screenshots/teamflow-task-modal.png
    - apps/web/public/screenshots/teamflow-rbac.png
    - apps/web/public/screenshots/teamflow-audit-log.png
  modified: []

key-decisions:
  - "Used chromium.launch() directly (not Playwright test runner) so script runs standalone without test config"
  - "Viewport set to 1280x800, screenshots use fullPage: false to guarantee exact pixel dimensions"
  - "../../public/screenshots is the correct relative path from apps/web/e2e/screenshots/ (not ../../../)"
  - "Audit log route confirmed as /teams/{teamId}/audit-log (not /activity or /audit)"
  - "Run with npx tsx (tsx v4.21.0) — confirmed available in the project"
  - "Script authenticates inline per session (not storageState) against live production URL"

patterns-established:
  - "Navigate /teams -> get first team ID -> navigate /teams/{id} -> get first project ID (skip 'new') -> navigate to project board"
  - "For task modal: click button[name='New Task'], wait for role='dialog'"
  - "For RBAC: /teams/{teamId}/settings shows member list with roles (ADMIN-only access, demo1 is ADMIN)"
  - "For audit log: /teams/{teamId}/audit-log is the confirmed route"

requirements-completed: [SHOT-01]

# Metrics
duration: 4min
completed: 2026-02-26
---

# Phase 38 Plan 01: TeamFlow Screenshot Capture Summary

**Playwright chromium.launch() script captures 5 TeamFlow production screenshots at 1280x800px saved to apps/web/public/screenshots/**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-26T09:09:00Z
- **Completed:** 2026-02-26T09:12:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Standalone Playwright script written at apps/web/e2e/screenshots/teamflow-capture.ts using chromium.launch()
- All 5 TeamFlow PNG files captured at exactly 1280x800 pixels confirmed by `file` command
- Script authenticates against live production (teamflow.fernandomillan.me) with demo1@teamflow.dev

## Task Commits

Each task was committed atomically:

1. **Task 1: Write TeamFlow Playwright screenshot capture script** - `6a6b63b` (feat)
2. **Task 2: Execute TeamFlow capture script and verify 5 PNG files** - `de1c913` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `apps/web/e2e/screenshots/teamflow-capture.ts` - Standalone Playwright capture script with login + 5 screenshots + error handling
- `apps/web/public/screenshots/teamflow-kanban.png` - Kanban board (project board page), 79KB, 1280x800
- `apps/web/public/screenshots/teamflow-presence.png` - Real-time presence (team detail page), 64KB, 1280x800
- `apps/web/public/screenshots/teamflow-task-modal.png` - Task creation modal open on board page, 70KB, 1280x800
- `apps/web/public/screenshots/teamflow-rbac.png` - RBAC team settings page with member roles, 59KB, 1280x800
- `apps/web/public/screenshots/teamflow-audit-log.png` - Audit log page (/teams/{id}/audit-log), 51KB, 1280x800

## Decisions Made

- Used `chromium.launch()` directly rather than test runner — avoids playwright.config.ts dependency and baseURL/localhost conflicts
- `fullPage: false` on all screenshots ensures viewport-only capture at exactly 1280x800 (not full page scroll)
- Script is invoked with `npx tsx` (tsx v4.21.0 already in project) from apps/web directory
- Inline per-session auth (not storageState) since this targets production not localhost

## Navigation Paths Used

| Screenshot | Route navigated | Notes |
|---|---|---|
| teamflow-kanban.png | /teams/{teamId}/projects/{projectId} | Board page with kanban columns |
| teamflow-presence.png | /teams/{teamId} | Team detail shows member online indicators |
| teamflow-task-modal.png | /teams/{teamId}/projects/{projectId} then click "New Task" | Modal opens via button click |
| teamflow-rbac.png | /teams/{teamId}/settings | Admin-only settings page with member role management |
| teamflow-audit-log.png | /teams/{teamId}/audit-log | Confirmed route from Next.js file structure |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SCREENSHOTS_DIR path depth (../../../ vs ../../)**
- **Found during:** Task 2 (Execute capture script)
- **Issue:** Plan specified `path.resolve(__dirname, '../../../public/screenshots')` which resolved to `apps/public/screenshots` instead of `apps/web/public/screenshots`. The script file is at `apps/web/e2e/screenshots/` so only 2 levels up are needed.
- **Fix:** Changed `../../../` to `../../` in SCREENSHOTS_DIR constant
- **Files modified:** apps/web/e2e/screenshots/teamflow-capture.ts
- **Verification:** Output directory confirmed as `/home/doctor/fernandomillan/apps/web/public/screenshots`
- **Committed in:** de1c913 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed project ID extraction to skip "new" route**
- **Found during:** Task 2 (Execute capture script)
- **Issue:** `page.locator('a[href*="/projects/"]').first()` matched the "New Project" link with href `/projects/new`, resulting in projectId = `new` and navigating to `/projects/new` (creation form) instead of an actual project board
- **Fix:** Changed to iterate all project links and skip any where the extracted ID equals `new`
- **Files modified:** apps/web/e2e/screenshots/teamflow-capture.ts
- **Verification:** projectId now correctly resolves to `cmm2tvn43000im086h2bnzkjh`
- **Committed in:** de1c913 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed audit log route from /activity to /audit-log**
- **Found during:** Task 2 (Execute capture script — route discovery)
- **Issue:** Plan specified trying `/activity` and `/audit` routes, but the actual Next.js route is `/teams/{teamId}/audit-log` (confirmed from apps/web/app/(dashboard)/teams/[teamId]/audit-log/page.tsx)
- **Fix:** Updated route to directly navigate `/teams/${teamId}/audit-log` first
- **Files modified:** apps/web/e2e/screenshots/teamflow-capture.ts
- **Verification:** Audit log screenshot captured at 51KB showing activity entries
- **Committed in:** de1c913 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug fixes)
**Impact on plan:** All fixes required for correct screenshot output. No scope creep.

## Issues Encountered

- Initial run saved files to wrong directory (apps/public/screenshots) — caught by checking output path in script logs and corrected with path fix above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 TeamFlow PNG screenshots ready at 1280x800 for Phase 39 WalkthroughSection component
- Script can be re-run at any time to refresh screenshots: `cd apps/web && npx tsx e2e/screenshots/teamflow-capture.ts`
- DevCollab screenshots (devcollab-search.png, devcollab-workspace.png) already exist from Phase 36

---
*Phase: 38-screenshot-capture*
*Completed: 2026-02-26*
