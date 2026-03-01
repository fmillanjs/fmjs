---
phase: 46-demo-seed-portfolio-integration
plan: 02
subsystem: infra
tags: [docker, coolify, ci-cd, nextjs, nestjs, github-actions, sse, nginx]

# Dependency graph
requires:
  - phase: 46-01
    provides: seed script and DemoLead model ready for production deployment
  - phase: 44-nestjs-rest-sse
    provides: NestJS API with X-Accel-Buffering header on SSE endpoint
  - phase: 45-nextjs-frontend
    provides: Next.js app with standalone output mode configured
provides:
  - ai-sdr/web/Dockerfile — Next.js standalone image with NEXT_PUBLIC_API_URL build ARG
  - ai-sdr/Dockerfile.seed — minimal ts-node image running scripts/seed.ts
  - ai-sdr/coolify-compose.yml — 4-service stack with correct dependency chain
  - .github/workflows/deploy.yml — build-and-push-ai-sdr and deploy-ai-sdr jobs
affects: [46-03-portfolio-case-study, PORT-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NEXT_PUBLIC_ vars must be ARG at Docker build time — Next.js bakes them into client bundle, runtime ENV does not work
    - Seed container pattern: restart:no + depends_on service_healthy + service_completed_successfully chain
    - ci-cd pattern matches existing DevCollab jobs — append-only, no existing jobs modified

key-files:
  created:
    - ai-sdr/web/Dockerfile
    - ai-sdr/Dockerfile.seed
    - ai-sdr/coolify-compose.yml
  modified:
    - .github/workflows/deploy.yml

key-decisions:
  - "NEXT_PUBLIC_API_URL passed as Docker build ARG (not runtime ENV) — Next.js bakes NEXT_PUBLIC_ vars into client bundle at build time"
  - "Seed Dockerfile uses --skip-project flag on ts-node — avoids needing tsconfig.json in runner stage"
  - "coolify-compose dependency chain: postgres healthy → api healthy → seed completed → web starts — ensures seed runs after migrations and app starts after seed"
  - "build-and-push-ai-sdr needs only [test] (not lighthouse) to keep AI SDR CI independent of Teamflow lighthouse checks"

patterns-established:
  - "Pattern: standalone Next.js Dockerfile with ARG NEXT_PUBLIC_* at build time"
  - "Pattern: seed Dockerfile copying node_modules + prisma + scripts from builder to runner without pruning"

requirements-completed: [DEMO-01, DEMO-02]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 46 Plan 02: Docker + Coolify Deployment Summary

**Next.js standalone Dockerfile, seed container, coolify-compose.yml, and GitHub Actions CI/CD for AI SDR three-image stack deployment to Coolify**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T22:38:33Z
- **Completed:** 2026-03-01T22:46:33Z
- **Tasks:** 2 of 3 complete (Task 3 is checkpoint:human-verify awaiting Coolify deployment)
- **Files modified:** 4

## Accomplishments
- Created `ai-sdr/web/Dockerfile` with Next.js standalone output pattern and `ARG NEXT_PUBLIC_API_URL` at build time (required for NEXT_PUBLIC_ vars to be baked into client bundle)
- Created `ai-sdr/Dockerfile.seed` with ts-node runner using `--skip-project` flag, copying node_modules + prisma + scripts from builder
- Created `ai-sdr/coolify-compose.yml` with 4-service stack (postgres, api, seed, web) with correct healthcheck dependency chain
- Extended `.github/workflows/deploy.yml` with `build-and-push-ai-sdr` (builds api/web/seed images) and `deploy-ai-sdr` (triggers Coolify webhooks) jobs — append-only, no existing jobs modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ai-sdr web Dockerfile and coolify-compose.yml** - `b836c4f` (feat)
2. **Task 2: Add seed Dockerfile and extend CI/CD workflow for ai-sdr** - `6b40d4d` (feat)
3. **Task 3: Human verification — deploy to Coolify and verify SSE streaming** - CHECKPOINT (awaiting human)

## Files Created/Modified
- `ai-sdr/web/Dockerfile` — Next.js standalone multi-stage build with NEXT_PUBLIC_API_URL build ARG
- `ai-sdr/coolify-compose.yml` — 4-service Coolify stack with postgres → api → seed → web dependency chain
- `ai-sdr/Dockerfile.seed` — Minimal ts-node image running scripts/seed.ts with prisma schema
- `.github/workflows/deploy.yml` — Added build-and-push-ai-sdr and deploy-ai-sdr jobs (append-only)

## Decisions Made
- `NEXT_PUBLIC_API_URL` passed as Docker `ARG` (not runtime `ENV`) because Next.js bakes `NEXT_PUBLIC_` vars into the client bundle at build time — runtime ENV has no effect
- `ts-node --skip-project` flag avoids needing tsconfig.json in the runner stage of Dockerfile.seed
- Coolify compose dependency chain: `postgres` (healthy) → `api` (healthy) → `seed` (completed_successfully) → `web` (starts after seed completes)
- `build-and-push-ai-sdr` depends only on `[test]` not `[test, lighthouse]` — keeps AI SDR CI independent of Teamflow Lighthouse CI checks

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**Coolify and GitHub secrets require manual configuration before Task 3 checkpoint passes.**

Human must complete before pushing to main:
1. Add GitHub secrets: `COOLIFY_AI_SDR_API_WEBHOOK_URL`, `COOLIFY_AI_SDR_WEB_WEBHOOK_URL`, `NEXT_PUBLIC_AI_SDR_API_URL` (= `https://ai-sdr-api.fernandomillan.me`)
2. Configure Coolify services for `ai-sdr-api` at `ai-sdr-api.fernandomillan.me` with env vars: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `WEB_URL`
3. Configure Coolify service for `ai-sdr-web` at `ai-sdr.fernandomillan.me`
4. Push to main to trigger CI/CD

**Post-deployment verification:**
```bash
# Verify SSE header
curl -v https://ai-sdr-api.fernandomillan.me/leads/{leadId}/stream 2>&1 | grep -i "x-accel"
# Expected: < x-accel-buffering: no
```

## Next Phase Readiness
- Docker infrastructure and CI/CD pipeline ready — push to main will trigger full build
- Task 3 (checkpoint:human-verify) blocks Plan 46-03 — deployed URLs must be confirmed before portfolio case study link can be set
- Deployed URL for Plan 46-03: `https://ai-sdr.fernandomillan.me` (pending Task 3 verification)

---
*Phase: 46-demo-seed-portfolio-integration*
*Completed: 2026-03-01*
