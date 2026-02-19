# Project Research Summary

**Project:** Fernando Millan Portfolio — v3.0 Deployment + DevCollab UI Closure
**Domain:** Full-stack monorepo — Coolify multi-service deployment + DevCollab admin UI tech debt
**Researched:** 2026-02-19
**Confidence:** HIGH

---

## Executive Summary

This milestone is two distinct categories of work that must not be conflated. Category A is deployment-only work: configuring Coolify to host both TeamFlow and DevCollab from their already-built GHCR Docker images, with HTTPS via Traefik. No new application code is required here — only infrastructure configuration, env var wiring, and a new `coolify-compose.yml`. Category B is UI debt closure: three DevCollab admin features (dashboard auth guard, member management UI, invite link generation UI) that have zero browser surface today despite having fully tested API endpoints. Both categories are prerequisite to the portfolio milestone goal — apps must be live and navigable for recruiters.

The recommended approach is to sequence infrastructure before UI: fix the Prisma import bug and deploy first, then close UI gaps as a second phase. This ordering is not arbitrary — several pitfalls (NEXT_PUBLIC baking, GHCR auth, CORS) will only surface when the real Docker environment is running, and discovering them mid-UI-development creates expensive context switches. The deployment foundation must be verified and stable before client-side polish begins.

The dominant risks in this milestone are all infrastructure footguns with high visibility and low recovery cost: NEXT_PUBLIC_API_URL must be baked into the image at GitHub Actions build time (not set in Coolify at runtime), GHCR authentication must be done as root on the VPS (not as a regular user), and CORS must use the exact HTTPS origin with no trailing slash. None of these are novel problems — they are well-documented and entirely avoidable with the right sequence of pre-flight checks before the first Coolify deployment attempt.

---

## Key Findings

### Recommended Stack

The existing codebase already uses the correct production stack for 2026: Next.js 15 (App Router, standalone output) for the frontend, NestJS 11 for the API, Prisma with a custom devcollab client output, PostgreSQL 16, and CASL for RBAC. No new technology decisions are required for this milestone. The v3.0 work is purely about deploying what already exists and closing three UI gaps with plain React and inline styles — matching the devcollab-web codebase's existing aesthetic, which has no Shadcn, no Tailwind, and no Radix installed.

Shadcn UI is confirmed installed only in `apps/web` (TeamFlow). DevCollab-web uses plain React client components with inline styles. Adding Shadcn to devcollab-web would require installing approximately 15 packages and configuring PostCSS — a week of setup work for admin-only flows that recruiters do not see during a portfolio demo. This is explicitly an anti-feature for this milestone.

**Core technologies (existing — no changes):**
- Next.js 15 + App Router: SSR frontend, standalone output mode for Docker
- NestJS 11 + CASL: API layer with deny-by-default RBAC enforcement
- Prisma (custom `.prisma/devcollab-client` output): type-safe ORM targeting devcollab's Postgres schema
- PostgreSQL 16: primary data store, separate instances per app
- Docker + GHCR: container packaging and image registry
- Coolify + Traefik: self-hosted deployment platform with automatic SSL

### Expected Features

All features in this milestone are already API-complete. The UI work closes browser surfaces for existing endpoints, not building new backend functionality.

**Must have (table stakes — all P1):**
- Prisma import fix — one-line change in `reactions.service.ts`; prevents silent failure in the isolated Docker container
- Dashboard auth guard — convert `app/dashboard/page.tsx` from `'use client'` to a server component with `cookies()` redirect; exact pattern already exists in `w/[slug]/layout.tsx`
- Member list UI — new page at `/w/[slug]/members` rendering `GET /workspaces/:slug/members`
- WorkspaceNav Members link — add nav entry to make the members page discoverable
- Member role management — inline role `<select>` per table row calling `PATCH /workspaces/:slug/members/:userId/role`
- Invite link generation UI — "Generate Invite Link" button + shareable URL display, Admin-only section
- Resume PDF — place `resume.pdf` in `apps/web/public/`; no code changes required; Next.js serves everything in `public/` as static files
- Coolify deployment — both apps live with HTTPS, all env vars correctly configured

**Should have (P2, same milestone if time allows):**
- Copy-to-clipboard on invite URL — `navigator.clipboard.writeText` + "Copied!" button state
- Invite link expiry display — format `expiresAt` ISO string next to the URL
- Member remove action — "Remove" button per row calling `DELETE /workspaces/:slug/members/:userId`

**Defer (out of scope — future milestone):**
- Multi-use invite links — requires API and schema changes
- Email invite delivery — requires email provider (Resend/SendGrid) and templates
- Real-time member list — requires WebSocket channel in devcollab-api
- Shadcn UI in devcollab-web — separate redesign milestone

### Architecture Approach

The deployment architecture is a single Coolify Docker Compose stack containing four services: `devcollab-postgres` (postgres:16-alpine), `devcollab-migrate` (one-shot Prisma migration runner, `restart: 'no'`), `devcollab-api` (NestJS, depends on migrate completing successfully), and `devcollab-web` (Next.js standalone). Traefik handles SSL termination and domain routing via labels injected automatically by Coolify — no manual Traefik label configuration in the compose file. The TeamFlow stack is a separate Coolify resource on the same server with no cross-stack communication.

The UI architecture follows the existing devcollab-web pattern: server components fetch initial data by forwarding the `devcollab_token` httpOnly cookie to the API; client components handle mutations via `fetch` with `credentials: 'include'`. New admin pages follow this same server-to-client split without Server Actions, which would require refactoring the existing cookie/session pattern.

**Major components (files to create or modify):**
1. `coolify-compose.yml` (new, root of monorepo) — production Docker Compose for the devcollab stack; no `networks:` keys; `devcollab-migrate` with `restart: 'no'` and `service_completed_successfully` dependency
2. `apps/devcollab-web/Dockerfile` (modified) — add `ARG NEXT_PUBLIC_API_URL` + `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before the build stage
3. `.github/workflows/deploy.yml` (modified) — add `build-args: NEXT_PUBLIC_API_URL=...` to devcollab-web build step; add separate Coolify webhook trigger for the devcollab stack
4. `apps/devcollab-api/src/reactions/reactions.service.ts` (modified) — fix one-line Prisma import
5. `apps/devcollab-web/app/dashboard/page.tsx` (modified) — convert to server component with auth guard
6. `apps/devcollab-web/app/w/[slug]/members/page.tsx` (new) — server component, fetches members
7. `apps/devcollab-web/components/members/MemberTable.tsx` (new) — client component, role management table
8. `apps/devcollab-web/components/members/InvitePanel.tsx` (new) — client component, invite link generation
9. `apps/devcollab-web/components/WorkspaceNav.tsx` (modified) — add Members nav link

### Critical Pitfalls

1. **NEXT_PUBLIC_API_URL baked at build time, not runtime** — `NEXT_PUBLIC_*` vars are inlined into the JS bundle at `next build`. Setting them in Coolify's env UI has zero effect on client-side code. Must pass `--build-arg NEXT_PUBLIC_API_URL=https://devcollab-api.fernandomillan.dev` in the GitHub Actions Docker build step and declare `ARG`/`ENV` in the Dockerfile. Symptom: browser DevTools shows fetch calls going to `localhost:3003` instead of the production domain.

2. **Coolify GHCR auth must be done as root on the VPS** — Coolify's `coolify-helper` container reads Docker credentials from `/root/.docker/config.json`. Running `docker login` as a non-root user stores creds in the wrong location. Fix: SSH in, `sudo su -`, then `echo "PAT" | docker login ghcr.io -u USERNAME --password-stdin`. Use a classic GitHub PAT with `read:packages` scope.

3. **CORS requires exact HTTPS origin including scheme — no wildcard** — `DEVCOLLAB_WEB_URL` must be `https://devcollab.fernandomillan.dev` exactly (no trailing slash). `origin: '*'` with `credentials: true` is rejected by every browser — the cookie is never set and all auth fails silently. Set in Coolify env UI as a runtime variable (takes effect on container restart, no rebuild needed).

4. **`restart: 'no'` on devcollab-migrate is mandatory** — `prisma migrate deploy` exits 0 after completion. Without `restart: 'no'`, Coolify restarts the container infinitely, creating migration loops and a potential data race against the live database.

5. **CASL deny-by-default: every new route handler needs `@CheckAbility`** — the guard throws 403 with the message `"Endpoint must declare @CheckAbility — deny-by-default security invariant"` for any endpoint missing the decorator. Returns 403 (not 401), making it look like a permissions issue rather than a missing decorator. This is already implemented for all existing endpoints; any new API touch points in the UI work must carry the decorator.

---

## Implications for Roadmap

Based on combined research, the work breaks cleanly into two phases with an optional third.

### Phase 1: Infrastructure Foundation + Prisma Fix

**Rationale:** Nothing else can be verified until the apps are running in production. The NEXT_PUBLIC baking problem, GHCR auth, CORS, and migration sequencing all surface only in a real Docker environment. Fix the Prisma import first because it passes silently in monorepo dev (both Prisma clients share the same runtime file via npm hoisting) but fails in the Docker container where only the devcollab-specific client is guaranteed present.

**Delivers:**
- Both devcollab apps live at HTTPS domains (`devcollab.fernandomillan.dev` and `devcollab-api.fernandomillan.dev`)
- Coolify CI/CD pipeline integrated with GitHub Actions (separate webhook for devcollab stack)
- Prisma import corrected in `apps/devcollab-api/src/reactions/reactions.service.ts`
- All env vars verified functional in production environment

**Addresses from FEATURES.md:** Prisma import fix, Coolify deployment (both P1)

**Avoids from PITFALLS.md:** NEXT_PUBLIC baking (Pitfall 1), GHCR auth (Pitfall 2), CORS (Pitfall 3), Prisma custom output in Docker (Pitfall 4), migration in container CMD (Pitfall 5)

**Research flag:** Standard patterns — Coolify Docker Compose deployment is well-documented by official Coolify docs and confirmed community patterns. No additional research phase needed.

---

### Phase 2: DevCollab UI Debt Closure

**Rationale:** Only buildable after Phase 1 because new pages must be tested against the real production CORS and cookie configuration. The auth guard conversion, member management, and invite link UI are all low-complexity work using patterns that already exist in the codebase — research identified exact files to copy and adapt. The CASL deny-by-default architecture means the API already enforces correct permissions; the UI work is purely presentation.

**Delivers:**
- Dashboard auth guard — unauthenticated visitors redirected server-side to `/login` before any content renders
- Members page with role management — Admin sees role dropdowns and Remove buttons; non-Admin sees read-only table
- Invite link generation UI — Admin-only section with "Generate Invite Link" button + full shareable URL display
- WorkspaceNav Members link — makes the members page navigable without manually typing the URL
- Resume PDF live at `apps/web/public/resume.pdf`
- P2 additions if time allows: copy-to-clipboard button, expiry display, member remove button

**Addresses from FEATURES.md:** All remaining P1 items; P2 items if time permits

**Avoids from PITFALLS.md:**
- Next.js 15 async `params`/`cookies()` (Pitfall 9) — use `await params` and `await cookies()` consistently; copy type signature `params: Promise<{ slug: string }>` from existing `layout.tsx`
- CASL missing `@CheckAbility` on new endpoints (Pitfall 7) — no new endpoints needed; existing endpoints cover all features
- Admin controls visible to non-admins (Pitfall 8) — server-side role check before rendering mutation UI; pass `isAdmin` prop from server component
- Standalone static files not copied in Docker (Pitfall 10) — verify `apps/web/public/resume.pdf` is served after Docker build

**Research flag:** Standard patterns — Next.js server component auth gate and server-to-client data fetching are well-documented patterns already in use throughout devcollab-web. Exact reference implementations exist in `w/[slug]/layout.tsx` (auth gate) and `snippets/page.tsx` (data fetching). Copy and adapt.

---

### Phase 3 (Optional): Server-Side Fetch Optimization

**Rationale:** Low urgency for a portfolio demo. Server-side Next.js fetch currently uses the same `NEXT_PUBLIC_API_URL` (the public domain) for both browser and server calls, adding a Traefik round-trip for server components. Separating into `DEVCOLLAB_API_INTERNAL_URL` (Docker internal hostname for server) vs `NEXT_PUBLIC_API_URL` (public domain for browser) eliminates this overhead.

**Delivers:**
- Server components call API directly via Docker internal network (~10ms vs ~100ms per request)
- No user-visible functional changes

**Research flag:** Skip for now. Only pursue if page load performance is measurably slow after Phase 2. Standard pattern — see PITFALLS.md Pitfall 6 for implementation details.

---

### Phase Ordering Rationale

- **Infrastructure before UI:** NEXT_PUBLIC baking and GHCR auth are only discoverable in a real Docker environment. Discovering them during UI development is a costly context switch with high blame-diffusion — is the bug in the UI code or the env config?
- **Prisma fix before deployment:** The wrong import (`@prisma/client/runtime/library`) may pass silently in monorepo dev due to npm hoisting, but fails in the isolated container. Fix it unconditionally as part of Phase 1.
- **Member management and nav link together:** The members page is unreachable without the nav link. These are one deliverable, not two.
- **No Shadcn in devcollab-web:** Confirmed by `apps/devcollab-web/package.json` inspection. Not installed, not needed for recruiter-invisible admin flows.

### Research Flags

Phases needing additional research during planning: none. All patterns are verified against official sources and direct codebase analysis. The exact files to create/modify and the code patterns to use are fully specified in ARCHITECTURE.md.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure):** Coolify Docker Compose deployment, GitHub Actions integration, GHCR auth — covered by official Coolify docs and confirmed community patterns.
- **Phase 2 (UI Debt):** Next.js 15 server component auth gate, server-to-client data passing — reference implementations identified by file and line in ARCHITECTURE.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack verified by direct inspection of all package.json files. No new technology decisions required. Confirmed: devcollab-web has no Shadcn/Tailwind/Radix. |
| Features | HIGH | All claims verified against actual source files. API endpoints confirmed in WorkspacesController. CASL permissions confirmed in workspace-ability.factory.ts. Client patterns confirmed in existing pages. |
| Architecture | HIGH (Coolify networking, Next.js auth pattern, API endpoints) / MEDIUM (GHCR pull auth UI flow, NEXT_PUBLIC baking tradeoffs) | Coolify networking from official docs. NEXT_PUBLIC baking from official Next.js docs and direct codebase evidence (`dashboard/page.tsx` line 5). GHCR auth root requirement from confirmed Coolify GitHub issue #4604. |
| Pitfalls | HIGH | All 5 critical pitfalls backed by official docs, confirmed GitHub issues, or direct codebase line citations. All moderate pitfalls from community sources with multiple corroborating examples. |

**Overall confidence:** HIGH

### Gaps to Address

- **CORS cookie attributes in devcollab-api auth service (MEDIUM gap):** The `Set-Cookie` response from the JWT login handler needs `SameSite=None; Secure` when crossing from `http` to `https` in production. The exact cookie attributes in `apps/devcollab-api/src/auth/auth.service.ts` were not verified line-by-line. Check this on the first production login attempt by inspecting Application > Cookies in Chrome DevTools.

- **Coolify Container Registries UI (LOW gap):** Coolify v4+ has a Container Registries settings area that may allow configuring GHCR auth through the UI rather than SSH. The exact UI flow was not confirmed against the specific Coolify version on the VPS. Fallback — SSH as root + `docker login` — is the confirmed working method regardless of UI version.

- **Coolify devcollab webhook format (LOW gap):** The GitHub Actions deploy step format (GET vs POST, required headers) for the devcollab stack webhook needs to match the format already working for the teamflow webhook in `.github/workflows/deploy.yml`. Treat as copy-and-adapt from the existing webhook step.

---

## Sources

### Primary (HIGH confidence)

- Official Coolify docs (networking, env vars, GitHub Actions CI/CD, Docker registry, concepts) — Coolify deployment architecture and service dependency chain
- Next.js 15 official docs (authentication guide, cookies() API reference, async APIs migration, NEXT_PUBLIC env vars, standalone output) — server component auth pattern and build-time env var behavior
- NestJS official docs (CORS) — `credentials: true` with exact origin requirement
- Prisma official docs (Turborepo guide) — `prisma generate` before build in Docker
- Confirmed GitHub issues: Coolify #4604 (GHCR root auth requirement), Next.js #49619 (useOptimistic flash race condition), Next.js #33895 (standalone static files must be manually copied), Prisma #25833 (custom output path in Docker builds)
- Direct codebase inspection: `apps/devcollab-web/app/dashboard/page.tsx`, `apps/devcollab-web/app/w/[slug]/layout.tsx`, `apps/devcollab-api/src/workspaces/workspaces.controller.ts`, `apps/devcollab-api/src/workspaces/workspaces.service.ts`, `apps/devcollab-api/src/guards/casl-auth.guard.ts`, `apps/devcollab-api/src/reactions/reactions.service.ts`, `apps/devcollab-api/src/main.ts`, `apps/devcollab-web/package.json`, `apps/devcollab-web/Dockerfile`, `packages/devcollab-database/src/index.ts`, `.github/workflows/deploy.yml`

### Secondary (MEDIUM confidence)

- Coolify GitHub discussions #5059 (cross-stack networking) — confirmed cross-stack requires "Connect to Predefined Network"; internal DNS does not span stacks
- Coolify GitHub issue #7655 (env var sharing) — all env vars shared across all containers in a compose stack
- External Coolify + Next.js deployment guide (nico.fyi) — build-arg pattern for NEXT_PUBLIC vars confirmed by independent practitioner
- Community NestJS + Coolify microservices guides (arijit.dev, peturgeorgievv.com) — internal Docker DNS hostname patterns

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*
