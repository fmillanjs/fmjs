---
phase: 14-monorepo-scaffold-infrastructure
plan: 04
subsystem: infra
tags: [ci-cd, github-actions, docker, ghcr, devcollab]

dependency_graph:
  requires:
    - phase: 14-02
      provides: devcollab-api and devcollab-web Dockerfiles for CI to build
  provides:
    - build-and-push-devcollab CI job building devcollab-web and devcollab-api Docker images
    - GHCR push for both images with :latest and :sha tags on push to main
  affects: [21-deployment]

tech-stack:
  added: []
  patterns:
    - Parallel CI build jobs — devcollab builds independently from TeamFlow builds, both need test job to pass
    - Inline Docker layer cache via type=inline stored in GHCR image metadata

key-files:
  created: []
  modified:
    - .github/workflows/deploy.yml

key-decisions:
  - "build-and-push-devcollab uses needs: [test] only (not lighthouse) — DevCollab images do not require Lighthouse CI to pass, matching the intent of fast delivery"
  - "Both devcollab images built in same job as sequential steps — shares checkout, buildx setup, GHCR login to save CI minutes"

patterns-established:
  - "New app image jobs follow identical pattern: checkout, buildx, GHCR login, build-push with :latest and :sha tags, inline cache"

requirements-completed: [INFRA-04]

duration: 1min
completed: "2026-02-17"
---

# Phase 14 Plan 04: CI/CD DevCollab Image Pipeline Summary

**Extended deploy.yml with build-and-push-devcollab job that builds and pushes devcollab-web and devcollab-api Docker images to GHCR with :latest and git-sha tags after test job passes.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-17T22:40:29Z
- **Completed:** 2026-02-17T22:41:36Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `build-and-push-devcollab` job to CI/CD pipeline with `needs: [test]` dependency
- devcollab-web image published to `ghcr.io/<repo>/devcollab-web` with `:latest` and `:<git-sha>` tags
- devcollab-api image published to `ghcr.io/<repo>/devcollab-api` with `:latest` and `:<git-sha>` tags
- Existing TeamFlow `build-and-push` and `deploy` jobs unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add build-and-push-devcollab job to deploy.yml** - `30bb001` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `.github/workflows/deploy.yml` - Added 42-line build-and-push-devcollab job after existing build-and-push job

## Decisions Made

- `build-and-push-devcollab` uses `needs: [test]` (not `[test, lighthouse]`) — DevCollab images need tests to pass but do not require Lighthouse scores to complete. This is the correct interpretation per the plan spec.
- Both devcollab-web and devcollab-api images are built in the same job as sequential steps — shared checkout, buildx setup, and GHCR login reduces CI minutes vs two separate jobs.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. GITHUB_TOKEN with `packages: write` permission was already present in the existing workflow permissions block.

## Next Phase Readiness

- INFRA-04 complete: DevCollab Docker images will be available in GHCR after first push to main
- Phase 21 (Deployment) can reference `ghcr.io/<repo>/devcollab-web:latest` and `ghcr.io/<repo>/devcollab-api:latest` for Coolify deployment configuration
- All Phase 14 plans complete: Prisma client isolation (14-01), app workspaces (14-02), Docker Compose (14-03), CI/CD images (14-04)

---
*Phase: 14-monorepo-scaffold-infrastructure*
*Completed: 2026-02-17*

## Self-Check: PASSED

Files verified:
- .github/workflows/deploy.yml: build-and-push-devcollab job - FOUND
- .planning/phases/14-monorepo-scaffold-infrastructure/14-04-SUMMARY.md - FOUND

Commits verified:
- 30bb001: feat(14-04): add build-and-push-devcollab job - FOUND
