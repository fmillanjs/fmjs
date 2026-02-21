---
phase: 27-infrastructure-foundation-prisma-fix
plan: 02
subsystem: ci-cd
tags: [github-actions, coolify, docker-compose, devcollab, deployment]
dependency_graph:
  requires: []
  provides: [deploy-devcollab-job, coolify-compose-file]
  affects: [devcollab-deployment, coolify-stack]
tech_stack:
  added: [fjogeleit/http-request-action@v1, coolify-compose.yml]
  patterns: [build-arg-baking, coolify-webhook-trigger, restart-no-policy]
key_files:
  created:
    - coolify-compose.yml
  modified:
    - .github/workflows/deploy.yml
decisions:
  - build-arg NEXT_PUBLIC_API_URL baked at Docker build time via GHA secret — not Coolify runtime env
  - devcollab-migrate restart: "no" prevents infinite loop after prisma migrate deploy exits 0
  - deploy-devcollab job has needs: build-and-push-devcollab to ensure images are in GHCR before Coolify pulls
metrics:
  duration: 1 minute
  completed: 2026-02-19
  tasks_completed: 2
  files_modified: 1
  files_created: 1
---

# Phase 27 Plan 02: CI/CD DevCollab Deployment Pipeline Summary

GHA workflow updated with build-arg NEXT_PUBLIC_API_URL baking and deploy-devcollab Coolify webhook trigger; coolify-compose.yml created with restart: "no" on devcollab-migrate to fix infinite restart loop.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add build-arg and deploy-devcollab job to GHA workflow | b930fd6 | .github/workflows/deploy.yml |
| 2 | Create coolify-compose.yml for production Coolify stack | 8392f7c | coolify-compose.yml |

## What Was Built

### Task 1: GitHub Actions Workflow Updates

Two additions to `.github/workflows/deploy.yml`:

**build-args on devcollab-web build step:**
```yaml
build-args: |
  NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_DEVCOLLAB_API_URL }}
```
This ensures the Next.js client bundle bakes the correct production API URL at build time (not runtime). Without this, the client bundle would have `undefined` as the API URL in production.

**deploy-devcollab job:**
```yaml
deploy-devcollab:
  name: Deploy DevCollab to Coolify
  runs-on: ubuntu-latest
  needs: build-and-push-devcollab
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Trigger DevCollab Coolify deployment
      uses: fjogeleit/http-request-action@v1
      with:
        url: ${{ secrets.COOLIFY_DEVCOLLAB_WEBHOOK_URL }}
        method: 'POST'
```
The `needs: build-and-push-devcollab` ensures all DevCollab images are fully pushed to GHCR before Coolify is triggered to pull and redeploy them.

### Task 2: coolify-compose.yml

Production Docker Compose for the Coolify DevCollab stack at repo root with:
- Pre-built GHCR images (no `build:` sections) for all services
- `devcollab-migrate` has `restart: "no"` — critical fix to prevent Coolify from looping the container after `prisma migrate deploy` exits 0
- `devcollab-api` depends on `devcollab-migrate` with `condition: service_completed_successfully`
- No `ports:` sections — Coolify's Traefik handles routing
- `NEXT_PUBLIC_API_URL` absent from web service env vars (baked at build time, not runtime)
- `devcollab-network` for internal container networking

## Required User Setup

Before the new CI/CD pipeline can function, two GitHub repository secrets must be added:

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_DEVCOLLAB_API_URL` | `https://devcollab-api.fernandomillan.dev` |
| `COOLIFY_DEVCOLLAB_WEBHOOK_URL` | Coolify UI → DevCollab stack → Settings → Deploy Webhook URL |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All 5 verification checks passed:
1. GHA YAML valid — python3 yaml.safe_load passes
2. Coolify YAML valid — python3 yaml.safe_load passes
3. `NEXT_PUBLIC_DEVCOLLAB_API_URL` found in deploy.yml build-args
4. `deploy-devcollab` job present in deploy.yml
5. `restart: "no"` present on devcollab-migrate in coolify-compose.yml

## Self-Check: PASSED

All files verified present:
- FOUND: .github/workflows/deploy.yml
- FOUND: coolify-compose.yml
- FOUND: 27-02-SUMMARY.md

All commits verified:
- FOUND: b930fd6 (Task 1)
- FOUND: 8392f7c (Task 2)
