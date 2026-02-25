---
phase: 34-live-auth-investigation-fix
plan: "01"
subsystem: live-auth
tags: [diagnostics, bash-script, docker-compose, ci-cd, devcollab, teamflow]
dependency_graph:
  requires: []
  provides: [diagnostic-script, devcollab-seed-in-compose, devcollab-seed-ci-build]
  affects: [coolify-compose.yml, .github/workflows/deploy.yml]
tech_stack:
  added: []
  patterns: [bash diagnostic scripts, docker-compose service ordering]
key_files:
  created:
    - scripts/diagnose-live-auth.sh
  modified:
    - coolify-compose.yml
    - .github/workflows/deploy.yml
decisions:
  - "devcollab-api now depends on devcollab-seed (not devcollab-migrate) so seed always runs before API accepts traffic"
  - "devcollab-seed image build added to CI build-and-push-devcollab job so image exists in GHCR"
  - "Diagnostic script tries both known API subdomain patterns (devcollab-api.* and api-devcollab.*) automatically"
metrics:
  duration: "~2 min"
  completed: "2026-02-25"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 3
---

# Phase 34 Plan 01: Live Auth Diagnosis + Seed Fix Summary

**One-liner:** Executable 7-section curl diagnostic script for DevCollab + TeamFlow auth, plus devcollab-seed wired into production compose and CI so demo users are seeded on every deployment.

## What Was Built

### Task 1: scripts/diagnose-live-auth.sh (commit c72ddd8)

A 201-line bash script that diagnoses all known live auth failure classes:

- **Section 1:** DevCollab API health — tries both `devcollab-api.*` and `api-devcollab.*` subdomain patterns automatically, reports which domain is live
- **Section 2:** DevCollab login attempt with `admin@demo.devcollab / Demo1234!` including `Origin` header to surface CORS rejections
- **Section 3:** TeamFlow NextAuth `/api/auth/providers` endpoint — a 500 here means `NEXTAUTH_SECRET` or `NEXTAUTH_URL` is missing in Coolify
- **Section 4:** TeamFlow API health — tries both `api-teamflow.*` and `teamflow-api.*` patterns
- **Section 5:** TeamFlow `/api/auth/session` — 5xx response indicates NextAuth internal failure (Redis down or missing secret)
- **Section 6:** Printed VPS commands for `docker logs` across all four containers (devcollab-api, devcollab-web, teamflow-web, teamflow-api) with error-pattern grep filters
- **Section 7:** Printed VPS commands for `docker inspect` to extract and compare `JWT_SECRET` fingerprints between teamflow-web and teamflow-api — mismatch causes all API calls to return 401

The FINDINGS TEMPLATE at the bottom serves as a structured report template for the human to fill in after running all sections.

### Task 2: devcollab-seed in coolify-compose.yml + CI (commit bfb02b5)

- Added `devcollab-seed` service to `coolify-compose.yml` after `devcollab-migrate`, depending on `devcollab-migrate: condition: service_completed_successfully`
- Updated `devcollab-api` `depends_on` to point to `devcollab-seed: service_completed_successfully` instead of `devcollab-migrate` — ensures seed always runs before the API accepts traffic
- Added `Build and push devcollab-seed image` step to the `build-and-push-devcollab` CI job in `.github/workflows/deploy.yml`, using `packages/devcollab-database/Dockerfile.seed` as the build context
- The seed script is idempotent (checks for existing admin user before creating records) so running on every deployment is safe

## Deviations from Plan

### Auto-additions (within plan scope)

**1. devcollab-api depends_on updated to point to devcollab-seed**
- **Found during:** Task 2
- **Issue:** The plan specified adding devcollab-seed with depends_on devcollab-migrate, but left devcollab-api depending on devcollab-migrate. This would mean the API could start before the seed completes.
- **Fix:** Changed devcollab-api's depends_on from devcollab-migrate to devcollab-seed. This ensures ordering: postgres → migrate → seed → api.
- **Files modified:** coolify-compose.yml
- **Commit:** bfb02b5

## Checkpoint Status

Task 3 is a `checkpoint:human-action` gate. The human must:
1. Run `bash scripts/diagnose-live-auth.sh` from local machine
2. SSH into VPS and run sections 6-7 commands
3. Fill in the FINDINGS TEMPLATE at the bottom of the script
4. Share results to proceed to Plan 02 fixes

## Self-Check

All files exist and commits are verified below.
