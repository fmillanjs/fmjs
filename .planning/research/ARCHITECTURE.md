# Architecture Research

**Domain:** Coolify multi-service deployment + DevCollab UI gaps (full-stack monorepo)
**Researched:** 2026-02-19
**Confidence:** HIGH (Coolify networking, Next.js auth pattern, existing API endpoints); MEDIUM (Coolify GHCR pull auth, env var baking tradeoffs)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        INTERNET / DNS                             │
│  devcollab.fernandomillan.dev  ─────┐                            │
│  devcollab-api.fernandomillan.dev ──┤                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      │
┌─────────────────────────────────────▼────────────────────────────┐
│                 COOLIFY SERVER (Traefik Reverse Proxy)            │
│  Let's Encrypt SSL termination, Host()-based routing              │
│  Labels configured automatically by Coolify UI domain settings   │
└──────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼────────────────────────────┐
│         DOCKER COMPOSE STACK (single Coolify resource)           │
│  Coolify-managed bridge network — services communicate by name   │
│                                                                   │
│  ┌────────────────┐    ┌──────────────────┐                      │
│  │  devcollab-web │    │  devcollab-api   │                      │
│  │  Next.js 15    │───▶│  NestJS 11       │                      │
│  │  port 3002     │    │  port 3003       │                      │
│  │  standalone    │    │  CASL + JWT      │                      │
│  └────────────────┘    └────────┬─────────┘                      │
│                                 │                                 │
│               ┌─────────────────▼──────────────┐                 │
│               │       devcollab-postgres        │                 │
│               │       postgres:16-alpine        │                 │
│               │       port 5432 (internal only) │                 │
│               └────────────────────────────────┘                 │
│                                                                   │
│  devcollab-migrate (one-shot: runs prisma migrate deploy, exits) │
└──────────────────────────────────────────────────────────────────┘

NOTE: teamflow-web, teamflow-api, teamflow-postgres, and Redis live
in a SEPARATE Coolify stack on the same server. No cross-stack
communication is needed — each product is fully isolated.
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Traefik (Coolify-managed) | SSL termination, domain routing via Host() labels | Set domain in Coolify UI; labels auto-generated |
| devcollab-web | UI pages, SSR data fetching, httpOnly cookie auth gate | Next.js 15, standalone output, port 3002 |
| devcollab-api | Business logic, CASL RBAC, JWT via httpOnly cookie, Prisma ORM | NestJS 11, port 3003 |
| devcollab-postgres | Persistent storage for devcollab domain | postgres:16-alpine, internal port 5432 |
| devcollab-migrate | One-shot Prisma migration runner | Exits cleanly; API depends on `service_completed_successfully` |
| GitHub Actions CI | Test, build Docker images, push to GHCR, trigger Coolify webhook | `.github/workflows/deploy.yml` |

---

## New Files vs Modified Files

### Coolify Deployment

**New files to create:**

| File | Purpose |
|------|---------|
| `coolify-compose.yml` | Production Docker Compose used by Coolify. Contains devcollab-web, devcollab-api, devcollab-postgres, devcollab-migrate. References GHCR images (not build: blocks). No `networks:` keys — Coolify manages networking. |

**Existing files to modify:**

| File | What changes | Why |
|------|--------------|-----|
| `apps/devcollab-web/Dockerfile` | Add `ARG NEXT_PUBLIC_API_URL` and `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before the builder RUN stage | NEXT_PUBLIC vars are baked into the JS bundle at build time; must arrive via `--build-arg` in CI — cannot be set at runtime |
| `.github/workflows/deploy.yml` | Add `build-args: NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev` to the devcollab-web Docker build step; add separate Coolify webhook trigger job for the devcollab stack (`COOLIFY_DEVCOLLAB_WEBHOOK` secret) | CI currently only triggers the teamflow Coolify webhook in the `deploy` job; devcollab needs its own trigger |
| `apps/devcollab-api/src/main.ts` | Change the `enableCors` origin from fallback `http://localhost:3002` to read `process.env.DEVCOLLAB_WEB_URL` with the production domain as the expected value | CORS will block browser fetches in production if origin does not match |

**No changes needed:**

| File | Reason |
|------|--------|
| `apps/devcollab-web/next.config.ts` | Already has `output: 'standalone'` — correct |
| `apps/devcollab-api/Dockerfile` | Correct; runs `prisma generate` during build, exposes port 3003 |
| `packages/devcollab-database/Dockerfile.migrate` | Correct; runs `prisma migrate deploy` and exits |
| `packages/devcollab-database/Dockerfile.seed` | Seed is for local dev only; production Coolify stack should NOT include the seed container (real data would be wiped) |

---

### DevCollab Invite UI

**New files to create:**

| File | Purpose |
|------|---------|
| `apps/devcollab-web/app/w/[slug]/members/page.tsx` | Server component. Reads `devcollab_token` cookie, fetches `GET /workspaces/:slug/members`, passes data to `MemberTable`. Auth gate is already handled by parent `w/[slug]/layout.tsx`. |
| `apps/devcollab-web/app/w/[slug]/members/invite/page.tsx` | Server component. Renders `InvitePanel`. API Admin enforcement is done by CASL guard — non-admins see the page but the API returns 403 on generate. |
| `apps/devcollab-web/components/members/MemberTable.tsx` | Client component. Renders a table (inline styles or Shadcn Table if installed) with Name, Email, Role Badge per member. Admin users see a role dropdown (PATCH) and Remove button (DELETE) per row. Calls API with `credentials: 'include'`. |
| `apps/devcollab-web/components/members/InvitePanel.tsx` | Client component. "Generate Invite Link" button calls `POST /workspaces/:slug/invite-links`. Displays the returned token URL as a copyable string (e.g., `https://devcollab.fernandomillan.dev/join?token=<uuid>`). Shows 403 message if user is not Admin. |

**Existing files to modify:**

| File | What changes | Why |
|------|--------------|-----|
| `apps/devcollab-web/components/WorkspaceNav.tsx` | Add a "Members" `<a>` link: `href="/w/${slug}/members"` | The nav has Overview, Posts, Snippets, Activity links but no Members entry — the page is unreachable without a link |

---

### Dashboard Auth Guard

**Existing files to modify:**

| File | What changes | Why |
|------|--------------|-----|
| `apps/devcollab-web/app/dashboard/page.tsx` | Convert from `'use client'` to a server component. Read `devcollab_token` via `cookies()`, call `redirect('/login')` if absent. Move the `fetch('/workspaces')` call to server-side using the cookie header. Pass data as props to a child client component for the create-workspace form. | The current client component has no auth gate — any unauthenticated user can load the dashboard page. The form interactions still need client state, so extract a `WorkspaceList` client component for that part. |

---

## Recommended Project Structure (new additions only)

```
apps/devcollab-web/
├── app/
│   └── w/[slug]/
│       └── members/
│           ├── page.tsx              # Server component: member list
│           └── invite/
│               └── page.tsx          # Server component: invite panel
├── components/
│   └── members/
│       ├── MemberTable.tsx           # Client component: role management table
│       └── InvitePanel.tsx           # Client component: generate invite URL

coolify-compose.yml                   # Root of monorepo — Coolify production stack
```

---

## Architectural Patterns

### Pattern 1: Server Component Auth Gate (extend to dashboard)

**What:** Server components read the `devcollab_token` httpOnly cookie using Next.js `cookies()` and call `redirect('/login')` before any rendering occurs.

**When to use:** Any page route that requires authentication. The `w/[slug]/layout.tsx` already implements this correctly for all workspace sub-routes. The `/dashboard` route currently bypasses this because it is `'use client'`.

**Trade-offs:** Server-side redirect means zero flash of unauthenticated content. The Next.js layer does not validate the JWT cryptographically — it only checks presence. The API validates the JWT on every data fetch, which is the correct separation of concerns.

**Example — applying to dashboard:**
```typescript
// apps/devcollab-web/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getWorkspaces(token: string) {
  const res = await fetch(`${API_URL}/workspaces`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) redirect('/login');

  const workspaces = await getWorkspaces(token);
  // render server-side with data; extract client components for form interactions
}
```

---

### Pattern 2: Server Fetch → Client Interaction (existing pattern — extend to members)

**What:** The page (server component) fetches initial data by forwarding the cookie to the API. It passes that data as props to a client component that handles user interactions (buttons, dropdowns, form submits) via direct `fetch` with `credentials: 'include'`.

**When to use:** All devcollab-web pages already follow this pattern (e.g., `snippets/page.tsx` fetches list server-side, interactive elements are client components). Apply for members and invite pages.

**Trade-offs:** Initial load is fast and does not require client JavaScript for the first paint. Mutations are handled by client-side fetch calls to the API, consistent with every other page in the app. No server actions required.

**Example — members page:**
```typescript
// apps/devcollab-web/app/w/[slug]/members/page.tsx
import { cookies } from 'next/headers';
import MemberTable from '../../../../components/members/MemberTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getMembers(slug: string, token: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/members`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value ?? '';
  const members = await getMembers(slug, token);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
        Members
      </h1>
      <a href={`/w/${slug}/members/invite`} style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
        Generate Invite Link
      </a>
      <MemberTable slug={slug} initialMembers={members} />
    </div>
  );
}
```

---

### Pattern 3: Coolify Single Docker Compose Stack

**What:** All devcollab services are defined in one `coolify-compose.yml` and deployed as a single Coolify resource. Services communicate by Docker service name as hostname. Coolify manages the network automatically.

**When to use:** Services that are always deployed together and need to talk to each other directly.

**Critical rules:**
- Do NOT define `networks:` keys in the compose file used by Coolify. Coolify manages its own network per stack; manual network definitions cause Gateway Timeout errors.
- Set `restart: 'no'` on `devcollab-migrate`. Migration is a one-shot job. `restart: unless-stopped` on a job container causes infinite restart loops.
- Do NOT include the seed container in the production Coolify compose file. Seeds overwrite data.

**Example — coolify-compose.yml skeleton:**
```yaml
# coolify-compose.yml (root of monorepo)
# Used ONLY by Coolify in production.
# Local dev uses docker-compose.yml.
version: '3.8'

services:
  devcollab-postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: devcollab
      POSTGRES_PASSWORD: ${DEVCOLLAB_POSTGRES_PASSWORD}
      POSTGRES_DB: devcollab
    volumes:
      - devcollab-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U devcollab']
      interval: 10s
      timeout: 5s
      retries: 5

  devcollab-migrate:
    image: ghcr.io/OWNER/devcollab-api:latest  # reuse API image which has prisma
    restart: 'no'                               # CRITICAL: job container, not a service
    depends_on:
      devcollab-postgres:
        condition: service_healthy
    environment:
      DEVCOLLAB_DATABASE_URL: postgresql://devcollab:${DEVCOLLAB_POSTGRES_PASSWORD}@devcollab-postgres:5432/devcollab
    command: ["node_modules/.bin/prisma", "migrate", "deploy", "--schema=./packages/devcollab-database/prisma/schema.prisma"]

  devcollab-api:
    image: ghcr.io/OWNER/devcollab-api:latest
    restart: unless-stopped
    depends_on:
      devcollab-migrate:
        condition: service_completed_successfully
    environment:
      NODE_ENV: production
      PORT: 3003
      DEVCOLLAB_DATABASE_URL: postgresql://devcollab:${DEVCOLLAB_POSTGRES_PASSWORD}@devcollab-postgres:5432/devcollab
      DEVCOLLAB_JWT_SECRET: ${DEVCOLLAB_JWT_SECRET}
      DEVCOLLAB_WEB_URL: ${DEVCOLLAB_WEB_URL}   # set in Coolify UI to https://devcollab.fernandomillan.dev
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3003/health']
      interval: 10s
      timeout: 5s
      retries: 5

  devcollab-web:
    image: ghcr.io/OWNER/devcollab-web:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      # NEXT_PUBLIC_API_URL is baked into the image at build time via --build-arg
      # Runtime env vars here are for server-side only env vars if any are added later
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  devcollab-pgdata:
# NO networks: block — Coolify manages networking automatically
```

---

## Data Flow

### Coolify Deployment Flow (CI to Production)

```
git push → main
    │
    ▼
GitHub Actions: test job (existing)
    │
    ▼
build-and-push-devcollab job:
  docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev \
    -f apps/devcollab-web/Dockerfile .
  docker push ghcr.io/OWNER/devcollab-web:latest
  docker push ghcr.io/OWNER/devcollab-api:latest
    │
    ▼
deploy-devcollab job:
  curl -X GET $COOLIFY_DEVCOLLAB_WEBHOOK \
    -H "Authorization: Bearer $COOLIFY_TOKEN"
    │
    ▼
Coolify server:
  docker pull ghcr.io/OWNER/devcollab-web:latest
  docker pull ghcr.io/OWNER/devcollab-api:latest
  docker compose up -d (recreates changed containers)
  devcollab-migrate runs → exits 0
  devcollab-api starts
  devcollab-web starts
```

### Coolify Service Startup Dependency Chain

```
devcollab-postgres
  └── healthcheck: pg_isready passes
      │
      ▼
  devcollab-migrate
    └── condition: service_healthy (postgres)
    └── runs prisma migrate deploy
    └── exits 0
        │
        ▼
    devcollab-api
      └── condition: service_completed_successfully (migrate)
      └── starts NestJS on :3003
          │
          (no hard depends_on but API must be up before web requests flow)
          │
          ▼
      devcollab-web
        └── starts Next.js standalone on :3002
```

### Browser Authentication Flow

```
Browser visits /login (no cookie)
    │
    ▼
LoginPage (client component)
  POST https://devcollab-api.fernandomillan.dev/auth/login
  { credentials: 'include' }
    │
    ▼
devcollab-api
  validates credentials
  Set-Cookie: devcollab_token=<jwt>; HttpOnly; Secure; SameSite=None
    │
    ▼
Browser stores cookie (httpOnly — not accessible to JS)
Browser navigates to /dashboard
    │
    ▼
Next.js server component DashboardPage
  cookies().get('devcollab_token')
  if missing → redirect('/login')          ← NEW: currently missing
  if present → fetch /workspaces with Cookie header
    │
    ▼
devcollab-api validates JWT from cookie → returns workspaces
    │
    ▼
Server renders DashboardPage with data → sends HTML to browser
```

### Invite Link Flow (new feature)

```
Admin navigates to /w/:slug/members/invite
    │
    ▼
InvitePage (server component) renders InvitePanel (client component)
    │
    ▼
Admin clicks "Generate Invite Link"
InvitePanel → POST /workspaces/:slug/invite-links { credentials: 'include' }
    │
    ▼
devcollab-api
  CaslAuthGuard: checks Admin role via WorkspaceAbilityFactory
  Non-admin → 403 Forbidden
  Admin → workspaces.service.generateInviteLink(slug)
  creates InviteLink { token: uuid, expiresAt: now+72h }
  returns { token, expiresAt }
    │
    ▼
InvitePanel displays:
  "Share this link:"
  https://devcollab.fernandomillan.dev/join?token=<uuid>
  [Copy button]
    │
    ▼
Admin sends link to new user
New user opens /join?token=<uuid>
  (must be logged in — POST /workspaces/join requires auth cookie)
  POST /workspaces/join { token } { credentials: 'include' }
    │
    ▼
devcollab-api
  validates token → marks usedAt → creates WorkspaceMember { role: Contributor }
  redirect to /dashboard
```

### Member Management Flow (new feature)

```
Admin navigates to /w/:slug/members
    │
    ▼
MembersPage (server component)
  GET /workspaces/:slug/members (with Cookie header)
  returns Member[] with { id, role, user: { id, name, email } }
    │
    ▼
MemberTable (client component) renders:
  Name | Email | Role (Badge) | Actions
    │
    ├─ Admin: role dropdown → PATCH /workspaces/:slug/members/:userId/role { role }
    │   API: 400 if demoting last Admin (service-level guard)
    │   API: 403 if requester is not Admin (CASL guard)
    │
    └─ Admin: Remove button → DELETE /workspaces/:slug/members/:userId
        API: 400 if removing last Admin (service-level guard)
        API: 403 if requester is not Admin (CASL guard)
```

---

## Coolify Deployment: Step-by-Step Integration Points

### Pre-Deployment: GHCR Auth on Coolify Server

```bash
# SSH into the Coolify server as the user Coolify is configured to use
ssh user@coolify-server

# Authenticate Docker with GHCR using a GitHub Personal Access Token
# Scope required: read:packages
docker login ghcr.io -u <github-username> -p <ghcr-pat-with-read-packages>

# Coolify auto-detects ~/.docker/config.json and uses credentials for all pulls
```

Note: This is a one-time server setup step. Without it, Coolify cannot pull private GHCR images and the deployment will fail with a pull access denied error.

### Coolify Resource Setup Order

```
1. Create Project in Coolify UI: "fernandomillan"
   └── Add Environment: "production"

2. Deploy devcollab stack:
   └── New Resource → Docker Compose
   └── Paste contents of coolify-compose.yml
   └── Set domains in Coolify UI:
       devcollab-web  → https://devcollab.fernandomillan.dev  → port 3002
       devcollab-api  → https://devcollab-api.fernandomillan.dev  → port 3003
   └── Set secret environment variables in Coolify UI:
       DEVCOLLAB_POSTGRES_PASSWORD = <strong-password>
       DEVCOLLAB_JWT_SECRET        = <min-32-char-secret>
       DEVCOLLAB_WEB_URL           = https://devcollab.fernandomillan.dev

3. Get Deploy Webhook URL:
   └── Resource Settings → Webhooks → copy URL
   └── Add as GitHub repo secret: COOLIFY_DEVCOLLAB_WEBHOOK
   └── Also confirm COOLIFY_TOKEN exists (shared across all webhooks)

4. Deploy teamflow stack separately (if not already deployed):
   └── Same process; separate Coolify resource
   └── No shared networking with devcollab stack
```

### Traefik Domain Routing

Coolify automatically generates the correct Traefik labels when a domain is entered in the resource UI. Do NOT add Traefik labels manually to `coolify-compose.yml`. Coolify's label injection is the only supported method; manual labels conflict and cause routing failures.

---

## NEXT_PUBLIC_API_URL: The Build-Time Baking Problem

This is the most important architectural constraint for the devcollab-web deployment.

**The problem:** `NEXT_PUBLIC_*` environment variables are inlined into JavaScript bundles at `next build` time. The value is a string literal in the compiled output. Setting a different value at container runtime has no effect on client-side code.

**The constraint in this codebase:** Both server components and client components use `process.env.NEXT_PUBLIC_API_URL`. Server components at runtime can read env vars normally, but client components use the baked literal.

**Strategy A (recommended — bake the public URL):**
- At CI build time: `--build-arg NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev`
- In `apps/devcollab-web/Dockerfile`: add `ARG NEXT_PUBLIC_API_URL` and `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL`
- Result: browser fetches go to `https://devcollab-api.fernandomillan.dev` (Traefik routes to devcollab-api:3003)
- Result: server fetches also go to `https://devcollab-api.fernandomillan.dev` (extra network hop through Traefik, but works correctly)

**Strategy B (do not use — bake internal URL):**
- Baking `http://devcollab-api:3003` (Docker internal hostname) works for server components
- Fails catastrophically for browser clients — Docker hostnames are not resolvable from user browsers
- All client components (`LoginPage`, `DashboardPage`, `JoinPage`, inline fetch calls) break in production

Strategy A is the correct choice. The minor overhead of server components routing through Traefik is acceptable for a portfolio project.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GHCR | `docker login ghcr.io` on Coolify server SSH | One-time setup; Coolify uses `~/.docker/config.json` automatically |
| Let's Encrypt / Traefik | Set domain in Coolify UI | Coolify handles certificate provisioning and renewal; no manual config |
| GitHub Actions → Coolify | `curl GET $COOLIFY_WEBHOOK -H "Authorization: Bearer $COOLIFY_TOKEN"` | One webhook URL per Coolify resource; teamflow and devcollab need separate webhooks |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| devcollab-web (server) → devcollab-api | `fetch(${API_URL}/...)` forwarding Cookie header | `API_URL` baked as `https://devcollab-api.fernandomillan.dev`; server hits Traefik which routes back to devcollab-api container |
| devcollab-web (browser) → devcollab-api | `fetch(${API_URL}/...)` with `credentials: 'include'` | Same baked URL; browser reaches it via DNS → Traefik → devcollab-api |
| devcollab-api → devcollab-postgres | Prisma connection string: `postgresql://devcollab:${PWD}@devcollab-postgres:5432/devcollab` | Docker internal DNS; service name `devcollab-postgres` is the hostname |
| devcollab-migrate → devcollab-postgres | Same connection string | One-shot; dependency via `service_completed_successfully` |
| devcollab-api CORS | `DEVCOLLAB_WEB_URL` env var in `app.enableCors({ origin })` | Must be `https://devcollab.fernandomillan.dev` in production; currently only reads this env var with localhost:3002 as fallback |
| devcollab-api ↔ teamflow-api | No communication | Fully isolated; separate stacks, separate databases, separate domains |

---

## Anti-Patterns

### Anti-Pattern 1: Baking the Internal Docker Hostname into NEXT_PUBLIC_API_URL

**What people do:** Set `NEXT_PUBLIC_API_URL=http://devcollab-api:3003` at build time so server components can use the fast internal path.

**Why it's wrong:** Browser JavaScript cannot resolve `devcollab-api` — that hostname only exists inside Docker. Every client-side fetch in every client component (`LoginPage`, `DashboardPage`, `JoinPage`) fails with a network error in production.

**Do this instead:** Bake `NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev`. Both browser and server can reach it. The extra Traefik hop from server components is negligible.

---

### Anti-Pattern 2: Defining `networks:` in the Coolify Compose File

**What people do:** Copy the local `docker-compose.yml` network configuration (`devcollab-network:`, `driver: bridge`) into the file used by Coolify.

**Why it's wrong:** Coolify assigns each compose stack its own isolated network automatically. Adding explicit network definitions conflicts with Coolify's internal management and causes Gateway Timeout errors. This is explicitly documented in Coolify's Docker Compose knowledge base.

**Do this instead:** Remove all `networks:` keys from `coolify-compose.yml`. Services in the same stack communicate by service name without any network configuration.

---

### Anti-Pattern 3: `restart: unless-stopped` on the Migration Container

**What people do:** Treat `devcollab-migrate` the same as the other services and set `restart: unless-stopped`.

**Why it's wrong:** `prisma migrate deploy` exits with code 0 after completing. A restart policy of `unless-stopped` causes Coolify to restart the exited container repeatedly — creating noise, log spam, and a potential race condition where migrations run against the API's live database.

**Do this instead:** Set `restart: 'no'` on `devcollab-migrate`. Use `depends_on: condition: service_completed_successfully` on `devcollab-api` so it waits for clean migration exit.

---

### Anti-Pattern 4: Leaving /dashboard Without a Server-Side Auth Gate

**What people do:** Leave `apps/devcollab-web/app/dashboard/page.tsx` as `'use client'` and trust the API's 401 response to prevent data access.

**Why it's wrong:** An unauthenticated user successfully loads the dashboard page — they see the workspace creation form and page chrome. The 401 just means the workspace list is empty. This is confusing UX and means the route is publicly crawlable/indexable.

**Do this instead:** Convert to a server component, read `devcollab_token` with `cookies()`, redirect immediately if absent. The pattern is already established in `w/[slug]/layout.tsx` — apply the same approach.

---

### Anti-Pattern 5: Including the Seed Container in the Production Coolify Stack

**What people do:** Copy the full local `docker-compose.yml` (which includes `devcollab-seed`) into `coolify-compose.yml`.

**Why it's wrong:** The seed script truncates tables and inserts demo data. Running seed in production resets all real user data. On every deployment, all workspaces, posts, snippets, and users created by real visitors would be deleted.

**Do this instead:** `coolify-compose.yml` must only include: `devcollab-postgres`, `devcollab-migrate`, `devcollab-api`, `devcollab-web`. Never include `devcollab-seed` or `devcollab-minio` (MinIO is local dev only).

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (portfolio demo) | Single Coolify compose stack; single postgres instance; no Redis; single Next.js process |
| 100–1k active users | Add PgBouncer for connection pooling; Redis for session revocation if needed |
| 10k+ users | Split services to separate Coolify resources for independent scaling; add Postgres read replicas; Next.js horizontal scale (stateless by design — cookie auth works) |

### Scaling Priorities

1. **First bottleneck:** Postgres connections — NestJS/Prisma opens a connection pool per process; under concurrent load the database becomes the bottleneck before the API does. Add PgBouncer before horizontal scaling.
2. **Second bottleneck:** Next.js standalone is a single Node.js process. Horizontal scaling is straightforward because JWT cookie auth is stateless — any instance can validate any request.

---

## Sources

**HIGH Confidence — Official / Direct Inspection:**
- [Coolify Docker Compose Networking Docs](https://coolify.io/docs/knowledge-base/docker/compose) — network-per-stack isolation, service name DNS, no `networks:` rule
- [Coolify Environment Variables](https://coolify.io/docs/knowledge-base/environment-variables) — variable injection behavior, all-containers sharing
- [Coolify GitHub Actions Integration](https://coolify.io/docs/applications/ci-cd/github/actions) — webhook mechanism, COOLIFY_WEBHOOK + COOLIFY_TOKEN pattern
- [Coolify Docker Registry Authentication](https://coolify.io/docs/knowledge-base/docker/registry) — `docker login` on server SSH, Coolify auto-detects config.json
- [Coolify Concepts (Projects/Environments/Resources)](https://coolify.io/docs/get-started/concepts) — resource model, Traefik domain routing
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) — server-side redirect pattern, `cookies()` API
- [Next.js cookies() API Reference](https://nextjs.org/docs/app/api-reference/functions/cookies) — Next.js 15 async cookies()
- [Next.js NEXT_PUBLIC build-time env discussion](https://github.com/vercel/next.js/discussions/17641) — confirmed NEXT_PUBLIC vars are baked at build time
- Codebase direct inspection: `apps/devcollab-web/`, `apps/devcollab-api/src/`, `docker-compose.yml`, `.github/workflows/deploy.yml`, `packages/devcollab-database/`

**MEDIUM Confidence — Community / Verified:**
- [Coolify Cross-Stack Communication Discussion](https://github.com/coollabsio/coolify/discussions/5059) — confirmed cross-stack requires "Connect to Predefined Network"; internal DNS breaks
- [Coolify Env Var Sharing Security Issue #7655](https://github.com/coollabsio/coolify/issues/7655) — confirmed all env vars shared across all containers in a compose stack
- [Coolify Next.js deployment guide (external)](https://www.nico.fyi/blog/deploy-next-js-prisma-postgres-using-coolify) — build-arg pattern for NEXT_PUBLIC vars in Coolify confirmed

---

*Architecture research for: Coolify multi-service deployment + DevCollab UI gaps*
*Researched: 2026-02-19*
*Scope: coolify-compose.yml (new), apps/devcollab-web/ members pages (new), dashboard auth guard (fix)*
