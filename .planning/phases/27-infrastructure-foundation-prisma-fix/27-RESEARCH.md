# Phase 27: Infrastructure Foundation + Prisma Fix - Research

**Researched:** 2026-02-19
**Domain:** Coolify deployment, GitHub Actions CI/CD, Docker build args, NestJS CORS, Prisma multi-client isolation
**Confidence:** HIGH — all findings verified directly from codebase inspection; no speculative claims

---

## Summary

Phase 27 requires making both TeamFlow and DevCollab production-live on Coolify at HTTPS custom domains with auto-deploy from GitHub. This is a pure infrastructure and configuration phase — no new application features are being built. All seven requirements (DEPLOY-01 through DEPLOY-06 and FIX-01) are surgical changes to existing files.

The codebase already has the full CI/CD skeleton in `.github/workflows/deploy.yml`: Docker images for both stacks are built and pushed to GHCR on every main push. What is missing is: (1) the `NEXT_PUBLIC_API_URL` build arg being passed to the devcollab-web Docker build, (2) a dedicated deploy job for DevCollab that fires its own Coolify webhook, (3) the devcollab-web `Dockerfile` declaring `ARG`/`ENV NEXT_PUBLIC_API_URL`, (4) the CORS origin env var on the VPS, (5) GHCR pull auth on the VPS root user, and (6) the Prisma isolation fix in `reactions.service.ts`. The Coolify stack setup itself (DNS, TLS, compose files) is a manual VPS step, not a code change.

The single code bug (FIX-01) is a one-line fix: `reactions.service.ts` line 2 imports `PrismaClientKnownRequestError` from `@prisma/client/runtime/library` (TeamFlow's client) instead of `.prisma/devcollab-client/runtime/library`. The devcollab Prisma schema outputs to `node_modules/.prisma/devcollab-client` and that directory contains its own `runtime/library` module with `PrismaClientKnownRequestError` exported — verified by inspection of the runtime directory.

**Primary recommendation:** Execute in order: (1) fix Prisma import, (2) add ARG/ENV to Dockerfile and build-arg to GHA, (3) add devcollab deploy job to GHA, (4) configure VPS GHCR auth, (5) configure Coolify stacks with correct env vars and compose configs.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPLOY-01 | DevCollab web and API accessible at HTTPS custom domains with valid TLS | Coolify handles TLS via Let's Encrypt automatically when domain DNS points to VPS; requires Coolify stack setup with correct domains |
| DEPLOY-02 | TeamFlow web and API accessible at HTTPS custom domains with valid TLS | Same Coolify TLS mechanism; TeamFlow Coolify stack needs to be created with TeamFlow GHCR images |
| DEPLOY-03 | NEXT_PUBLIC_API_URL baked into devcollab-web Docker image at build time via --build-arg | devcollab-web Dockerfile currently has no ARG declaration; GHA build-and-push-devcollab step has no build-args; both need updating |
| DEPLOY-04 | NestJS CORS configured with production domain so browser API calls succeed | main.ts already reads `process.env.DEVCOLLAB_WEB_URL`; Coolify env var `DEVCOLLAB_WEB_URL=https://devcollab.fernandomillan.dev` must be set (no trailing slash) |
| DEPLOY-05 | GitHub Actions auto-deploys to Coolify on push to main (separate webhooks for TeamFlow and DevCollab) | Current `deploy` job only fires `COOLIFY_WEBHOOK_URL` after `build-and-push` (TeamFlow). A second `deploy-devcollab` job needs to be added after `build-and-push-devcollab`, firing `COOLIFY_DEVCOLLAB_WEBHOOK_URL` |
| DEPLOY-06 | Coolify server can pull private GHCR images (docker login configured as root on VPS) | VPS root user must run: `echo PAT \| docker login ghcr.io -u USERNAME --password-stdin`; Coolify reads creds from `/root/.docker/config.json` |
| FIX-01 | Prisma import in reactions.service.ts uses correct devcollab client path | Line 2 of `apps/devcollab-api/src/reactions/reactions.service.ts` imports from `@prisma/client/runtime/library`; must change to `.prisma/devcollab-client/runtime/library` |
</phase_requirements>

---

## Standard Stack

### Core (no new packages required)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Coolify | Self-hosted (VPS) | PaaS that manages Docker Compose stacks, TLS, reverse proxy | Already chosen; handles Traefik, Let's Encrypt automatically |
| GitHub Container Registry (GHCR) | N/A | Private Docker image registry | Already used; GHA workflow already pushes to ghcr.io |
| GitHub Actions | v4 actions | CI/CD orchestration | Already in place; only additions needed |
| docker/build-push-action | v5 | Docker build and push to GHCR | Already used in existing GHA jobs |
| fjogeleit/http-request-action | v1 | POST to Coolify deploy webhook | Already used in existing `deploy` job |
| Prisma | 5.22.0 | Database client | Already installed; no version change needed |

### No new packages

This phase installs zero new npm packages. All changes are:
- Configuration files (Dockerfile, GHA workflow)
- One-line import fix in TypeScript source
- VPS shell commands (manual steps)
- Coolify UI configuration (manual steps)

---

## Architecture Patterns

### Current State (What Exists)

```
.github/workflows/deploy.yml
├── test job (runs all tests)
├── lighthouse job (Lighthouse CI, needs: test)
├── build-and-push job (TeamFlow web+api → GHCR, needs: test+lighthouse)
├── build-and-push-devcollab job (DevCollab web+api → GHCR, needs: test)
│   └── MISSING: No --build-arg NEXT_PUBLIC_API_URL in devcollab-web step
│   └── MISSING: ARG declaration in apps/devcollab-web/Dockerfile
└── deploy job (TeamFlow Coolify webhook, needs: build-and-push)
    └── MISSING: No deploy-devcollab job for DevCollab webhook
```

### Target State (What Needs to Exist)

```
.github/workflows/deploy.yml
├── test job (unchanged)
├── lighthouse job (unchanged)
├── build-and-push job (TeamFlow, unchanged)
├── build-and-push-devcollab job
│   └── devcollab-web build step: ADD build-args: NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_DEVCOLLAB_API_URL }}
├── deploy job (TeamFlow webhook, unchanged)
└── deploy-devcollab job (NEW)
    └── needs: build-and-push-devcollab
    └── fires: secrets.COOLIFY_DEVCOLLAB_WEBHOOK_URL

apps/devcollab-web/Dockerfile
├── builder stage: ADD ARG NEXT_PUBLIC_API_URL
└── builder stage: ADD ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

### Pattern 1: NEXT_PUBLIC_API_URL Build-Time Baking

**What:** Next.js client-side env vars (prefixed `NEXT_PUBLIC_`) are inlined into the JS bundle at build time. They cannot be injected at container runtime. Must be passed as Docker `--build-arg` and declared in Dockerfile as `ARG`/`ENV`.

**Why this matters:** The current devcollab-web build does NOT pass `NEXT_PUBLIC_API_URL`. Result: every browser-side API call goes to `http://localhost:3003` (the fallback hardcoded in the fetch utility). This causes all API calls to fail in production.

**Correct pattern for Dockerfile (builder stage):**
```dockerfile
# After COPY --from=installer lines, before RUN npx turbo build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=devcollab-web
```

**Correct pattern for GHA build-push step:**
```yaml
- name: Build and push devcollab-web image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: apps/devcollab-web/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}/devcollab-web:latest
      ghcr.io/${{ github.repository }}/devcollab-web:${{ github.sha }}
    build-args: |
      NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_DEVCOLLAB_API_URL }}
    cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/devcollab-web:latest
    cache-to: type=inline
```

**GitHub Secret to add:** `NEXT_PUBLIC_DEVCOLLAB_API_URL` = `https://devcollab-api.fernandomillan.dev`

### Pattern 2: DevCollab Deploy Job

**What:** A second deploy job that fires the DevCollab Coolify stack webhook after devcollab images are pushed.

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

**GitHub Secret to add:** `COOLIFY_DEVCOLLAB_WEBHOOK_URL` — obtained from the Coolify DevCollab stack settings page after creating the stack.

### Pattern 3: FIX-01 Prisma Import Fix

**What:** `reactions.service.ts` uses `PrismaClientKnownRequestError` from TeamFlow's `@prisma/client` instead of DevCollab's isolated client.

**Current (wrong):**
```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
```

**Correct:**
```typescript
import { PrismaClientKnownRequestError } from '.prisma/devcollab-client/runtime/library';
```

**Why this is the right path:** The devcollab Prisma schema declares `output = "../../../node_modules/.prisma/devcollab-client"` in `packages/devcollab-database/prisma/schema.prisma`. The generated client at `node_modules/.prisma/devcollab-client/` has its own `runtime/` directory containing `library.d.ts` which exports `PrismaClientKnownRequestError`. Verified by directory inspection.

**Note:** The `@devcollab/database` package's `src/index.ts` re-exports `export * from '.prisma/devcollab-client'` — but this does NOT re-export the runtime module. Runtime errors like `PrismaClientKnownRequestError` must be imported from the runtime path directly. The `.prisma/devcollab-client/runtime/library` path resolves correctly from `node_modules` using Node.js module resolution.

### Pattern 4: CORS Environment Variable

**What:** `apps/devcollab-api/src/main.ts` already reads `process.env.DEVCOLLAB_WEB_URL` for the CORS origin. The Coolify DevCollab-API service needs this env var set correctly.

**Current code (already correct):**
```typescript
app.enableCors({
  origin: process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002',
  credentials: true,
});
```

**Coolify env var to set on devcollab-api service:**
```
DEVCOLLAB_WEB_URL=https://devcollab.fernandomillan.dev
```
No trailing slash. This is already the architectural decision — the code is ready; only the env var on Coolify needs to be set.

### Pattern 5: Coolify Compose Configuration (devcollab-migrate restart policy)

**What:** When Coolify runs a Docker Compose stack, containers that exit with code 0 (like `prisma migrate deploy`) will be restarted infinitely unless `restart: 'no'` is set.

**The devcollab-migrate service in the Coolify compose must have:**
```yaml
devcollab-migrate:
  image: ghcr.io/fernandomillan-dev/fernandomillan/devcollab-migrate:latest
  restart: "no"
  depends_on:
    devcollab-postgres:
      condition: service_healthy
  environment:
    DEVCOLLAB_DATABASE_URL: ${DEVCOLLAB_DATABASE_URL}
```

**Current state:** `docker-compose.yml` (dev compose) does NOT have `restart: 'no'` on `devcollab-migrate`. The Coolify production compose (a separate file created in Coolify UI or uploaded as a compose file) must explicitly include `restart: "no"`.

### Anti-Patterns to Avoid

- **Runtime env var for NEXT_PUBLIC_:** Setting `NEXT_PUBLIC_API_URL` as a Coolify runtime env var on the devcollab-web service — this has NO effect because the Next.js build already baked `undefined` into the bundle. The only fix is baking it at build time via `--build-arg`.
- **Wildcard CORS with credentials:** `origin: '*'` with `credentials: true` is rejected by every browser. Must use exact origin string.
- **Trailing slash on CORS origin:** `'https://devcollab.fernandomillan.dev/'` (with trailing slash) does not match browser requests which send `https://devcollab.fernandomillan.dev` — CORS will fail.
- **Running docker login as non-root:** Coolify runs containers as root and reads `/root/.docker/config.json`. Running `docker login` as a non-root user creates credentials in a different home directory that Coolify cannot read.
- **Missing `restart: "no"` on migrate container:** Without this, Coolify will restart the migrate container in an infinite loop after it exits successfully, causing the devcollab-api healthcheck to never stabilize.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS certificates | Manual cert management | Coolify's built-in Traefik + Let's Encrypt | Coolify automates ACME challenge and renewal automatically |
| Webhook triggering | Custom HTTP client in GHA | fjogeleit/http-request-action@v1 | Already used in existing deploy job — consistent |
| Docker registry auth in GHA | Custom login steps | docker/login-action@v3 + GITHUB_TOKEN | Already used; GITHUB_TOKEN has packages:write automatically |

---

## Common Pitfalls

### Pitfall 1: NEXT_PUBLIC_API_URL in Coolify Runtime Environment
**What goes wrong:** Developer sets `NEXT_PUBLIC_API_URL` in Coolify's environment variable panel for the devcollab-web service. The app still calls localhost:3003 in the browser.
**Why it happens:** Next.js bakes `NEXT_PUBLIC_*` vars at `next build` time into the JS bundle. Runtime env vars on the running container are server-process env vars only — not accessible in client-side code.
**How to avoid:** The only solution is `--build-arg` in the Docker build step and `ARG`/`ENV` in the Dockerfile builder stage.
**Warning signs:** Browser network tab shows requests to `localhost:3003` despite runtime env var being set.

### Pitfall 2: CORS Mismatch Between Origin and Request
**What goes wrong:** Login API call fails with CORS error in browser console. `Access-Control-Allow-Origin` in response does not match request Origin.
**Why it happens:** `DEVCOLLAB_WEB_URL` has a trailing slash, or is not set (defaults to `http://localhost:3002`), or has `http://` instead of `https://`.
**How to avoid:** Set `DEVCOLLAB_WEB_URL=https://devcollab.fernandomillan.dev` (no trailing slash, exact match).
**Warning signs:** Browser console shows `CORS error: Access-Control-Allow-Origin header missing` or `does not match`.

### Pitfall 3: Cookie SameSite Policy in Production
**What goes wrong:** Auth cookie is set on login but subsequent API requests don't send the cookie — user appears logged out.
**Why it happens:** Cross-origin cookies require `SameSite=None; Secure`. In development (same origin), session cookies work without this flag. In production, the devcollab-web frontend (`https://devcollab.fernandomillan.dev`) and API (`https://devcollab-api.fernandomillan.dev`) are cross-origin.
**How to avoid:** The NestJS cookie parser and cookie-based auth must set `sameSite: 'none'` and `secure: true` on the cookie in production. Check this in Chrome DevTools → Application → Cookies on first production login.
**Warning signs:** Login appears to succeed (201 response), but the next `GET /auth/me` returns 401.

### Pitfall 4: devcollab-migrate Restart Loop in Coolify
**What goes wrong:** Coolify stack shows devcollab-api stuck in "starting" state indefinitely. devcollab-migrate container log shows repeated `Migration completed` messages.
**Why it happens:** `prisma migrate deploy` exits with code 0. Without `restart: "no"`, Coolify respects the compose file's default (usually `unless-stopped`) and restarts the exited container, causing an infinite loop.
**How to avoid:** Add `restart: "no"` to devcollab-migrate in the Coolify compose file.
**Warning signs:** devcollab-migrate container in Coolify shows "Restarting" status repeatedly.

### Pitfall 5: GHCR Pull Auth as Non-Root
**What goes wrong:** Coolify stack fails to pull images from GHCR — `unauthorized: unauthenticated` error.
**Why it happens:** Docker login was run as a non-root user (e.g., `ubuntu` or `deploy`), creating credentials at `/home/ubuntu/.docker/config.json`. Coolify runs as root and reads `/root/.docker/config.json`.
**How to avoid:** SSH into VPS, run `sudo su -`, then `echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin`. The PAT must have `read:packages` scope (classic PAT).
**Warning signs:** Stack shows image pull error even though the image exists in GHCR.

### Pitfall 6: Prisma Client Type Incompatibility
**What goes wrong:** At runtime, `err instanceof PrismaClientKnownRequestError` returns `false` even when the error IS a Prisma P2002 — causing unhandled exceptions from the race condition path.
**Why it happens:** Two different Prisma client instances (TeamFlow's `@prisma/client` and DevCollab's `.prisma/devcollab-client`) have separate class definitions. An error thrown by the devcollab client is NOT an `instanceof` the TeamFlow client's class.
**How to avoid:** Import `PrismaClientKnownRequestError` from `.prisma/devcollab-client/runtime/library` — matching the client that actually throws the error.
**Warning signs:** P2002 race condition on reactions creates unhandled exception instead of being caught and returning `{ action: 'added' }`.

---

## Code Examples

### FIX-01: Corrected Import in reactions.service.ts

```typescript
// File: apps/devcollab-api/src/reactions/reactions.service.ts
// Line 2 — change FROM:
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// TO:
import { PrismaClientKnownRequestError } from '.prisma/devcollab-client/runtime/library';
```

### DEPLOY-03: devcollab-web Dockerfile Builder Stage Addition

```dockerfile
# File: apps/devcollab-web/Dockerfile
# In the builder stage, BEFORE the turbo build command:
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules
# ADD THESE TWO LINES:
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=devcollab-web
```

### DEPLOY-03 + DEPLOY-05: GHA devcollab-web build step with build-args

```yaml
- name: Build and push devcollab-web image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: apps/devcollab-web/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}/devcollab-web:latest
      ghcr.io/${{ github.repository }}/devcollab-web:${{ github.sha }}
    build-args: |
      NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_DEVCOLLAB_API_URL }}
    cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/devcollab-web:latest
    cache-to: type=inline
```

### DEPLOY-05: New deploy-devcollab GHA job

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

### DEPLOY-06: VPS GHCR Authentication Commands

```bash
# SSH into VPS, then:
sudo su -
echo "YOUR_CLASSIC_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
# Verify:
cat /root/.docker/config.json
# Should show ghcr.io entry with auth token
```

### Coolify Compose: devcollab-migrate with restart: "no"

```yaml
devcollab-migrate:
  image: ghcr.io/YOUR_USERNAME/fernandomillan/devcollab-migrate:latest
  restart: "no"
  depends_on:
    devcollab-postgres:
      condition: service_healthy
  environment:
    DEVCOLLAB_DATABASE_URL: ${DEVCOLLAB_DATABASE_URL}
```

---

## Current State Audit

### What Exists (Confirmed by Code Inspection)

| Item | State | File |
|------|-------|------|
| GHA: devcollab images pushed to GHCR | EXISTS | `.github/workflows/deploy.yml` lines 220-260 |
| GHA: TeamFlow deploy webhook job | EXISTS | `.github/workflows/deploy.yml` lines 262-272 |
| GHA: DevCollab deploy webhook job | MISSING | Not in deploy.yml |
| devcollab-web Dockerfile: standalone output | EXISTS | `apps/devcollab-web/Dockerfile` line 32 |
| devcollab-web Dockerfile: ARG NEXT_PUBLIC_API_URL | MISSING | Not in Dockerfile |
| devcollab-api main.ts: CORS reads DEVCOLLAB_WEB_URL | EXISTS | `apps/devcollab-api/src/main.ts` line 14 |
| devcollab-api: PORT env var read | EXISTS | `apps/devcollab-api/src/main.ts` line 18 |
| Dockerfile.migrate: prisma migrate deploy | EXISTS | `packages/devcollab-database/Dockerfile.migrate` |
| docker-compose.yml: devcollab-migrate restart:no | MISSING | `docker-compose.yml` line 60-70 (no restart field) |
| reactions.service.ts: wrong Prisma import | BUG | `apps/devcollab-api/src/reactions/reactions.service.ts` line 2 |
| devcollab-client runtime directory | EXISTS | `node_modules/.prisma/devcollab-client/runtime/` |

### GitHub Secrets Required

| Secret Name | Value | Used For |
|-------------|-------|---------|
| `NEXT_PUBLIC_DEVCOLLAB_API_URL` | `https://devcollab-api.fernandomillan.dev` | DEPLOY-03: baked into devcollab-web at build |
| `COOLIFY_DEVCOLLAB_WEBHOOK_URL` | From Coolify DevCollab stack settings | DEPLOY-05: trigger devcollab auto-deploy |
| `COOLIFY_WEBHOOK_URL` | Already exists | DEPLOY-05: trigger TeamFlow auto-deploy (existing) |

### Coolify Stack Environment Variables Required

**DevCollab API service:**
```
DEVCOLLAB_DATABASE_URL=postgresql://...
DEVCOLLAB_JWT_SECRET=<strong-random-secret>
DEVCOLLAB_WEB_URL=https://devcollab.fernandomillan.dev
PORT=3003
NODE_ENV=production
```

**DevCollab Web service:**
```
NODE_ENV=production
PORT=3002
HOSTNAME=0.0.0.0
```
Note: `NEXT_PUBLIC_API_URL` is baked in at build time — setting it here has no effect on client-side code.

---

## Open Questions

1. **Does Coolify use the repo's `docker-compose.yml` directly or a separate compose file?**
   - What we know: Coolify supports Docker Compose stacks. The existing `docker-compose.yml` includes both TeamFlow and DevCollab services. Coolify typically allows using a repo compose file OR a custom inline compose.
   - What's unclear: Whether Coolify should use the repo's compose file (which has `restart:` missing from devcollab-migrate) or a separate Coolify-specific compose file is uploaded.
   - Recommendation: Create a separate `coolify-compose.yml` committed to the repo specifically for the Coolify stack, with correct `restart: "no"` and image references pointing to GHCR (not `build:` sections).

2. **TeamFlow domains: what are they?**
   - What we know: The phase requires `https://teamflow.fernandomillan.dev` and "related TeamFlow domains" to be live.
   - What's unclear: Whether TeamFlow has an API subdomain (like `https://teamflow-api.fernandomillan.dev`) — the port is 4000 internally. The existing prod compose exposes port 4000 for the API.
   - Recommendation: Plan for `https://teamflow.fernandomillan.dev` (web) and `https://teamflow-api.fernandomillan.dev` (api) as the minimum; verify from actual DNS/Coolify configuration.

3. **SameSite=None cookie requirement for cross-origin DevCollab auth**
   - What we know: The `DEVCOLLAB_WEB_URL` CORS fix enables preflight; but the httpOnly cookie must also have `SameSite=None; Secure` for cross-origin sends.
   - What's unclear: The current devcollab-api auth service cookie settings were not inspected — whether they already set `sameSite: 'none'` and `secure: true` in production.
   - Recommendation: Include inspecting the auth cookie configuration in the planning tasks. If not set, a code change to the auth service cookie options is needed for production to work.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `/home/doctor/fernandomillan/.github/workflows/deploy.yml` — full GHA workflow, all jobs inspected
- `/home/doctor/fernandomillan/apps/devcollab-web/Dockerfile` — confirmed no ARG/ENV for NEXT_PUBLIC_API_URL
- `/home/doctor/fernandomillan/apps/devcollab-api/src/main.ts` — confirmed CORS reads DEVCOLLAB_WEB_URL
- `/home/doctor/fernandomillan/apps/devcollab-api/src/reactions/reactions.service.ts` — confirmed wrong import on line 2
- `/home/doctor/fernandomillan/packages/devcollab-database/prisma/schema.prisma` — confirmed output path `.prisma/devcollab-client`
- `/home/doctor/fernandomillan/packages/devcollab-database/src/client.ts` — confirmed PrismaClient import from `.prisma/devcollab-client`
- `/home/doctor/fernandomillan/node_modules/.prisma/devcollab-client/runtime/` — confirmed runtime directory exists with `library.d.ts`
- `/home/doctor/fernandomillan/docker-compose.yml` — confirmed devcollab-migrate has no `restart: "no"`
- `/home/doctor/fernandomillan/.planning/MILESTONES.md` — tech debt notes from v2.0 ship
- `/home/doctor/fernandomillan/.planning/REQUIREMENTS.md` — requirement definitions

---

## Metadata

**Confidence breakdown:**
- FIX-01 (Prisma import): HIGH — exact files inspected, both wrong and correct paths verified
- DEPLOY-03 (NEXT_PUBLIC baking): HIGH — Dockerfile and GHA inspected, missing ARG/build-args confirmed
- DEPLOY-04 (CORS): HIGH — main.ts reads env var, code is correct, only env var setup needed
- DEPLOY-05 (Coolify webhooks): HIGH — deploy.yml inspected, devcollab webhook job confirmed missing
- DEPLOY-06 (GHCR auth): HIGH — standard docker login pattern, Coolify root credential behavior documented
- DEPLOY-01/02 (TLS + domains): MEDIUM — Coolify TLS behavior (Let's Encrypt auto) based on training knowledge; not verified against live Coolify instance
- Open question (SameSite cookies): LOW — needs source inspection of auth service cookie configuration

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (stable infra patterns, no fast-moving dependencies)
