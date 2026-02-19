# Pitfalls Research: DevCollab Deployment + Admin UI Milestone

**Domain:** Coolify deployment (Next.js 15 standalone + NestJS 11) from GHCR private registry, plus admin UI pages (invite links, member management) added to existing Next.js 15 App Router + NestJS CASL application.
**Researched:** 2026-02-19
**Confidence:** HIGH (NEXT_PUBLIC build-time footgun — official Next.js docs + direct codebase evidence), HIGH (CORS with httpOnly cookies — official NestJS docs), HIGH (Coolify GHCR auth — confirmed GitHub issue #4604), HIGH (Next.js 15 async params/cookies — official migration docs), HIGH (CASL deny-by-default — direct codebase analysis), MEDIUM (Coolify internal networking — community docs + NestJS microservices guides), MEDIUM (Prisma custom output path in Docker — confirmed GitHub issue #25833)

---

## Critical Pitfalls

### Pitfall 1: NEXT_PUBLIC_API_URL Is Baked Into the Image at Build Time — Coolify Runtime Env Has No Effect

**Severity: CRITICAL**

**What goes wrong:**
`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle by the Next.js compiler at `next build` time. Setting `NEXT_PUBLIC_API_URL` in Coolify's environment variable UI and expecting it to take effect at container start does NOT work. The container starts with whatever value was baked in during the GitHub Actions build step. The app silently falls back to `http://localhost:3003` (the `??` fallback in `dashboard/page.tsx` and `login/page.tsx`) and all API calls fail in production.

This is confirmed by direct codebase evidence:
- `apps/devcollab-web/app/dashboard/page.tsx` line 5: `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';`
- `apps/devcollab-web/app/(auth)/login/page.tsx` line 5: `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';`

Neither fallback is reachable in production — the value is either baked-in (correct) or baked-in as empty string (broken).

**Why it happens:**
Developers assume that Docker environment variables work at runtime for all env vars. They do for server-side variables (like `DEVCOLLAB_DATABASE_URL`, `JWT_SECRET`). But the `NEXT_PUBLIC_` prefix is a compile-time signal: Next.js replaces the variable reference with the literal value during `next build`. After the Docker image is built, no amount of runtime env injection can change what was inlined.

**How to avoid:**
Set `NEXT_PUBLIC_API_URL` as a **GitHub Actions build argument**, not as a Coolify runtime environment variable.

In the GitHub Actions workflow, pass it at build time:
```yaml
# .github/workflows/deploy.yml — build-and-push-devcollab job
- name: Build and push devcollab-web image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: apps/devcollab-web/Dockerfile
    push: true
    build-args: |
      NEXT_PUBLIC_API_URL=${{ secrets.DEVCOLLAB_NEXT_PUBLIC_API_URL }}
    tags: |
      ghcr.io/${{ github.repository }}/devcollab-web:latest
```

In the Dockerfile, declare and use the ARG:
```dockerfile
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npx turbo build --filter=devcollab-web
```

Add `DEVCOLLAB_NEXT_PUBLIC_API_URL=https://api.yourdomain.com` to GitHub repository secrets.

**Warning signs:**
- Login page appears but clicking "Sign in" shows "Unable to connect to server" immediately
- Browser DevTools Network tab shows requests going to `localhost:3003` (the fallback) instead of the production domain
- In Coolify logs, the container starts and serves pages, but all fetch calls return network errors
- `docker inspect` of the running container shows `NEXT_PUBLIC_API_URL` is set in env, but the bundled JS still contains `localhost:3003`

**Phase to address:**
Deployment phase — before the container is first built for production. Verify by running `docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .` and then `docker run` and checking the served page source for the correct URL.

---

### Pitfall 2: Coolify GHCR Authentication — Docker Credentials Must Be Stored as Root on the VPS

**Severity: CRITICAL**

**What goes wrong:**
GitHub Actions pushes devcollab images to `ghcr.io` (private repository). Coolify pulls images from GHCR to deploy. Coolify fails with:
```
Error response from daemon: Head 'https://ghcr.io/v2/...': unauthorized: authentication required
```
or silently deploys the old image because the pull fails and Coolify falls back to whatever is cached locally.

The root cause is confirmed by Coolify GitHub issue #4604: the `coolify-helper` container (which executes Docker commands on behalf of Coolify) reads credentials from `/root/.docker/config.json`. If `docker login ghcr.io` was run as a non-root user (e.g., `ubuntu`, `deploy`, or any sudo user), the credentials are stored under that user's home directory, not root's, and the helper container cannot see them.

**Why it happens:**
Coolify's internal architecture runs Docker operations through the `coolify-helper` sidecar container, which mounts the Docker socket and reads credentials from the root user's Docker config. When a user SSHes into the VPS and runs `docker login` under their own user account (even with `sudo`), the credential file ends up in the wrong location.

Additionally, the GitHub Actions `GITHUB_TOKEN` that was used to push images cannot be used to pull from Coolify — `GITHUB_TOKEN` is scoped to the workflow run and expires. A separate Personal Access Token (PAT) with `read:packages` scope is required.

**How to avoid:**
1. Generate a **classic** GitHub PAT (fine-grained tokens have partial GHCR support as of 2025 — use classic to be safe) with `read:packages` scope. Set expiry to 1 year or "No expiration" and store in a secure vault.

2. SSH into the Coolify VPS and run as root:
```bash
sudo su -
echo "YOUR_CLASSIC_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
# Verify: cat /root/.docker/config.json — should show ghcr.io entry
```

3. Verify Coolify can pull:
```bash
# Still as root — test pull directly
docker pull ghcr.io/YOUR_ORG/devcollab-web:latest
```

4. In Coolify UI: set the image source to `ghcr.io/YOUR_ORG/devcollab-web:latest` and configure the PAT in Coolify's "Container Registries" settings if the UI supports it (Coolify v4+). The `docker login` on the VPS root is the fallback.

5. When the PAT expires, redeploy will silently fail — set a calendar reminder to rotate the token before it expires.

**Warning signs:**
- Coolify deployment logs show "unauthorized" or "denied" when pulling the image
- Coolify shows "Deployment successful" but the running container is the old version (cached from last successful pull)
- `docker pull ghcr.io/your-org/devcollab-web:latest` fails as root on the VPS
- GitHub shows the GHCR package as "Private" — this requires authentication; packages are private by default for private repositories

**Phase to address:**
Deployment setup phase — before any production deployment attempt. Run `docker pull` manually as root on the VPS to confirm auth works before triggering the first Coolify deployment.

---

### Pitfall 3: NestJS CORS Blocks httpOnly Cookie in Production — Whitelist Only the Production Domain

**Severity: CRITICAL**

**What goes wrong:**
The existing `main.ts` configures CORS with:
```typescript
app.enableCors({
  origin: process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002',
  credentials: true,
});
```
In production, if `DEVCOLLAB_WEB_URL` is not set in Coolify, the CORS origin stays `http://localhost:3002`. The browser sends a preflight `OPTIONS` to the production API from the production domain (`https://devcollab.yourdomain.com`) and receives a CORS rejection. The `devcollab_token` cookie is never set, and all authenticated requests silently fail with 401.

A second variant: `DEVCOLLAB_WEB_URL` is set to the correct domain but without `https://` — the CORS comparison is exact string match. `https://devcollab.yourdomain.com` does not match `devcollab.yourdomain.com` — CORS blocked.

A third variant: wildcard `*` is used to "fix" CORS quickly. With `credentials: true`, `origin: '*'` is rejected by the browser's CORS security model. The error is: `"The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'."` — this breaks cookie authentication entirely.

**Why it happens:**
Developers set the origin to fix a CORS error they can see, but don't realize that `credentials: true` requires an exact origin match with the full scheme + domain + port. The localhost config works locally because the origin matches. In production, the env var either isn't set or uses the wrong format.

**How to avoid:**
In Coolify, set `DEVCOLLAB_WEB_URL=https://devcollab.yourdomain.com` (exact match, including `https://`, no trailing slash).

For multi-origin support (e.g., staging + production), use array form:
```typescript
app.enableCors({
  origin: (process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002').split(','),
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
```
Set `DEVCOLLAB_WEB_URL=https://devcollab.yourdomain.com,https://staging.yourdomain.com` in Coolify.

Also, ensure the cookie attributes match production. When crossing `http` → `https`, the `Set-Cookie` response must include `SameSite=None; Secure` for cookies to be accepted by the browser. Verify in the NestJS JWT login handler that production cookies set these attributes.

**Warning signs:**
- Browser console shows: `Access to fetch at 'https://api.yourdomain.com' from origin 'https://devcollab.yourdomain.com' has been blocked by CORS policy`
- Network tab shows `OPTIONS` preflight request returning 204 but `Access-Control-Allow-Origin` header is missing or wrong
- Login POST succeeds (200) but no cookie appears in Application > Cookies (SameSite/Secure issue)
- All API calls return 401 after login (cookie wasn't stored because CORS blocked the Set-Cookie)

**Phase to address:**
Deployment phase — test CORS before any UI work. Use `curl` from a different origin to verify:
```bash
curl -v -X OPTIONS https://api.yourdomain.com/auth/login \
  -H "Origin: https://devcollab.yourdomain.com" \
  -H "Access-Control-Request-Method: POST"
# Response must include: Access-Control-Allow-Origin: https://devcollab.yourdomain.com
```

---

### Pitfall 4: Prisma Custom Output Path (`.prisma/devcollab-client`) Lost in Multi-Stage Docker Build

**Severity: CRITICAL**

**What goes wrong:**
The Prisma schema uses a custom client output:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../../node_modules/.prisma/devcollab-client"
}
```
The `devcollab-api/Dockerfile` builder stage runs `npx prisma generate --schema=packages/devcollab-database/prisma/schema.prisma`, which writes the generated client to `node_modules/.prisma/devcollab-client` in the builder stage. Then the runner stage copies `COPY --from=builder /app/node_modules ./node_modules`.

The failure mode: if the Docker build context is large, the turbo prune step filters only the files needed for `devcollab-api`. If the Prisma schema or the `prisma` binary is not in the pruned output, `prisma generate` silently fails or generates to the wrong path, and the runner gets a `node_modules/.prisma/devcollab-client` that is empty or missing — causing runtime crash:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```
or:
```
Cannot find module '.prisma/devcollab-client'
```

**Why it happens:**
Turbo's `prune` command for Docker builds includes only files referenced in the dependency graph of the target app. The `prisma generate` step requires the Prisma CLI (a dev dependency) and the schema file. If `packages/devcollab-database` is correctly included in the pruned output, it works. If the prune is too aggressive or the lockfile hash changed, the generated client is from an older run (Docker layer cache) and may be stale.

The secondary failure: the monorepo's `node_modules` is copied in the runner stage (`COPY --from=builder /app/node_modules ./node_modules`), but `.prisma/devcollab-client` is a generated artifact, not an installed package. It lives inside `node_modules` but is not tracked by npm — it only exists if `prisma generate` ran in that exact build stage.

**How to avoid:**
Verify the Dockerfile builder stage explicitly:
```dockerfile
FROM node:20-alpine AS builder
# After npm ci and COPY of full source:
RUN npx prisma generate --schema=packages/devcollab-database/prisma/schema.prisma
# Verify generate succeeded before the app build:
RUN test -d node_modules/.prisma/devcollab-client || (echo "Prisma generate failed" && exit 1)
RUN npx turbo build --filter=devcollab-api
```

In the runner stage, verify the generated client is present:
```dockerfile
FROM node:20-alpine AS runner
COPY --from=builder /app/node_modules ./node_modules
# Sanity check at start — catches missing client immediately
RUN test -d node_modules/.prisma/devcollab-client || (echo "FATAL: devcollab-client missing from node_modules" && exit 1)
```

Also: import from the correct path. The `packages/devcollab-database/src/client.ts` correctly uses `import { PrismaClient } from '.prisma/devcollab-client'`. Any new code that imports `from '@prisma/client'` instead will silently get the default Prisma client (which is the teamflow schema, not the devcollab schema) — causing type errors and wrong database queries.

**Warning signs:**
- Container starts but crashes immediately with `Cannot find module '.prisma/devcollab-client'`
- Container starts but all database operations return empty results or wrong schema errors (got `@prisma/client` instead of `.prisma/devcollab-client`)
- TypeScript error: `Property 'workspace' does not exist on type 'PrismaClient'` — indicates wrong client import path
- Docker build logs do not show `Generated Prisma Client (version X.XX.X) to .../devcollab-client`

**Phase to address:**
Deployment phase — verify Prisma client generation in the Docker build log before pushing any image. Add the `test -d` assertion to the Dockerfile builder stage as a permanent guardrail.

---

### Pitfall 5: Prisma Migration Against Production Database — `migrate deploy` Must Run as a Separate Step, Not in the Container CMD

**Severity: CRITICAL**

**What goes wrong:**
A common pattern is to add `npx prisma migrate deploy` to the container startup command so migrations run automatically on deploy:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```
In Coolify, when using the internal Docker network, the database service may not yet be ready when the API container starts. The migration command races with the database healthcheck, fails, and the container exits. Coolify marks the deployment as failed and rolls back to the previous container — meaning new schema changes never reach the database.

Alternatively, if migrations succeed but are destructive (e.g., removing a column), they run before the old container is stopped, causing the old container to crash mid-request — a brief data inconsistency window.

**Why it happens:**
Developers bundle migration into startup for simplicity. This works locally (docker-compose `depends_on` with healthcheck) but Coolify's deployment model does not guarantee service start order the same way. Coolify's database service may have a startup delay, and the API container's healthcheck may timeout before the database is ready.

**How to avoid:**
Use Coolify's **Post-Deploy Hook** (available in Coolify v4 via the UI or API) to run migrations after the new container is live:
```bash
# In Coolify application settings → Post-Deploy Command:
docker exec devcollab-api node -e "const {execSync} = require('child_process'); execSync('npx prisma migrate deploy', {stdio:'inherit'})"
```

Alternatively, use the dedicated `Dockerfile.migrate` already present in the codebase:
```bash
ls /home/doctor/fernandomillan/packages/devcollab-database/Dockerfile.migrate
```
Run it as a one-off task in Coolify before switching traffic to the new API container.

For the database readiness race: add a startup wait in the API `main.ts`:
```typescript
// Wait for database to be ready — max 30 seconds
async function waitForDb(prisma: PrismaService, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try { await prisma.$queryRaw`SELECT 1`; return; } catch { await new Promise(r => setTimeout(r, 3000)); }
  }
  throw new Error('Database not ready after 30 seconds');
}
```

**Warning signs:**
- Coolify deployment logs show `Error: Can't reach database server at ...` during container startup
- New database columns are missing in production (migration never ran because container crashed before applying)
- Coolify shows deployment as "Healthy" but API returns 500 on requests that use new schema fields
- `docker logs devcollab-api` shows migration error followed by process exit code 1

**Phase to address:**
Deployment phase — establish the migration strategy before the first production deploy. Never put `migrate deploy` in `CMD`.

---

## High-Severity Pitfalls

### Pitfall 6: Coolify Internal Docker Network — Server-Side Fetch From Next.js to NestJS Must Use Internal Hostname, Not the Public Domain

**Severity: HIGH**

**What goes wrong:**
Next.js 15 server components and server-side fetch calls (the `getWorkspace` function in `app/w/[slug]/page.tsx`) use `NEXT_PUBLIC_API_URL` as the base. In production, `NEXT_PUBLIC_API_URL` is baked as `https://api.yourdomain.com` — the public-facing URL. Server-side fetch from inside a Docker container to the public domain creates an unnecessary network round-trip: container → VPS network interface → reverse proxy → back into the same Docker network. This causes latency, may fail if the reverse proxy is not configured to resolve internal traffic back to itself, and adds TLS termination overhead for server-only calls.

**Why it happens:**
`NEXT_PUBLIC_API_URL` is a single value used by both client-side (browser) fetch calls and server-side (Node.js) fetch calls in the same codebase. The browser must use the public domain. The server can use the internal Docker hostname. Using one variable for both forces you to use the public domain everywhere.

**How to avoid:**
Add a server-only internal API URL env var:
```typescript
// In server components / server utilities:
const API_URL_INTERNAL = process.env.DEVCOLLAB_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
```

In Coolify, set `DEVCOLLAB_API_INTERNAL_URL` to the internal Docker hostname (e.g., `http://devcollab-api:3003` — using the container name as the hostname, as Docker DNS resolves it within the same Coolify project network).

The internal hostname format in Coolify follows the container name/service name set in the application settings. Check Coolify UI → Application → "Internal Docker Network" for the exact hostname.

For the current codebase, server-side fetches are in:
- `app/w/[slug]/page.tsx` — uses `NEXT_PUBLIC_API_URL`
- `app/w/[slug]/*/page.tsx` files — likely use same pattern

Client-side fetches (in `'use client'` components) must keep using `NEXT_PUBLIC_API_URL` (the public domain) because the browser cannot resolve Docker-internal hostnames.

**Warning signs:**
- Server component page loads are slow in production (500ms+ for simple data fetches)
- Server-side fetch returns ECONNREFUSED or ENOTFOUND for the internal API call
- Coolify logs show the API container receiving many requests with `X-Forwarded-For` pointing to the reverse proxy, not the Next.js container — indicates traffic is going through the proxy when it shouldn't

**Phase to address:**
Deployment phase — implement internal URL separation. Not urgent for MVP (public URL works, just slower), but important before performance-sensitive features.

---

### Pitfall 7: New Admin UI Pages Silently Return 403 Because `@CheckAbility` Is Not Declared on the New Controller Endpoint

**Severity: HIGH**

**What goes wrong:**
The CASL guard enforces deny-by-default: any endpoint that is not marked `@Public` AND does not have `@CheckAbility` throws `ForbiddenException('Endpoint must declare @CheckAbility — deny-by-default security invariant')`. When adding new invite link or member management API endpoints (e.g., `GET /workspaces/:slug/invite-links`), forgetting the `@CheckAbility` decorator causes ALL authenticated requests to return 403 — including Admin requests. The UI admin page shows "Forbidden" with no explanation.

This is the most likely pitfall when adding new endpoints to the `WorkspacesController` or a new controller, because the error message is `ForbiddenException` (403) rather than `UnauthorizedException` (401) — developers often look for auth issues, not permission decorator issues.

Direct evidence from `apps/devcollab-api/src/guards/casl-auth.guard.ts` line 52-56:
```typescript
if (!abilityReq) {
  throw new ForbiddenException(
    'Endpoint must declare @CheckAbility — deny-by-default security invariant',
  );
}
```

**Why it happens:**
Adding a new route handler and forgetting to copy the `@CheckAbility` decorator. This is especially easy to miss when generating a new module with `nest generate resource` — the generated controller methods have no `@CheckAbility` decorators and will immediately throw 403 for all requests.

**How to avoid:**
Every new route handler in the API must declare either:
```typescript
@Public() // For auth endpoints like login/register
```
or:
```typescript
@CheckAbility('create', 'InviteLink')  // Admin-only: action + subject from workspace-ability.factory.ts
```

For admin-only invite link management, the correct decorators based on the existing `WorkspaceAbilityFactory`:
```typescript
// Admin only — InviteLink operations:
@CheckAbility('create', 'InviteLink')  // Generate invite link — Admin only
@CheckAbility('read', 'InviteLink')    // List invite links — Admin only (Contributor cannot 'create', but can they 'read'? Verify in factory)

// Member management (already in controller, but for new endpoints):
@CheckAbility('update', 'WorkspaceMember')  // Change role — Admin only
@CheckAbility('delete', 'WorkspaceMember')  // Remove member — Admin only
```

Verify the ability matrix in `workspace-ability.factory.ts` before assigning subjects — `InviteLink` is explicitly `cannot('create', 'InviteLink')` for Contributors and Viewers.

**Warning signs:**
- New route returns 403 for Admin user (not 401) — the guard is running but the decorator is missing
- Error message in response body: `"Endpoint must declare @CheckAbility — deny-by-default security invariant"` — this is the exact string from the guard
- The route works if you temporarily add `@Public()` but breaks when you add `@CheckAbility` with wrong action/subject
- NestJS startup log shows no error — the guard issue only manifests at request time

**Phase to address:**
Every phase that adds new API endpoints. Add a unit test that calls every new endpoint without a valid session and expects 401 (not 403), and with a valid Viewer session expects 403 for admin operations — this catches missing `@CheckAbility` immediately.

---

### Pitfall 8: Admin UI Does Not Check CASL Permissions Client-Side — Shows Admin Controls to Non-Admin Users

**Severity: HIGH**

**What goes wrong:**
New invite link and member management UI pages are added to `app/w/[slug]/members/` and `app/w/[slug]/invite-links/`. These pages fetch member data and display "Invite Member" buttons, "Change Role" dropdowns, and "Remove Member" buttons. Without a client-side permission check, a Contributor or Viewer navigating to these pages sees the full admin UI. Clicking "Remove Member" returns 403 from the API (the CASL guard correctly denies it), but the UI shows a confusing error rather than simply not rendering the button.

**Why it happens:**
The API correctly enforces permissions (deny-by-default CASL guard), so there is no security breach. But the UI leaks capability context — showing controls that cannot succeed. This is a UX bug that commonly appears because developers implement API authorization first and forget to gate the UI components.

**How to avoid:**
Fetch the current user's role from `GET /workspaces/:slug/members` (which is already implemented) and use it to conditionally render admin controls:

```typescript
// Server component: app/w/[slug]/members/page.tsx
const members = await getMembers(slug); // calls GET /workspaces/:slug/members
const currentUser = // get from cookie-decoded JWT or separate /me endpoint
const currentMember = members.find(m => m.user.id === currentUser.sub);
const isAdmin = currentMember?.role === 'Admin';

// Pass isAdmin down to child components or read via context
```

For client components that need the role, either:
1. Pass `isAdmin` as a prop from the server component (preferred — no extra fetch)
2. Decode the JWT from the `devcollab_token` cookie (available client-side since it's not `HttpOnly` by default — verify this assumption)

Do not implement a client-side CASL ability — that would duplicate the server logic. A simple `role === 'Admin'` check in the UI is sufficient because the API remains the authoritative enforcer.

**Warning signs:**
- Viewer or Contributor can see "Remove Member" or "Change Role" buttons
- Clicking those buttons returns an error modal with "Forbidden" — correct security, bad UX
- Admin page is accessible via direct URL navigation by non-admin users (no server-side redirect)
- No conditional rendering on action buttons based on role

**Phase to address:**
Admin UI implementation phase. Fetch the current user's role as the first step of any admin page server component, and gate all mutation UI behind `isAdmin` before rendering.

---

### Pitfall 9: `cookies()` and `params` Are Async in Next.js 15 — Synchronous Access Causes Silent Fallback or TypeScript Error

**Severity: HIGH**

**What goes wrong:**
Next.js 15 made `cookies()`, `headers()`, and route `params` asynchronous. The existing codebase already correctly handles this (confirmed in `layout.tsx` and `page.tsx` files). But when adding new admin pages and copying patterns from older code or Stack Overflow answers for Next.js 14, the developer may use the synchronous pattern:

```typescript
// WRONG in Next.js 15 — synchronous access
const cookieStore = cookies(); // Missing await
const token = cookieStore.get('devcollab_token')?.value;
```

In Next.js 15, this does not throw immediately (there is a backwards-compatibility shim), but it logs a deprecation warning in development and may behave incorrectly in production builds where the shim is less lenient. For `params`, the TypeScript type is `Promise<{ slug: string }>` — accessing `params.slug` directly returns `undefined` without an error, causing the page to render with an undefined workspace slug.

**Why it happens:**
Next.js 14 code used synchronous `cookies()` and `params`. Stack Overflow answers, tutorials, and GitHub Copilot suggestions still use the old pattern. The synchronous access in Next.js 15 shows a deprecation warning but does not immediately break, so developers miss the issue until a future upgrade.

**How to avoid:**
All new server components MUST use the async pattern. Copy from the existing correct implementation in `layout.tsx`:

```typescript
// CORRECT — Next.js 15 async pattern (from existing layout.tsx)
export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;  // REQUIRED: Promise<> wrapper on type
}) {
  const { slug } = await params;  // REQUIRED: await params

  const cookieStore = await cookies();  // REQUIRED: await cookies()
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) redirect('/login');

  // ... rest of page
}
```

**Warning signs:**
- New page shows workspace data for `undefined` slug (API returns 404, page renders "workspace not found")
- `cookies()` returns a value but it's an object with `.then()` instead of `.get()` — indicates synchronous access in async context
- TypeScript error: `Type '{ slug: string }' is not assignable to type 'Promise<{ slug: string }>'` — the type annotation is missing `Promise<>`
- Development console shows: `Warning: cookies() should be awaited before using its value`

**Phase to address:**
Every phase that adds new page.tsx or layout.tsx files. Use the existing `layout.tsx` as the template — it is correct. Never copy from external Next.js 14 examples.

---

### Pitfall 10: Next.js Standalone Static Files Not Copied in Docker — `/public` Returns 404

**Severity: HIGH**

**What goes wrong:**
Next.js `output: 'standalone'` mode generates a minimal `server.js` that serves the app. However, the `public/` directory and `.next/static/` directory are NOT included in the standalone output — they must be explicitly copied in the Dockerfile. Looking at the existing `devcollab-web/Dockerfile`:

```dockerfile
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/.next/static ./apps/devcollab-web/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/public ./apps/devcollab-web/public 2>/dev/null || true
```

The `2>/dev/null || true` on the `public` directory copy means: if `devcollab-web/public/` does not exist, the copy silently succeeds. This is fine if there are no public assets. But when adding a favicon, OG images, or any public assets for the admin UI, a missing `public/` directory causes 404 for all those assets silently.

**Why it happens:**
The `|| true` was added to make the Dockerfile work when the `public/` directory doesn't exist yet. As soon as a `public/` directory is created, the `|| true` is harmless. But if the directory is accidentally not created or is empty, developers assume static assets are served when they are not.

**How to avoid:**
When adding public assets (favicons, OG images, any static files for the admin UI pages):
1. Create `apps/devcollab-web/public/` directory with the assets
2. Verify the Dockerfile copies it: the existing `COPY ... public ... 2>/dev/null || true` handles it
3. After Docker build, verify: `docker run devcollab-web wget -qO- http://localhost:3002/favicon.ico | head -c 5` (should not return empty)
4. Remove `2>/dev/null || true` once a `public/` directory with at least one file exists — this silences real errors

Also verify `.next/static` path alignment: the runner copies static files to `./apps/devcollab-web/.next/static`, and `server.js` serves them from the path it expects relative to its location. The CMD is `node apps/devcollab-web/server.js` from `/app` — verify the static path resolution matches.

**Warning signs:**
- CSS styles missing in production (`.next/static/css/` not served)
- Favicon 404 in production
- `next/image` with `src="/images/logo.png"` returns 404
- Browser DevTools shows 404 for `/_next/static/chunks/*.js` (indicates `.next/static` copy path mismatch)

**Phase to address:**
Any phase that adds public static assets. Verify immediately after each Docker build by running the container locally and checking static asset URLs.

---

### Pitfall 11: Optimistic UI for Role Change Shows Stale Role After Server Revalidation Flash

**Severity: MEDIUM**

**What goes wrong:**
When implementing `useOptimistic` for member role changes in the admin UI, there is a confirmed Next.js race condition (GitHub issue #49619): `useOptimistic` reverts to the server state BEFORE `revalidatePath` renders the fresh data. The user sees:
1. Role showing "Admin" (optimistic update applied immediately)
2. Briefly flashes back to "Contributor" (optimistic reverted)
3. Then shows "Admin" again (revalidated data arrives)

This double-flash makes the UI feel broken and is visible for ~200-500ms after each role change.

**Why it happens:**
`useOptimistic` reverts when the Server Action completes, but `revalidatePath` triggers an asynchronous re-render. There is a window where optimistic state is gone but fresh server state hasn't arrived yet.

**How to avoid:**
Two options:

Option A — Skip `useOptimistic`, use Server Actions with `revalidatePath` only. The "loading" state (button disabled, spinner) provides feedback without the flash:
```typescript
async function changeRole(formData: FormData) {
  'use server';
  await updateMemberRole(slug, userId, newRole);
  revalidatePath(`/w/${slug}/members`);
  // Page re-renders with fresh data — no optimistic needed for low-frequency admin actions
}
```

Option B — If optimistic is required: call `addOptimistic` AFTER `await serverAction()` (not before):
```typescript
const [optimisticMembers, addOptimistic] = useOptimistic(members, (state, update) => ...);

async function handleRoleChange() {
  const result = await updateMemberRoleAction(userId, newRole);
  if (result.success) {
    addOptimistic({ userId, newRole }); // After success — avoids the revert flash
  }
}
```

For member management (low-frequency admin action), Option A is simpler and sufficient. Reserve `useOptimistic` for high-frequency actions (reactions, notifications).

**Warning signs:**
- UI flickers on role change (old value briefly appears between update and revalidation)
- User reports "the role keeps going back to Contributor and then changing" — this is the flash
- `useOptimistic` with `addOptimistic` called before `await serverAction()` — this is the race setup

**Phase to address:**
Admin UI member management implementation. Default to Server Actions without `useOptimistic` for admin operations, and only add optimistic UI if UX testing shows the round-trip is too slow.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `NEXT_PUBLIC_API_URL` for both client and server fetches | Single variable to configure | Server-side calls go through public reverse proxy, adding latency | MVP only — add `DEVCOLLAB_API_INTERNAL_URL` before performance matters |
| Setting `DEVCOLLAB_WEB_URL=*` in CORS | Stops CORS errors immediately | Breaks cookie authentication entirely (`credentials: true` + wildcard is rejected by browsers) | Never |
| Running `prisma migrate deploy` in container CMD | Auto-migration on startup | Race with database readiness; migration errors crash container and prevent deployment | Never — use post-deploy hook |
| Skipping `@CheckAbility` with `@Public()` on new admin endpoints | Stops 403 errors quickly | Opens endpoint to unauthenticated access | Never for admin endpoints |
| Using `params.slug` synchronously in Next.js 15 page | Works in dev (backward-compat shim) | Deprecation warning; will break in Next.js 16+ when shim is removed | Never in new code |
| Classic PAT with `write:packages` scope for Coolify pull | One token for everything | PAT can push to GHCR — over-privileged for a pull-only operation | Acceptable for MVP; rotate to `read:packages` only PAT when feasible |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Coolify + NEXT_PUBLIC vars | Setting `NEXT_PUBLIC_API_URL` in Coolify environment variables | Pass as `--build-arg` in GitHub Actions `docker/build-push-action`; set in GitHub Secrets |
| Coolify + GHCR | Running `docker login ghcr.io` as a non-root user on the VPS | SSH in, `sudo su -`, then run `docker login ghcr.io` as root; verify `/root/.docker/config.json` |
| NestJS CORS + httpOnly cookies | `origin: '*'` with `credentials: true` | Exact origin string(s) matching production domain including `https://` scheme; never wildcard with credentials |
| Prisma custom output + Docker | Assuming `node_modules/.prisma/devcollab-client` copies automatically | Explicitly run `prisma generate` in builder stage; verify with `test -d` assertion before runner stage |
| Next.js standalone + static files | Missing `public/` directory silently ignored by `|| true` | Verify public asset URLs after every Docker build with `wget` or `curl` |
| CASL guard + new endpoints | Adding new controller method without `@CheckAbility` | Every non-public route gets `@CheckAbility` — treat missing decorator as a compile error (can be enforced with a lint rule) |
| Coolify internal Docker network + server fetches | Server-side Next.js fetch using public domain URL | Use `DEVCOLLAB_API_INTERNAL_URL` env var for server-side fetches; `NEXT_PUBLIC_API_URL` only for client-side |
| Coolify database service + Prisma | Using `localhost` as DB host in container | Use Coolify's internal Docker hostname (shown in Coolify UI under the database service details) as `DEVCOLLAB_DATABASE_URL` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Server-side Next.js fetch going through public reverse proxy | 300-500ms latency on server component page loads | Separate `DEVCOLLAB_API_INTERNAL_URL` for internal calls | Every page load that uses server-side data fetching |
| `useOptimistic` flash on member role changes | Double-render UI flicker visible to admin users | Use Server Actions without optimistic for low-frequency admin ops | Every role change when using `addOptimistic` before server action completes |
| No request deduplication on admin pages that fetch members list multiple times | Multiple identical API calls on single page render | Use `cache: 'no-store'` only where necessary; use React `cache()` for repeated reads within a single render | Pages with multiple server components each fetching the same member list |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| CORS wildcard with `credentials: true` | Browser blocks all cookie-based auth — effective DoS of authentication for all users | Exact origin match in `enableCors`; no wildcards when `credentials: true` |
| Invite link token exposed in GET query param (`?token=xxx`) | Token logged in server access logs, proxy logs, browser history | Always POST invite link tokens in request body; never in URL |
| Admin UI visible to non-admin users (UI-only gap, not API gap) | Non-admins see member management controls; confusing UX; may trigger user error reports | Server-side role check in page.tsx before rendering admin controls |
| `@Public()` on a new endpoint that should require auth | Unauthenticated access to data | Audit every `@Public()` usage — should only be on auth endpoints (`/auth/login`, `/auth/register`) |
| Classic PAT stored as GitHub secret with `write:packages` | If GitHub secret is compromised, attacker can push malicious images | Use a separate PAT with `read:packages` only for Coolify; use `write:packages` only in GitHub Actions GITHUB_TOKEN (auto-generated) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Admin shows "Forbidden" on member actions without role check | Contributor sees "Invite Member" button, clicks it, gets confusing 403 error | Server component checks role before rendering action buttons; Contributors see read-only view |
| Invite link copy button shows a raw UUID token | Admin confused about what to share with invitees | Format the invite link as a full URL: `https://devcollab.yourdomain.com/join?token=UUID` |
| Role change dropdown with no confirmation | Admin accidentally changes Admin to Viewer with a misclick | Confirmation step or undo capability for destructive role changes |
| "Member removed" without knowing who was removed | Admin cannot verify the right person was removed | Show member name/email in the removal confirmation and in the success state |
| Loading state missing on member list fetch | Page flashes empty state before data loads | Add `loading.tsx` to `app/w/[slug]/members/` for Suspense-based skeleton |

---

## "Looks Done But Isn't" Checklist

- [ ] **NEXT_PUBLIC_API_URL:** Set in Coolify env → verify by opening browser devtools and checking the actual URL in `fetch()` calls — it must be the production domain, not `localhost:3003`
- [ ] **GHCR auth:** Coolify shows image pulled → verify the timestamp on the image in Coolify UI matches the latest GitHub Actions push, not an older cached version
- [ ] **CORS:** Login succeeds with 200 → verify the `devcollab_token` cookie actually appears in Application > Cookies in Chrome DevTools after login
- [ ] **Prisma client:** API container starts → verify by calling an actual database-backed endpoint (e.g., `GET /workspaces`) returns data, not 500
- [ ] **Admin UI permissions:** Admin can see controls → verify Contributor and Viewer navigating to `/w/slug/members` see a read-only view, not action buttons
- [ ] **New API endpoints:** Returns data for Admin → verify with curl using a Contributor JWT token that the endpoint returns 403, not 200
- [ ] **Invite link URL:** Copy button copies "token string" → verify the copied value is a full URL (`https://...`) that opens the `/join` page when pasted in a browser
- [ ] **Migrations:** New columns exist → verify by connecting to the production database directly and running `\d workspace_members` (or equivalent) to confirm schema matches local

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| NEXT_PUBLIC baked as localhost | MEDIUM | Add `--build-arg NEXT_PUBLIC_API_URL=...` to GitHub Actions; trigger new build; old image is still running until new one deploys |
| GHCR auth fails on Coolify | LOW | SSH to VPS as root; `docker login ghcr.io`; in Coolify UI click "Force Redeploy" |
| CORS blocking cookies | LOW | Set `DEVCOLLAB_WEB_URL` in Coolify env; redeploy API (runtime env var, takes effect on restart) |
| Prisma client missing from Docker | HIGH | Rebuild image with corrected Dockerfile; push to GHCR; redeploy via Coolify; no data loss but deployment downtime |
| Migration ran before DB ready | LOW | In Coolify, redeploy to trigger fresh container start; or SSH and run `docker exec devcollab-api npx prisma migrate deploy` manually |
| 403 on new endpoint (missing @CheckAbility) | LOW | Add decorator to controller method; push; CI builds new image; Coolify redeploys |
| Admin controls visible to non-admins | LOW | Add server-side role check to page; push; CI/CD deploys; no data exposure, only UX fix |

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---------|----------|------------------|--------------|
| NEXT_PUBLIC_API_URL baked at build time | CRITICAL | Deployment setup phase | Browser devtools confirms fetch URL is production domain |
| GHCR auth — docker login as root | CRITICAL | Deployment setup phase | `docker pull ghcr.io/org/devcollab-web:latest` succeeds as root on VPS |
| NestJS CORS wrong origin | CRITICAL | Deployment setup phase | `curl -v OPTIONS` from different origin returns correct `Access-Control-Allow-Origin` |
| Prisma custom output path lost in Docker | CRITICAL | Deployment setup phase | `GET /workspaces` returns data (not 500); Dockerfile has `test -d` assertion |
| Prisma migrate in container CMD | CRITICAL | Deployment setup phase | Container starts in < 5 seconds; no migration error in logs |
| Internal Docker hostname for server fetches | HIGH | Deployment setup phase (MVP optional) | Page load time < 100ms for server components |
| Missing @CheckAbility on new endpoint | HIGH | Every phase adding API endpoints | Contributor JWT gets 403 on admin endpoints |
| Admin UI visible to non-admins | HIGH | Admin UI implementation phase | Contributor session sees read-only member list |
| Next.js 15 async params/cookies | HIGH | Every phase adding new pages | TypeScript type: `params: Promise<{ slug: string }>`; `await params` in component |
| Standalone static files not copied | HIGH | Any phase adding public assets | `curl` the production container for a static file URL |
| Optimistic UI role change flash | MEDIUM | Member management implementation | No visible flicker on role change in browser recording |

---

## Sources

**NEXT_PUBLIC build-time footgun:**
- [Next.js Environment Variables docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) — confirms `NEXT_PUBLIC_*` inlined at build time (HIGH confidence — official)
- [Next.js environment switching in 2025](https://gdsks.medium.com/next-js-environment-switching-in-2025-build-once-deploy-anywhere-efe76c55c09f) — build-once deploy-anywhere patterns (MEDIUM confidence)
- Direct codebase analysis: `apps/devcollab-web/app/dashboard/page.tsx` line 5 — `NEXT_PUBLIC_API_URL ?? 'http://localhost:3003'` (HIGH confidence — direct code)

**Coolify GHCR authentication:**
- [Coolify GitHub Issue #4604: Unable to use GitHub registry with Docker image resources](https://github.com/coollabsio/coolify/issues/4604) — root user credential requirement confirmed (HIGH confidence — confirmed bug)
- [Coolify Docs: Expired GitHub Personal Access Token](https://coolify.io/docs/troubleshoot/docker/expired-github-personal-access-token) — official troubleshooting (HIGH confidence)
- [GitHub Docs: Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) — PAT scopes for GHCR (HIGH confidence — official)

**NestJS CORS with credentials:**
- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors) — credentials + exact origin requirement (HIGH confidence — official)
- [The Ultimate NestJS CORS Guide](https://felixastner.com/articles/the-ultimate-nestjs-cors-guide-fixing-5-common-production-errors) — production CORS patterns (MEDIUM confidence)
- Direct codebase analysis: `apps/devcollab-api/src/main.ts` — `DEVCOLLAB_WEB_URL || 'http://localhost:3002'` (HIGH confidence)

**Next.js 15 async params/cookies:**
- [Next.js 15 Async APIs migration guide](https://nextjs.org/docs/messages/sync-dynamic-apis) — official breaking change docs (HIGH confidence)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) — async cookies/headers/params (HIGH confidence — official)
- [Supabase issue: new asynchronous cookies() in Next.js 15](https://github.com/supabase/supabase/issues/30021) — ecosystem impact (MEDIUM confidence)

**Prisma custom output path + Docker:**
- [Prisma Issue #25833: Cannot find module '.prisma/client/default' with custom output](https://github.com/prisma/prisma/issues/25833) — custom output Docker failure (HIGH confidence — confirmed issue)
- [Prisma Turborepo Guide](https://www.prisma.io/docs/guides/turborepo) — generate before build requirement (HIGH confidence — official)
- Direct codebase analysis: `packages/devcollab-database/prisma/schema.prisma` — `output = "../../../node_modules/.prisma/devcollab-client"` (HIGH confidence)

**Coolify internal networking:**
- [Host NestJS Microservices on Coolify](https://www.arijit.dev/blog/host-nestjs-microservices-on-coolify) — internal Docker DNS patterns (MEDIUM confidence)
- [How to add Redis in Coolify with NestJS](https://peturgeorgievv.com/blog/how-to-add-redis-in-coolify-with-nestjs) — internal hostname pattern (MEDIUM confidence)

**CASL deny-by-default:**
- Direct codebase analysis: `apps/devcollab-api/src/guards/casl-auth.guard.ts` lines 52-56 — explicit ForbiddenException for missing @CheckAbility (HIGH confidence)
- Direct codebase analysis: `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` — full RBAC matrix (HIGH confidence)

**Optimistic UI race condition:**
- [Next.js Issue #49619: useOptimistic revert before revalidatePath render](https://github.com/vercel/next.js/issues/49619) — confirmed race condition (HIGH confidence — confirmed bug)
- [Next.js docs: Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — recommended patterns (HIGH confidence — official)

**Next.js standalone static files:**
- [Next.js Issue #33895: outputStandalone does not include public directory](https://github.com/vercel/next.js/issues/33895) — confirmed behavior (HIGH confidence)
- [Next.js output standalone docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) — manual copy required (HIGH confidence — official)
- Direct codebase analysis: `apps/devcollab-web/Dockerfile` — `2>/dev/null || true` pattern on public copy (HIGH confidence)

---

*Pitfalls research for: Coolify deployment (Next.js 15 standalone + NestJS 11 from GHCR) + DevCollab invite/member management admin UI (Next.js 15 App Router + NestJS CASL)*
*Researched: 2026-02-19*
*Confidence: HIGH on all critical pitfalls — verified against official documentation, confirmed GitHub issues, or direct codebase analysis*
