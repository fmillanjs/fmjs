---
phase: 29-lenis-foundation
plan: 03
subsystem: testing
tags: [lighthouse, performance, lenis, ci, scroll, portfolio]

# Dependency graph
requires:
  - phase: 29-01
    provides: LenisProvider with ReactLenis root and lenis/dist/lenis.css in globals.css — the Lenis install under test
  - phase: 29-02
    provides: CommandPalette with useLenis() scroll lock — completes all 4 SCROLL requirements

provides:
  - Lighthouse CI results confirming all 5 portfolio URLs score 1.00 (100%) performance with Lenis active
  - Phase 29 CI gate passed — SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-04 all verified
affects: [30-gsap-scrolltrigger, any future phase that modifies portfolio layout performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lighthouse CI run uses CHROME_PATH=~/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome to avoid WSL2 Windows Chrome path collision"
    - "lighthouserc.json startServerCommand uses node .next/standalone/apps/web/server.js — requires full build before lhci autorun"

key-files:
  created: []
  modified:
    - apps/web/.lighthouseci/assertion-results.json
    - apps/web/.lighthouseci/links.json
    - apps/web/.lighthouseci/lhr-1771648745495.json
    - apps/web/.lighthouseci/lhr-1771648755824.json
    - apps/web/.lighthouseci/lhr-1771648765836.json
    - apps/web/.lighthouseci/lhr-1771648775826.json
    - apps/web/.lighthouseci/lhr-1771648785880.json
    - apps/web/.lighthouseci/lhr-1771648795970.json
    - apps/web/.lighthouseci/lhr-1771648806102.json
    - apps/web/.lighthouseci/lhr-1771648816255.json
    - apps/web/.lighthouseci/lhr-1771648826429.json
    - apps/web/.lighthouseci/lhr-1771648836535.json
    - apps/web/.lighthouseci/lhr-1771648846653.json
    - apps/web/.lighthouseci/lhr-1771648856777.json
    - apps/web/.lighthouseci/lhr-1771648866961.json
    - apps/web/.lighthouseci/lhr-1771648877030.json
    - apps/web/.lighthouseci/lhr-1771648887070.json

key-decisions:
  - "Used CHROME_PATH env var to override LHCI's default Chrome detection — WSL2 resolves system Chrome to Windows path (C:\\Users\\...) causing ECONNREFUSED; puppeteer's Linux Chrome at ~/.cache/puppeteer/... works correctly"
  - "Ran full npm build before lhci autorun — lighthouserc.json startServerCommand requires .next/standalone build output; no .next/standalone existed from previous build"
  - "All 5 URLs scored 1.00 performance — Lenis RAF loop, lenis/dist/lenis.css, and LenisProvider hydration introduce zero performance cost at this portfolio scale"

patterns-established:
  - "Pattern: LHCI on WSL2 requires CHROME_PATH=~/.cache/puppeteer/chrome/[version]/chrome-linux64/chrome to avoid Windows Chrome path resolution"

requirements-completed: [SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-04]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 29 Plan 03: Lighthouse CI Gate Summary

**All 5 portfolio URLs score 1.00 (100%) Lighthouse performance with Lenis active — zero performance regression from ReactLenis RAF loop, lenis/dist/lenis.css, or LenisProvider hydration**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-21T04:35:45Z
- **Completed:** 2026-02-21T04:43:00Z
- **Tasks:** 1
- **Files modified:** 17 (Lighthouse CI artifacts)

## Accomplishments

- Built fresh production standalone build with all Lenis changes active (29-01 + 29-02)
- Ran Lighthouse CI 3 runs per URL against all 5 portfolio URLs: /, /projects, /projects/teamflow, /projects/devcollab, /contact
- All 15 runs (3 per URL x 5 URLs) scored 1.00 performance — far exceeding the 0.90 gate
- Assertion results: only accessibility warnings (not errors, not in scope for this plan); zero performance errors
- Phase 29 (Lenis Foundation) CI gate fully passed

## Lighthouse CI Results

| URL | Run 1 | Run 2 | Run 3 | Gate |
|-----|-------|-------|-------|------|
| `http://localhost:3000/` | 1.00 | 1.00 | 1.00 | PASS |
| `http://localhost:3000/projects` | 1.00 | 1.00 | 1.00 | PASS |
| `http://localhost:3000/projects/teamflow` | 1.00 | 1.00 | 1.00 | PASS |
| `http://localhost:3000/projects/devcollab` | 1.00 | 1.00 | 1.00 | PASS |
| `http://localhost:3000/contact` | 1.00 | 1.00 | 1.00 | PASS |

All scores on the 0-1 scale (1.00 = 100%). Gate threshold: 0.90 (90%).

## Task Commits

1. **Task 1: Run Lighthouse CI gate on all 5 portfolio URLs** - `f1d08a6` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `apps/web/.lighthouseci/lhr-1771648745495.json` through `lhr-1771648887070.json` — 15 fresh LHR JSON reports (3 per URL)
- `apps/web/.lighthouseci/assertion-results.json` — Updated: only accessibility warnings, zero performance failures
- `apps/web/.lighthouseci/links.json` — Updated: fresh report links uploaded to temporary public storage

## Decisions Made

- Used `CHROME_PATH=~/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome` to run LHCI. WSL2 resolves system Chrome to the Windows path (`C:\Users\Fernando\AppData\Local\...`) which causes `ECONNREFUSED` when LHCI tries to connect to Chrome DevTools. Puppeteer caches a native Linux Chrome binary that works correctly in WSL2.
- Ran `npm run build --workspace=apps/web` (not `pnpm --filter web build`) — project uses npm workspaces, not pnpm.
- The existing `.next/standalone` build was from Feb 19 (before Lenis changes) so a fresh build was required to test with Lenis active.

## Deviations from Plan

None - plan executed exactly as written, with one adaptation to the Chrome path for WSL2 environment (expected WSL2-specific environment detail).

## Issues Encountered

- **WSL2 Chrome path collision:** First `npx lhci autorun` failed with `ECONNREFUSED 127.0.0.1:[port]` because LHCI launched Windows Chrome (via WSL2 path resolution) which could not bind to a Linux socket. Resolved by setting `CHROME_PATH` to puppeteer's Linux Chrome binary.
- **No standalone build:** lighthouserc.json uses `node .next/standalone/apps/web/server.js` as the server command, but no `.next/standalone` existed from the previous build (it was from Feb 19). Built fresh with `npm run build --workspace=apps/web`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 29 (Lenis Foundation) is COMPLETE: all 4 SCROLL requirements (SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-04) implemented and CI-gate verified
- Phase 30 (GSAP ScrollTrigger) can begin — note: will require updating `LenisProvider` from `autoRaf: true` to `autoRaf: false` + `gsap.ticker.add((time) => lenis.raf(time * 1000))` to prevent double RAF loop jitter
- No `pin: true` in any ScrollTrigger — CLS spacer would break the 0.90 Lighthouse gate proven here

## Self-Check: PASSED

- FOUND: apps/web/.lighthouseci/lhr-1771648745495.json (and all 15 fresh JSON reports)
- FOUND: apps/web/.lighthouseci/assertion-results.json (updated — zero performance failures)
- FOUND: apps/web/.lighthouseci/links.json (updated with fresh report links)
- FOUND: commit f1d08a6 (Task 1 — Lighthouse CI gate run)
- All 5 URLs confirmed 1.00 performance score from JSON reports via node -e verification

---
*Phase: 29-lenis-foundation*
*Completed: 2026-02-21*
