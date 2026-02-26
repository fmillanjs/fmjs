# Phase 34: Live Auth Investigation & Fix — Research

**Researched:** 2026-02-25
**Domain:** Live production authentication, environment variables, Docker/Coolify deployment, database seeding
**Confidence:** HIGH

---

## Summary

Phase 34 must diagnose and fix broken authentication on both `devcollab.fernandomillan.me` and `teamflow.fernandomillan.me`. The root cause is unknown — it must be investigated live — but the codebase analysis reveals several concrete, verifiable failure points that a planner can translate directly into investigation and fix tasks.

The two apps have completely different auth architectures. DevCollab uses a cookie-based JWT flow (NestJS sets `devcollab_token` as an HttpOnly cookie; Next.js reads it server-side for SSR API calls). TeamFlow uses NextAuth v5 with a CredentialsProvider backed by Prisma + Redis session storage; a secondary JWT (`accessToken`) is generated per session for the NestJS API and WebSocket. This means the failure modes differ per app and must be diagnosed independently.

The most likely failure classes — based on prior auth investigations in phases 05.1 and 06 and the current codebase state — are: (1) `NEXT_PUBLIC_API_URL` baked into Docker images pointing to localhost instead of live API domains; (2) CORS misconfiguration on live APIs (wrong origin header blocking credential-bearing requests); (3) environment variables (particularly `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `JWT_SECRET`) not set or mismatched in Coolify; (4) database not seeded on the live server (users don't exist at all); and (5) TeamFlow Redis connection failure invalidating every session callback.

**Primary recommendation:** Structure Phase 34 in two sequential waves: (Wave 1) live diagnosis — HTTP curl tests against live endpoints to identify which layer is failing; (Wave 2) targeted fix — apply the minimal config/code change that the diagnosis reveals. Do not guess and deploy blindly; check live state first.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIVE-01 | User can log into DevCollab at `devcollab.fernandomillan.me` using seeded demo credentials | DevCollab uses cookie-based auth; login at `/auth/login`; POST to `${NEXT_PUBLIC_API_URL}/auth/login`; cookie `devcollab_token` must be set cross-origin with `sameSite: none, secure: true`; image baked with `NEXT_PUBLIC_API_URL` at build time |
| LIVE-02 | User can log into TeamFlow at `teamflow.fernandomillan.me` using seeded demo credentials | TeamFlow uses NextAuth CredentialsProvider backed by Prisma directly (no API call on login); `NEXTAUTH_URL` must match live domain; `NEXTAUTH_SECRET` must be set in Coolify; Redis must be reachable |
| LIVE-03 | DevCollab demo workspace loads with all seeded content after login | Seed (`admin@demo.devcollab / Demo1234!`) must have run on live DB; workspace slug `devcollab-demo` must exist; workspace page fetches via `${NEXT_PUBLIC_API_URL}/workspaces/devcollab-demo` with cookie forwarded |
| LIVE-04 | TeamFlow demo project loads with tasks, columns, real-time features | Seed (`demo1@teamflow.dev / Password123`) must have run; dashboard fetches `/api/teams` via bearer JWT; WebSocket must connect (JWT_SECRET must match between web and api); drag-and-drop + presence requires WS connection |
</phase_requirements>

---

## Standard Stack

### Core (All Already Installed — No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NextAuth v5 (auth.js) | ~5.0.0-beta.25 | TeamFlow session management | Already installed; CredentialsProvider + JWT strategy + Redis session store |
| @nestjs/jwt | ^11.0.1 | JWT signing/verification | Used by both DevCollab and TeamFlow APIs |
| ioredis | existing | TeamFlow Redis session store | `apps/web/lib/redis.ts` — session callback reads/writes via Redis |
| Prisma | existing | Database ORM for both apps | Both apps use Prisma; seeding uses Prisma client directly |
| bcrypt | existing | Password hashing/verification | Used in both auth services |
| cookie-parser | existing | DevCollab API cookie parsing | `apps/devcollab-api/src/main.ts` requires it for cookie extraction |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| curl | system | Live endpoint diagnosis | Run from local or VPS to test live API endpoints before code changes |
| docker exec | system | Container log inspection | Check running container logs on VPS for error messages |

### Alternatives Considered
None applicable — this is a live diagnosis-and-fix phase. The stack is fully determined by what is already deployed.

---

## Architecture Patterns

### DevCollab Auth Flow (Cookie-Based)

```
Browser → devcollab.fernandomillan.me/login
         → POST ${NEXT_PUBLIC_API_URL}/auth/login  (CORS cross-origin, credentials: include)
         ← Set-Cookie: devcollab_token=<JWT>; HttpOnly; Secure; SameSite=None
         → router.push('/w/devcollab-demo')
         → GET ${NEXT_PUBLIC_API_URL}/workspaces/devcollab-demo (Cookie: devcollab_token=...)
```

**Critical config points:**
- `NEXT_PUBLIC_API_URL` is baked into the Docker image at **build time** via `ARG NEXT_PUBLIC_API_URL` in `apps/devcollab-web/Dockerfile`. The current local `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3003`. In production it must be the live API URL (set via GitHub Actions secret `NEXT_PUBLIC_DEVCOLLAB_API_URL`).
- The `coolify-compose.yml` `devcollab-web` service does NOT pass `NEXT_PUBLIC_API_URL` at runtime — confirming it must come from the image build arg.
- `devcollab-api` CORS is set to `process.env.DEVCOLLAB_WEB_URL` — this must match `https://devcollab.fernandomillan.me` in production.
- Cookie `sameSite: 'none'` and `secure: true` is set when `NODE_ENV === 'production'` — this is correct but requires HTTPS on both ends.

### TeamFlow Auth Flow (NextAuth + Redis + Bearer JWT)

```
Browser → teamflow.fernandomillan.me/login
         → NextAuth CredentialsProvider.authorize() (runs server-side in Next.js)
            → prisma.user.findUnique() (direct DB, no API call)
            → bcrypt.compare()
            → returns user object
         → signIn callback → createSessionInRedis(userId, sessionToken)
         → JWT callback → stores { id, role, sessionToken } in JWT
         → session callback:
            → getSessionFromRedis(sessionToken)   ← REQUIRES REDIS
            → prisma.user.findUnique()             ← REQUIRES DB
            → jwt.sign({ sub, email, role }, JWT_SECRET, { expiresIn: '15m' })
            → session.accessToken = accessToken
         → router.push('/teams')
         → GET /api/teams (Authorization: Bearer <accessToken>)
```

**Critical config points:**
- `NEXTAUTH_URL` must be set to `https://teamflow.fernandomillan.me` in Coolify. If unset or wrong, NextAuth redirects will break.
- `NEXTAUTH_SECRET` must be set in Coolify. If missing, NextAuth throws internally.
- `JWT_SECRET` must be set in the web service in Coolify AND in the API service in Coolify. They must be identical for bearer token verification to work. This is the same class of bug found in Phase 05.1 (mismatch between frontend fallback and backend value).
- `REDIS_URL` must point to a reachable Redis instance. The `apps/web/lib/redis.ts` connects to `process.env.REDIS_URL || 'redis://localhost:6380'`. In production the Redis is a separate service; if `REDIS_URL` is wrong or unset, every session callback will fail with Redis connection error, causing a blank session and redirect loop.
- `DATABASE_URL` must be set for both the web service (NextAuth reads Prisma directly) and the API service.
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are baked into the web image at build time (same pattern as DevCollab). Set via GitHub Actions secrets `NEXT_PUBLIC_TEAMFLOW_API_URL` and `NEXT_PUBLIC_TEAMFLOW_WS_URL`.
- TeamFlow API uses `NEXTAUTH_URL` as the CORS origin: `app.enableCors({ origin: process.env.NEXTAUTH_URL || 'http://localhost:3000' })`. This means if `NEXTAUTH_URL` is set to `https://teamflow.fernandomillan.me`, CORS will allow that origin — correct.
- TeamFlow's `middleware.ts` is **disabled** (`middleware.ts.disabled`). This means no auth middleware runs for protected routes. Protection happens in the dashboard layout (`await auth()` → redirect to `/login` if no session). This is fine but means the login redirect flow depends entirely on server components, not middleware.
- TeamFlow API port is `4000` (not `3001`) in production Docker — the `NEXT_PUBLIC_API_URL` must point to the correct port/domain.

### Database Seeding — Two Different Mechanisms

**DevCollab seed:**
- The `docker-compose.yml` (local dev) has a `devcollab-seed` service using `Dockerfile.seed`.
- The `coolify-compose.yml` (production) does **NOT** have a `devcollab-seed` service — only `devcollab-migrate`.
- This means the live DevCollab DB may not be seeded. Users `admin@demo.devcollab`, `contributor@demo.devcollab`, `viewer@demo.devcollab` may not exist.
- The seed script is idempotent (checks for existing admin user before running).
- To seed production: either add a seed service to `coolify-compose.yml`, or run the seed manually against the live DB.

**TeamFlow seed:**
- The `docker-compose.prod.yml` has no seed service.
- The TeamFlow API Dockerfile CMD is: `prisma db push --schema=... --skip-generate && node dist/main.js`. This handles schema sync but NOT seeding.
- Users `demo1@teamflow.dev` through `demo10@teamflow.dev` with password `Password123` may not exist on the live DB.
- To seed production: run the seed script (`packages/database && npm run seed`) against the live DATABASE_URL, or add a seed service to the deploy compose.

### Redirect After DevCollab Login

The login page on DevCollab hardcodes the redirect to `/w/devcollab-demo`:
```typescript
// apps/devcollab-web/app/(auth)/login/page.tsx
if (res.ok) {
  router.push('/w/devcollab-demo');
}
```
The workspace slug `devcollab-demo` is created by the seed script. If seed hasn't run, this page will load but show "Workspace not found".

### Redirect After TeamFlow Login

```typescript
// apps/web/components/auth/login-form.tsx
router.push('/teams');
```
The `/teams` page fetches `/api/teams` using the bearer token from the session. The `(dashboard)/layout.tsx` guards the route with `await auth()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Live API test | Custom script | `curl` with explicit headers | Fastest to confirm whether API is up and CORS headers are correct |
| Session debugging | Guessing | Check container logs via `docker logs <container>` or Coolify UI | Container logs will show exact NextAuth errors, Redis failures, JWT errors |
| Seed execution on live DB | Redeploying everything | Run seed script directly against live DATABASE_URL | Targeted, fast, no downtime |
| JWT secret rotation | Manual coordination | Update Coolify env vars then redeploy both services together | Secret mismatch is the exact bug that blocked Phase 05.1 for days |

---

## Common Pitfalls

### Pitfall 1: NEXT_PUBLIC_API_URL Points to Localhost in Production Image
**What goes wrong:** The built Docker image for devcollab-web has `NEXT_PUBLIC_API_URL=http://localhost:3003` baked in (local dev value). All API calls from the browser silently fail because `localhost:3003` is not accessible from the recruiter's browser.
**Why it happens:** `NEXT_PUBLIC_API_URL` is a build-time ARG. If the GitHub Actions secret `NEXT_PUBLIC_DEVCOLLAB_API_URL` is missing or empty, the build arg is blank and the fallback `http://localhost:3003` is used.
**How to avoid:** Verify the secret exists in GitHub Actions. Verify the built image by checking what URL the login page attempts to call (visible in browser DevTools Network tab).
**Warning signs:** Login form shows "Unable to connect to server" or network tab shows fetch to `localhost`.

### Pitfall 2: CORS Rejection on Cross-Origin Cookie Request
**What goes wrong:** DevCollab's `auth/login` is called cross-origin with `credentials: 'include'`. The API CORS must explicitly allow the web origin. If `DEVCOLLAB_WEB_URL` is set to `http://devcollab...` but the actual request comes from `https://devcollab...`, CORS will reject.
**Why it happens:** HTTP vs HTTPS mismatch, or domain typo in Coolify environment variables.
**How to avoid:** Confirm `DEVCOLLAB_WEB_URL` in Coolify exactly matches `https://devcollab.fernandomillan.me`.
**Warning signs:** Browser shows "CORS error" or "has been blocked by CORS policy" in DevTools console.

### Pitfall 3: TeamFlow Redis Connection Failure Causing Session Loop
**What goes wrong:** TeamFlow NextAuth session callback calls `getSessionFromRedis()`. If Redis is unreachable, the Redis client throws or times out. The callback returns an empty session (`{ user: { id: '', email: '', name: '', role: '' } }`). The dashboard layout detects `!session?.user` and redirects to `/login`. The user cannot log in regardless of correct credentials.
**Why it happens:** `REDIS_URL` not set in Coolify web service, or wrong Redis host/port.
**How to avoid:** Verify `REDIS_URL` is set in Coolify. Check that Redis is running and reachable from the web container. The auth.ts has logging: look for `[NextAuth Session Callback] SSR Failure:` with reason `Redis session not found or expired` in container logs.
**Warning signs:** Successful login but immediate redirect back to `/login`; logs show Redis connection errors.

### Pitfall 4: JWT_SECRET Mismatch Between TeamFlow Web and API
**What goes wrong:** TeamFlow web generates an `accessToken` signed with `JWT_SECRET`. The API verifies it with its own `JWT_SECRET`. If they differ, all API calls return 401. This is the exact bug found and fixed in Phase 06 for local dev, but must also be confirmed in production Coolify env vars.
**Why it happens:** Coolify has separate environment variable sections for each service. It's easy to set `JWT_SECRET` in the API service but forget it in the web service, or set different values.
**How to avoid:** Check that both the teamflow-web and teamflow-api Coolify services have identical `JWT_SECRET` values.
**Warning signs:** Login succeeds (NextAuth session created) but `/teams` shows empty or 401 errors; API logs show "invalid signature" JWT errors.

### Pitfall 5: Seed Not Run — Demo Users Don't Exist
**What goes wrong:** Login returns 401 "Invalid credentials" because the demo users were never created in the live database.
**Why it happens:** `coolify-compose.yml` has no `devcollab-seed` service. TeamFlow prod compose has no seed step. First deployment creates the schema but not the data.
**How to avoid:** Explicitly verify seed status before blaming auth code. Check via: `curl https://devcollab-api.fernandomillan.me/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@demo.devcollab","password":"Demo1234!"}'`. A 401 "Invalid credentials" (not 503/network error) indicates the API is up but user doesn't exist or password wrong.
**Warning signs:** 401 response from API when the API is otherwise healthy (health endpoint returns 200).

### Pitfall 6: NEXTAUTH_URL Set to Wrong Domain
**What goes wrong:** NextAuth uses `NEXTAUTH_URL` for callback URLs and CSRF validation. If it's set to `http://localhost:3000` or `https://teamflow.fernandomillan.me` with wrong protocol/path, login redirects fail or result in CSRF errors.
**Why it happens:** Coolify environment variable not updated after first deployment, or typo.
**Warning signs:** Login shows "CSRF token invalid" error, or redirect after login goes to wrong URL.

---

## Code Examples

### Verify Live DevCollab API Is Reachable
```bash
# Test 1: Health check (no auth required)
curl -v https://api-devcollab.fernandomillan.me/health
# or (depending on how Coolify routes it):
curl -v https://devcollab.fernandomillan.me/api/health

# Test 2: Login attempt
curl -v https://api-devcollab.fernandomillan.me/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://devcollab.fernandomillan.me" \
  -d '{"email":"admin@demo.devcollab","password":"Demo1234!"}' \
  --include

# Expected success: 200 + Set-Cookie: devcollab_token=...
# 401 = API up but seed not run or wrong password
# CORS error = DEVCOLLAB_WEB_URL env var wrong
# Connection refused = API container down or wrong URL
```

### Verify Live TeamFlow API Is Reachable
```bash
# Test 1: Health check
curl -v https://api-teamflow.fernandomillan.me/api/health

# Test 2: Login attempt (TeamFlow API is for bearer token, NextAuth handles credentials directly)
# Note: TeamFlow login goes through NextAuth which connects directly to Postgres — not the NestJS API
# To test if TeamFlow DB has seeded users:
curl -v https://teamflow.fernandomillan.me/api/auth/session
# Should return empty session object if not logged in

# To test if the NestJS API is reachable (post-login calls):
curl -v https://api-teamflow.fernandomillan.me/api/teams \
  -H "Authorization: Bearer <token>"
```

### Check Container Logs on Coolify VPS
```bash
# SSH into VPS (as root per STATE.md note)
sudo su -
docker logs devcollab-api --tail 50
docker logs devcollab-web --tail 50
docker logs teamflow-web-prod --tail 50  # or whatever container name Coolify uses
docker logs teamflow-api-prod --tail 50
```

### Run DevCollab Seed Against Live DB
```bash
# Connect to VPS, then:
# Option A: Run seed container manually
docker run --rm \
  --network devcollab-network \
  -e DEVCOLLAB_DATABASE_URL="<live_db_url>" \
  ghcr.io/fernandomillan-dev/fernandomillan/devcollab-seed:latest

# Option B: Add devcollab-seed to coolify-compose.yml (permanent fix for re-deployments)
# See Architecture section for the seed Dockerfile details
```

### Add Seed to coolify-compose.yml (DevCollab)
```yaml
# Add after devcollab-migrate service:
devcollab-seed:
  image: ghcr.io/fernandomillan-dev/fernandomillan/devcollab-seed:latest
  restart: "no"
  depends_on:
    devcollab-migrate:
      condition: service_completed_successfully
  environment:
    DEVCOLLAB_DATABASE_URL: ${DEVCOLLAB_DATABASE_URL}
```

Note: A `devcollab-seed` Docker image must be built and pushed in CI for this to work. The `Dockerfile.seed` exists at `packages/devcollab-database/Dockerfile.seed`. A build step must be added to `deploy.yml`.

### Run TeamFlow Seed Against Live DB
```bash
# On VPS or locally with live DATABASE_URL:
DATABASE_URL="<live_teamflow_db_url>" npm run seed --workspace=packages/database
```

---

## Investigation Checklist (Ordered by Likely Root Cause)

This is the diagnostic sequence the planner should encode as plan tasks:

**Step 1 — Verify APIs are reachable:**
- `curl https://<devcollab-api-domain>/health` → expect 200
- `curl https://<teamflow-api-domain>/api/health` → expect 200
- If unreachable: container is down or Coolify proxy misconfigured → fix container first

**Step 2 — Test login endpoint directly:**
- POST to DevCollab `/auth/login` with `admin@demo.devcollab / Demo1234!`
- If 401: seed not run → run seed
- If CORS error: `DEVCOLLAB_WEB_URL` wrong in Coolify
- If network error: `NEXT_PUBLIC_API_URL` wrong in image

**Step 3 — Check TeamFlow NextAuth:**
- Visit `https://teamflow.fernandomillan.me/api/auth/providers` → should list `credentials`
- If 500: `NEXTAUTH_SECRET` or `NEXTAUTH_URL` missing
- Try login with `demo1@teamflow.dev / Password123`
- If login fails: check `NEXTAUTH_URL`, Redis connectivity, DB seed

**Step 4 — Check container logs:**
- Look for explicit errors (CORS, JWT, Redis connection, missing env vars)

**Step 5 — Verify seeds:**
- Check if demo users exist in both databases
- Run seeds if missing

**Step 6 — Verify JWT_SECRET consistency for TeamFlow:**
- Confirm `JWT_SECRET` is identical in both teamflow-web and teamflow-api Coolify env vars
- After login, check if `/teams` page loads (requires valid bearer token)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookie-based auth (DevCollab) | Still cookie-based | N/A — never changed | Requires `sameSite: none` in production; `credentials: include` on all fetch calls |
| JWT fallback secrets | Fail-fast validation (Phase 06 fix) | Phase 06 | Frontend now throws if `JWT_SECRET` missing — but only for TeamFlow web; DevCollab web has no JWT requirement |
| No seed in prod compose | devcollab-seed exists in local compose but NOT coolify-compose | Ongoing gap | Must be addressed in Phase 34 |
| middleware.ts for auth | Disabled middleware (`middleware.ts.disabled`) | v3.x | Auth relies on server component redirects, not middleware — simpler but requires all protected pages to check auth |

**Deprecated/outdated:**
- Local `.env.local` values (localhost URLs) are irrelevant for production investigation — focus on Coolify environment variable configuration.
- Phase 05.1 findings are relevant history but specific to local dev JWT_SECRET mismatch. Production JWT_SECRET mismatch may also exist but in Coolify env vars.

---

## Open Questions

1. **What are the actual live API domain URLs for DevCollab and TeamFlow APIs?**
   - What we know: Web domains are `devcollab.fernandomillan.me` and `teamflow.fernandomillan.me`. API domains are unknown from code alone.
   - What's unclear: Coolify may route both web and API under the same domain (e.g., `/api/` prefix) or separate subdomains (e.g., `api.devcollab.fernandomillan.me`). The DevCollab API uses `PORT=3003` and TeamFlow API uses `PORT=4000`.
   - Recommendation: Check Coolify proxy configuration or try common patterns (`api-devcollab.fernandomillan.me`, `devcollab-api.fernandomillan.me`) to find live API URL before writing fix tasks.

2. **Has the DevCollab seed container image been built and pushed to GHCR?**
   - What we know: `Dockerfile.seed` exists in `packages/devcollab-database/`. The `deploy.yml` CI does NOT include a build step for `devcollab-seed` image.
   - What's unclear: Whether the image exists in GHCR or needs to be built.
   - Recommendation: Check GHCR for `ghcr.io/fernandomillan-dev/fernandomillan/devcollab-seed:latest`. If missing, the seed approach must be running the seed script directly against the live DB rather than adding a compose service.

3. **Is TeamFlow's live DB seeded?**
   - What we know: TeamFlow's prod compose and API Dockerfile have no seed step.
   - What's unclear: Whether the seed was run manually during original deployment.
   - Recommendation: Attempt login with `demo1@teamflow.dev / Password123` as first diagnosis step.

4. **What Redis is configured in Coolify for TeamFlow?**
   - What we know: TeamFlow web requires `REDIS_URL` to be set; local default is `redis://localhost:6380`.
   - What's unclear: Whether a Redis service is running alongside TeamFlow in Coolify and what its URL is.
   - Recommendation: Check TeamFlow web container logs for Redis connection errors on startup.

---

## Sources

### Primary (HIGH confidence — directly from codebase)
- `/home/doctor/fernandomillan/apps/devcollab-web/app/(auth)/login/page.tsx` — DevCollab login flow, `NEXT_PUBLIC_API_URL` usage, redirect target
- `/home/doctor/fernandomillan/apps/devcollab-api/src/auth/auth.controller.ts` — Cookie setting, `sameSite: none` in production
- `/home/doctor/fernandomillan/apps/devcollab-api/src/main.ts` — CORS config, `DEVCOLLAB_WEB_URL` usage
- `/home/doctor/fernandomillan/apps/web/lib/auth.ts` — NextAuth config, Redis session, JWT_SECRET validation, accessToken generation
- `/home/doctor/fernandomillan/apps/web/lib/redis.ts` — Redis client, `REDIS_URL` env var
- `/home/doctor/fernandomillan/apps/api/src/main.ts` — TeamFlow API CORS uses `NEXTAUTH_URL`
- `/home/doctor/fernandomillan/apps/web/Dockerfile` — `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` baked at build time via ARG
- `/home/doctor/fernandomillan/apps/devcollab-web/Dockerfile` — `NEXT_PUBLIC_API_URL` baked at build time via ARG
- `/home/doctor/fernandomillan/coolify-compose.yml` — Production DevCollab deploy; NO devcollab-seed service; NO TeamFlow services
- `/home/doctor/fernandomillan/.github/workflows/deploy.yml` — Build args set via GitHub secrets `NEXT_PUBLIC_DEVCOLLAB_API_URL`, `NEXT_PUBLIC_TEAMFLOW_API_URL`, `NEXT_PUBLIC_TEAMFLOW_WS_URL`
- `/home/doctor/fernandomillan/packages/devcollab-database/prisma/seed.ts` — Seed creates `admin@demo.devcollab / Demo1234!`
- `/home/doctor/fernandomillan/packages/database/prisma/seed.ts` — Seed creates `demo1@teamflow.dev / Password123`
- `/home/doctor/fernandomillan/packages/devcollab-database/Dockerfile.seed` — Seed container definition
- `/home/doctor/fernandomillan/apps/api/Dockerfile` — CMD runs `prisma db push` but NOT seed
- `/home/doctor/fernandomillan/.planning/phases/05.1-authentication-investigation/05.1-FINDINGS.md` — Prior JWT_SECRET mismatch investigation (local dev, same class of bug may exist in production)
- `/home/doctor/fernandomillan/.planning/STATE.md` — Confirms: "Login is broken on both `devcollab.fernandomillan.me` and `teamflow.fernandomillan.me` — root cause unknown, needs investigation"

### Secondary (MEDIUM confidence)
- `deploy.yml` confirms TeamFlow uses separate Coolify webhook deployments for API and web — they are separate services in Coolify and can have different env vars

---

## Metadata

**Confidence breakdown:**
- DevCollab auth architecture: HIGH — code is simple and fully readable
- TeamFlow auth architecture: HIGH — all layers inspected (NextAuth, Redis, JWT, API CORS)
- Failure hypotheses: MEDIUM — code-based inference, not runtime observation; live diagnosis required to confirm
- Production env var state: LOW — cannot see Coolify dashboard; must be diagnosed at runtime
- Seed status on live DB: LOW — cannot verify without connecting to live DB

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (30 days — stable domain, no library updates expected)
