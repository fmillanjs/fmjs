---
phase: 35-full-qa-audit-and-fixes
plan: 01
subsystem: ui
tags: [nextjs, playwright, e2e, portfolio, cta, link-fix]

# Dependency graph
requires:
  - phase: 34-live-auth-investigation-and-fix
    provides: Both TeamFlow and DevCollab apps live in production at their respective subdomains
provides:
  - Fixed TeamFlow case study CTA links pointing to absolute production URL
  - Playwright regression test asserting CTA hrefs contain correct production hostnames
affects: [35-full-qa-audit-and-fixes, portfolio-web]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Portfolio case study CTAs use absolute production URLs (not relative paths)"
    - "Playwright tests use getByRole semantic selectors for CTA href assertions"

key-files:
  created: []
  modified:
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
    - apps/web/e2e/portfolio/navigation.spec.ts

key-decisions:
  - "Use absolute production URL href='https://teamflow.fernandomillan.me' for case study CTAs — relative /teams causes 404 on fernandomillan.me"
  - "Playwright CTA test uses baseURL localhost:3000 (local dev server) not production to keep tests self-contained"
  - "Pre-existing 'navigation links work' test failure is out of scope — unrelated clicking issue on homepage nav"

patterns-established:
  - "CTA Pattern: External app links in portfolio must always use absolute https:// URLs"
  - "E2E Pattern: Use getAttribute('href') + toContain() for asserting external link destinations"

requirements-completed: [QA-03]

# Metrics
duration: 8min
completed: 2026-02-25
---

# Phase 35 Plan 01: TeamFlow CTA Link Fix and Playwright CTA Assertions Summary

**Fixed broken TeamFlow "View Live Demo" CTA (href="/teams" -> https://teamflow.fernandomillan.me) and added Playwright regression tests asserting both case study CTAs contain correct production hostnames**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-25T00:00:00Z
- **Completed:** 2026-02-25T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced both relative `href="/teams"` occurrences in TeamFlow case study with `href="https://teamflow.fernandomillan.me"` — recruiters can now click "View Live Demo" without hitting a 404
- Added Playwright test asserting TeamFlow CTA href contains `teamflow.fernandomillan.me`
- Added Playwright test asserting DevCollab CTA href contains `devcollab.fernandomillan.me`
- Both fixes pushed to main — CI/CD rebuilds portfolio-web automatically

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix TeamFlow case study CTA links** - `421a5d1` (fix)
2. **Task 2: Extend Playwright navigation spec with CTA href assertions** - `cf80ddc` (test)

## Files Created/Modified

- `apps/web/app/(portfolio)/projects/teamflow/page.tsx` - Fixed 2 occurrences of `href="/teams"` to `href="https://teamflow.fernandomillan.me"` (hero section + bottom CTA section)
- `apps/web/e2e/portfolio/navigation.spec.ts` - Added "case study live demo CTAs point to production URLs" test block with assertions for both TeamFlow and DevCollab

## Decisions Made

- Used absolute production URL directly in the `href` attribute rather than an env var — portfolio case study pages are static and the URL is stable
- Playwright CTA test runs against local dev server (baseURL: localhost:3000) via relative paths, which verifies the href attribute value without actually navigating to the external production URL
- Left the GitHub source link (`href="https://github.com/fmillanjs/fmjs"`) unchanged as specified in the plan (out of scope for QA-03)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The Playwright "navigation links work" test has a pre-existing failure (clicking About nav link on homepage stays on /). This is unrelated to this plan's changes and was observed before our edits. Logged as out-of-scope. The new CTA test passed cleanly: 10/11 tests pass (same as before our changes).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TeamFlow CTA fix is live once CI/CD rebuilds the portfolio-web image
- Playwright CTA regression test protects against future CTA regressions
- Phase 35 can proceed to remaining QA audit tasks (visual review, content polish)

---
*Phase: 35-full-qa-audit-and-fixes*
*Completed: 2026-02-25*
