---
phase: 35-full-qa-audit-and-fixes
plan: 02
subsystem: infra
tags: [nextjs, curl, qa, logout, reverse-proxy, x-forwarded-host, devcollab]

# Dependency graph
requires:
  - phase: 35-full-qa-audit-and-fixes
    provides: Plan 01 complete — TeamFlow CTA fixed, apps confirmed live
  - phase: 34-live-auth-investigation-and-fix
    provides: Both apps live in production with working auth, COOKIE_DOMAIN=.fernandomillan.me
provides:
  - Full DevCollab recruiter flow verified end-to-end (login → workspace → snippets → posts → search → notifications → logout)
  - Logout redirect fixed to use x-forwarded-host headers instead of internal container URL
affects: [35-full-qa-audit-and-fixes, devcollab-web]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reverse proxy URL construction: use x-forwarded-proto + x-forwarded-host headers, not req.url (resolves to internal 0.0.0.0 container address)"
    - "DevCollab API is served at devcollab-api.fernandomillan.me (separate subdomain), not devcollab.fernandomillan.me/api"

key-files:
  created: []
  modified:
    - apps/devcollab-web/app/api/logout/route.ts

key-decisions:
  - "Use x-forwarded-host header for logout redirect URL — req.url resolves to internal container address (0.0.0.0:80) behind Coolify reverse proxy, not the public domain"
  - "Fallback to devcollab.fernandomillan.me hardcoded string if x-forwarded-host is absent, avoiding blank redirects"
  - "Cookie cleared from Next.js side as safety measure in addition to API-side Set-Cookie clear"

patterns-established:
  - "Redirect Pattern: Next.js API routes behind reverse proxy must use x-forwarded-proto/x-forwarded-host for public URL construction — never use req.url directly"

requirements-completed: [QA-01]

# Metrics
duration: 56min
completed: 2026-02-26
---

# Phase 35 Plan 02: DevCollab Full Recruiter Flow QA and Logout Fix Summary

**Full DevCollab recruiter flow verified end-to-end; logout redirect bug fixed by replacing `req.url` (resolved to `0.0.0.0:80`) with `x-forwarded-host` header-based URL construction**

## Performance

- **Duration:** 56 min (includes human walkthrough and CI/CD redeploy wait)
- **Started:** 2026-02-26T03:36:30Z
- **Completed:** 2026-02-26T04:32:32Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Automated API health check confirmed all DevCollab endpoints healthy: `/health` 200, login 200 with cookie, workspace 200 with 5 snippets + 3 posts, search 200 with results
- Human recruiter walkthrough confirmed steps 1-9 pass cleanly: login page with demo credentials displayed, login succeeds, workspace loads with content, snippets detail and posts Markdown render correctly, Cmd+K search returns results, bell notifications panel opens
- Fixed logout bug: `new URL('/login', req.url)` resolved to `https://0.0.0.0:80/login` (internal container address) — replaced with `x-forwarded-proto` + `x-forwarded-host` header construction
- Fix deployed via CI/CD and human confirmed logout now redirects to correct production URL

## Task Commits

1. **Task 1: Automated pre-walkthrough API health check** — no code changes (read-only curl verification)
2. **Task 2 (checkpoint): DevCollab recruiter walkthrough** — `b655251` (fix)

## Files Created/Modified

- `apps/devcollab-web/app/api/logout/route.ts` — Replaced `new URL('/login', _req.url)` with forwarded header-based URL construction using `x-forwarded-proto` + `x-forwarded-host` headers; fallback to `devcollab.fernandomillan.me` if headers absent

## Decisions Made

- Used `x-forwarded-host` instead of hardcoding the production domain directly in the redirect logic, making the fix work correctly even if the domain changes. Hardcoded fallback is still provided for safety.
- Retained the Next.js-side cookie deletion (`response.cookies.delete`) as a belt-and-suspenders measure alongside the API-side cookie clear.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed logout redirect resolving to internal container address**
- **Found during:** Task 2 checkpoint — human walkthrough step 10
- **Issue:** `new URL('/login', _req.url)` in `apps/devcollab-web/app/api/logout/route.ts` resolved `_req.url` to the internal container address `https://0.0.0.0:80/login` when running behind the Coolify reverse proxy
- **Fix:** Read `x-forwarded-proto` and `x-forwarded-host` headers set by the proxy; construct `${proto}://${host}` to build the correct public URL; fallback to `devcollab.fernandomillan.me` if headers absent
- **Files modified:** `apps/devcollab-web/app/api/logout/route.ts`
- **Verification:** Human confirmed logout now redirects correctly to `https://devcollab.fernandomillan.me/login`
- **Committed in:** `b655251`

---

**Total deviations:** 1 auto-fixed (bug — internal container URL on logout redirect)
**Impact on plan:** Fix was necessary for QA-01 recruiter flow to be complete. No scope creep.

## Issues Encountered

- `devcollab.fernandomillan.me/api/health` returned 404 — this is expected. The Next.js frontend serves all requests to `devcollab.fernandomillan.me`; the NestJS API is at `devcollab-api.fernandomillan.me`. The plan's health check URL was slightly wrong but the automated check adapted to use the correct subdomain.
- Search for "javascript" returns empty results — this is correct behavior. The tsvector search indexes content text, and none of the seeded snippets or posts contain the literal word "javascript". Searching "auth" returns the "Auth middleware pattern" snippet. Documented as expected behavior, not a bug.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- QA-01 is satisfied: full recruiter flow (login → workspace → snippets → posts → search → notifications → logout) confirmed working without errors
- DevCollab is ready for portfolio presentation to recruiters
- Phase 35 can proceed to remaining QA plans (visual polish, content review)

---
*Phase: 35-full-qa-audit-and-fixes*
*Completed: 2026-02-26*
