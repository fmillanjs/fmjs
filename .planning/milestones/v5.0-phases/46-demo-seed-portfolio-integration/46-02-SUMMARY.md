---
phase: 46-demo-seed-portfolio-integration
plan: "02"
subsystem: infra
tags: [docker, coolify, ci-cd, nextjs, nestjs, github-actions, sse, nginx, ghcr, traefik]

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
  - ai-sdr/Dockerfile.seed — ts-node image running scripts/seed.ts with prisma client
  - ai-sdr/coolify-compose.yml — 4-service stack with correct dependency chain and Traefik labels
  - .github/workflows/deploy.yml — build-and-push-ai-sdr and deploy-ai-sdr jobs
  - Live deployment at https://ai-sdr.fernandomillan.me and https://ai-sdr-api.fernandomillan.me
  - SSE streaming confirmed in production with X-Accel-Buffering: no header verified
affects: [46-03-portfolio-case-study, PORT-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NEXT_PUBLIC_ vars must be ARG at Docker build time — Next.js bakes them into client bundle, runtime ENV does not work
    - Seed container pattern: restart:no + depends_on service_healthy + service_completed_successfully chain
    - ci-cd pattern matches existing DevCollab jobs — append-only, no existing jobs modified
    - ts-node --compiler-options '{"module":"commonjs"}' required for Alpine ESM compatibility
    - Traefik labels required in Coolify compose for custom domain routing

key-files:
  created:
    - ai-sdr/web/Dockerfile
    - ai-sdr/Dockerfile.seed
    - ai-sdr/coolify-compose.yml
  modified:
    - .github/workflows/deploy.yml

key-decisions:
  - "NEXT_PUBLIC_API_URL passed as Docker build ARG (not runtime ENV) — Next.js bakes NEXT_PUBLIC_ vars into client bundle at build time"
  - "Seed Dockerfile uses --compiler-options {module:commonjs} on ts-node — Alpine ESM resolution fails with --skip-project alone"
  - "coolify-compose dependency chain: postgres healthy → api healthy → seed completed → web starts — ensures seed runs after migrations"
  - "build-and-push-ai-sdr needs only [test] (not lighthouse) to keep AI SDR CI independent of Teamflow lighthouse checks"
  - "Traefik labels and coolify-overlay network required in compose for Coolify proxy routing to work"
  - "web/ excluded from api Docker build context — prevents node_modules conflict and image bloat"

patterns-established:
  - "Pattern: standalone Next.js Dockerfile with ARG NEXT_PUBLIC_* at build time"
  - "Pattern: seed Dockerfile with prisma generate in builder stage + ts-node commonJS flag in runner"
  - "Pattern: Coolify compose services need traefik.enable label + coolify-overlay network for custom domain routing"

requirements-completed: [DEMO-01, DEMO-02]

# Metrics
duration: 60min
completed: 2026-03-01
---

# Phase 46 Plan 02: Docker + Coolify Deployment Summary

**Next.js standalone + NestJS API deployed to Coolify via GHCR with 4-service compose stack — SSE streaming confirmed working in production at https://ai-sdr.fernandomillan.me**

## Performance

- **Duration:** ~60 min (including deployment iteration and human verification)
- **Started:** 2026-03-01T22:38:33Z
- **Completed:** 2026-03-01
- **Tasks:** 3 of 3 complete (including human-verify checkpoint approved)
- **Files modified:** 4

## Accomplishments

- Created `ai-sdr/web/Dockerfile` with Next.js standalone output pattern and `ARG NEXT_PUBLIC_API_URL` at build time
- Created `ai-sdr/Dockerfile.seed` with ts-node CommonJS runner, prisma generate in builder, copying node_modules + prisma + scripts
- Created `ai-sdr/coolify-compose.yml` with 4-service stack (postgres, api, seed, web) with Traefik labels and coolify-overlay network
- Extended `.github/workflows/deploy.yml` with `build-and-push-ai-sdr` and `deploy-ai-sdr` jobs — append-only
- Deployed successfully: web at https://ai-sdr.fernandomillan.me, API at https://ai-sdr-api.fernandomillan.me
- SSE streaming confirmed in production — X-Accel-Buffering: no header verified, tokens stream incrementally
- 8 seeded leads visible immediately after login — DEMO-01 and DEMO-02 satisfied in production

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ai-sdr web Dockerfile and coolify-compose.yml** - `b836c4f` (feat)
2. **Task 2: Add seed Dockerfile and extend CI/CD workflow for ai-sdr** - `6b40d4d` (feat)
3. **Task 3: Human verification — deploy to Coolify and verify SSE streaming** - approved by human

**Deployment fix commits (auto-fixed during production deployment iteration):**
- `b5d0270` — fix(46-02): exclude web/ from api docker build context and tsconfig
- `45a7e49` — fix(46-02): keep scripts in docker context for seed image
- `dbae7ac` — fix(46-02): correct GHCR image paths in coolify-compose.yml
- `29dc94a` — fix(46-02): generate prisma client in seed Dockerfile
- `da1663a` — fix(46-02): fix ts-node ESM error in seed by passing commonjs compiler option
- `71d186e` — fix(46-02): add traefik labels and coolify proxy network to compose

## Files Created/Modified

- `ai-sdr/web/Dockerfile` — Next.js standalone multi-stage build with NEXT_PUBLIC_API_URL build ARG, nextjs system user
- `ai-sdr/Dockerfile.seed` — ts-node runner with prisma generate in builder, --compiler-options commonJS flag
- `ai-sdr/coolify-compose.yml` — 4-service Coolify stack with healthchecks, Traefik labels, coolify-overlay network
- `.github/workflows/deploy.yml` — Added build-and-push-ai-sdr (3 GHCR images) and deploy-ai-sdr (2 Coolify webhooks) jobs

## Decisions Made

- `NEXT_PUBLIC_API_URL` passed as Docker `ARG` because Next.js bakes `NEXT_PUBLIC_` vars into the client bundle at build time — runtime ENV has no effect
- `ts-node --compiler-options '{"module":"commonjs"}'` instead of `--skip-project` — Alpine's ESM resolution fails with --skip-project alone; CommonJS mode avoids ERR_REQUIRE_ESM
- Coolify compose dependency chain: `postgres` (healthy) → `api` (healthy) → `seed` (completed_successfully) → `web` starts
- `build-and-push-ai-sdr` depends only on `[test]` not `[test, lighthouse]` — keeps AI SDR CI independent of Teamflow Lighthouse CI
- Traefik labels + `coolify-overlay` network required for Coolify proxy to route custom domains to containers
- `web/` excluded from api Docker build context via `.dockerignore` — prevents web node_modules from conflicting with api image build

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded web/ from api Docker build context**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** api Dockerfile build context `./ai-sdr` included the `web/` directory — web's node_modules conflicted with api's build
- **Fix:** Added web/ to api .dockerignore; excluded web/ from api tsconfig.json paths
- **Committed in:** b5d0270

**2. [Rule 3 - Blocking] Kept scripts/ in seed Docker build context**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** Seed COPY for scripts/ was failing — scripts weren't included in builder stage properly
- **Fix:** Updated Dockerfile.seed builder stage to explicitly COPY scripts ./scripts before runner COPY
- **Committed in:** 45a7e49

**3. [Rule 1 - Bug] Corrected GHCR image paths in coolify-compose.yml**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** Image references in coolify-compose.yml didn't match GHCR path format — `github.repository` produces `owner/repo`, yielding `ghcr.io/owner/repo/image-name`
- **Fix:** Updated image paths to `ghcr.io/fernandomillan-dev/fernandomillan/ai-sdr-*:latest`
- **Committed in:** dbae7ac

**4. [Rule 3 - Blocking] Added prisma generate to seed Dockerfile builder stage**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** `@prisma/client` import failed at runtime — prisma client was not generated in the seed image
- **Fix:** Added `RUN npx prisma generate` after `npm ci` in builder stage of Dockerfile.seed
- **Committed in:** 29dc94a

**5. [Rule 1 - Bug] Fixed ts-node ESM error in seed container**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** `ts-node --skip-project` caused `ERR_REQUIRE_ESM` on Alpine when seed script imported CommonJS modules
- **Fix:** Replaced `--skip-project` with `--compiler-options '{"module":"commonjs"}'` in CMD
- **Committed in:** da1663a

**6. [Rule 3 - Blocking] Added Traefik labels and coolify-overlay network to compose**
- **Found during:** Task 3 (deployment iteration)
- **Issue:** Services were unreachable via custom domains — Coolify's Traefik proxy requires explicit labels to route traffic to compose services
- **Fix:** Added `traefik.enable=true` and router/service labels to api and web; added `coolify-overlay` as external network
- **Committed in:** 71d186e

---

**Total deviations:** 6 auto-fixed (4 blocking, 2 bugs)
**Impact on plan:** All fixes required for production deployment to work. The plan described correct Docker patterns but deployment revealed Coolify-specific requirements (Traefik labels, proxy network) and Alpine-specific issues (ts-node ESM resolution, build context isolation).

## Issues Encountered

- ts-node's `--skip-project` does not bypass module type resolution on Alpine — must force CommonJS compilation mode
- Coolify requires explicit Traefik labels and the `coolify-overlay` external network in compose files for custom domain routing
- GHCR image paths must exactly match the `github.repository` format (`owner/repo`) used in CI/CD — compose file and workflow must agree

## User Setup Required

The following were configured manually by the user in Coolify and GitHub before Task 3 verification:

- GitHub Secrets added: `COOLIFY_AI_SDR_API_WEBHOOK_URL`, `COOLIFY_AI_SDR_WEB_WEBHOOK_URL`, `NEXT_PUBLIC_AI_SDR_API_URL` (= `https://ai-sdr-api.fernandomillan.me`)
- Coolify service configured for ai-sdr-api with: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `WEB_URL`
- Coolify service configured for ai-sdr-web at `ai-sdr.fernandomillan.me`
- First deployment triggered manually; subsequent deployments via GitHub Actions on push to main

## Next Phase Readiness

- Live deployment fully operational — https://ai-sdr.fernandomillan.me (web) and https://ai-sdr-api.fernandomillan.me (API)
- SSE streaming verified in production with X-Accel-Buffering: no header confirmed
- 8 seeded leads visible immediately after login — DEMO-01 and DEMO-02 satisfied
- Plan 46-03 (portfolio case study) can now link the "View Live Demo" button to https://ai-sdr.fernandomillan.me
- PORT-03 dependency satisfied — deployed URL confirmed

---
*Phase: 46-demo-seed-portfolio-integration*
*Completed: 2026-03-01*
