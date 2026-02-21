---
phase: 27-infrastructure-foundation-prisma-fix
plan: "03"
subsystem: infra
tags: [coolify, ghcr, dns, tls, vps, github-secrets, ci-cd]

dependency_graph:
  requires:
    - phase: 27-infrastructure-foundation-prisma-fix
      provides: "Plan 01 — Prisma fix, cookie fix, Dockerfile build-arg"
    - phase: 27-infrastructure-foundation-prisma-fix
      provides: "Plan 02 — GHA deploy pipeline + coolify-compose.yml"
  provides:
    - "Both apps live at HTTPS custom domains on fernandomillan.me"
    - "Coolify stacks deployed and healthy (4 GHCR images)"
    - "Full CI/CD pipeline green — build, test, Lighthouse, deploy"
  affects: []

tech_stack:
  added: []
  patterns:
    - "VPS GHCR auth: sudo su - then docker login ghcr.io as root (Coolify reads /root/.docker/config.json)"
    - "Coolify deploy API: GET request with Bearer token, not POST webhook"
    - "Separate Coolify webhook calls for web and api services per stack"

key_files:
  created: []
  modified:
    - .github/workflows/deploy.yml
    - .planning/STATE.md

key_decisions:
  - "Coolify deploy API uses GET + Bearer token, not POST — fixed in CI commits b71f065, 10de8d5"
  - "Separate webhook calls needed per Coolify service (web + api) — added in c576019"
  - "outputFileTracingRoot required in both next.config.ts files for Docker standalone output — bda51ea"
  - "Live domains: devcollab.fernandomillan.me + teamflow.fernandomillan.me (registrar was .me not .dev as planned)"

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-06]

metrics:
  duration: "several hours (manual VPS + Coolify UI steps + CI iteration)"
  completed: 2026-02-20
  tasks_completed: 4
  files_modified: 2
---

# Phase 27 Plan 03: VPS + Coolify Stack Setup Summary

**Both TeamFlow and DevCollab live at HTTPS custom domains on fernandomillan.me. Full CI/CD pipeline green: 4 GHCR images built and pushed, Coolify services healthy, site accessible.**

## Performance

- **Duration:** Human checkpoint + CI iteration
- **Completed:** 2026-02-20
- **Tasks:** 4 (3 manual VPS/Coolify + 1 E2E verification)
- **Files modified:** 2 (.github/workflows/deploy.yml, STATE.md)

## Accomplishments

- Configured GHCR pull credentials on VPS as root (`docker login ghcr.io` → `/root/.docker/config.json`)
- Added all required GitHub repository secrets: `NEXT_PUBLIC_DEVCOLLAB_API_URL`, `COOLIFY_DEVCOLLAB_WEBHOOK_URL`, `COOLIFY_TOKEN`
- Created Coolify stacks for DevCollab and TeamFlow with DNS A records on `fernandomillan.me`
- Iterated on CI/CD to fix Coolify deploy API format (GET + Bearer token), separate webhook calls per service, and Docker standalone output tracing
- Full pipeline confirmed green: builds pass, Lighthouse passes, 4 GHCR images push, Coolify deploys healthy

## CI Fix Commits

| Commit | Fix |
|--------|-----|
| `b71f065` | Use correct Coolify deploy API (GET + Bearer token via curl) |
| `10de8d5` | Add Coolify Bearer token auth to deploy webhook calls |
| `6f22f85` | Remove redundant Lighthouse artifact upload step |
| `c576019` | Add separate webhook calls for web services in deploy jobs |
| `bda51ea` | Add outputFileTracingRoot to both next.config.ts files |
| `1009be4` | Phase 27 complete — fernandomillan.me live (state update) |

## Live Domains

| Service | URL |
|---------|-----|
| DevCollab Web | https://devcollab.fernandomillan.me |
| DevCollab API | https://devcollab-api.fernandomillan.me |
| TeamFlow Web | https://teamflow.fernandomillan.me |
| Portfolio | https://fernandomillan.me |

## Requirements Verified

- **DEPLOY-01:** DevCollab web and API live at HTTPS on `devcollab.fernandomillan.me` and `devcollab-api.fernandomillan.me` ✓
- **DEPLOY-02:** TeamFlow live at HTTPS on `teamflow.fernandomillan.me` ✓
- **DEPLOY-06:** GHCR auth configured as root on VPS — Coolify can pull all 4 private GHCR images ✓

## Deviations from Plan

- Domain TLD changed from `.dev` to `.me` (registrar configuration)
- Coolify deploy API required GET + Bearer token instead of simple POST webhook — fixed iteratively via CI commits
- Separate Coolify webhook calls needed per service (web + api per stack) — not anticipated in Plan 02

## Self-Check: PASSED

- FOUND: devcollab.fernandomillan.me — DNS resolves to 23.21.26.119 (VPS)
- FOUND: teamflow.fernandomillan.me — DNS resolves to 23.21.26.119 (VPS)
- FOUND: 1009be4 — "Phase 27 complete — fernandomillan.me live"
- FOUND: commit message confirms "Full CI/CD pipeline green: tests, Lighthouse, 4 GHCR images built and deployed. All Coolify services healthy. Site accessible."

---
*Phase: 27-infrastructure-foundation-prisma-fix*
*Completed: 2026-02-20*
