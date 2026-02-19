# Feature Research

**Domain:** Full-stack SaaS portfolio — Coolify deployment + DevCollab UI tech debt closure
**Researched:** 2026-02-19
**Confidence:** HIGH (all claims verified against actual source files in the repository)

---

## Context: Two Categories of Work

This milestone contains two fundamentally different kinds of work that should not be conflated.

**Category A — Deployment** (no new code; configuration and infrastructure only)
Coolify setup for TeamFlow (apps/web + apps/api) and DevCollab (apps/devcollab-web + apps/devcollab-api). Both apps are fully containerized with Dockerfiles and images on GHCR. The work is env var wiring and HTTPS proxy config.

**Category B — UI gaps** (new client-side code in apps/devcollab-web)
Three features with zero browser UI today, plus two single-line fixes. The API endpoints already exist and are tested. The frontend is plain HTML/inline-style client components — no Shadcn, no Tailwind — matching the existing codebase style.

**Critical clarification on Shadcn:** Shadcn UI is installed in `apps/web` (the TeamFlow Next.js app). It is NOT installed in `apps/devcollab-web`. Confirmed by `apps/devcollab-web/package.json` — no `@radix-ui/*`, no `tailwindcss`, no `class-variance-authority`. All new devcollab-web UI components must use plain React with inline styles, consistent with the existing `dashboard/page.tsx`, `join/page.tsx`, and workspace pages.

---

## Feature Landscape

### Table Stakes (Must Close — All In Scope)

Features that are already API-complete but have no browser UI, creating a broken experience for anyone viewing the portfolio demo.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dashboard auth guard | Any route requiring a session must redirect unauthenticated visitors rather than silently rendering an empty state | LOW | `app/dashboard/page.tsx` is `'use client'` — server-side redirect is impossible in client components. Fix: convert to a server component that calls `cookies()` and `redirect('/login')` if no `devcollab_token`. The exact pattern already exists in `app/w/[slug]/layout.tsx` lines 14-18. Copy and adapt. |
| Invite link generation UI | Admin must be able to create and share invite links without curl commands | LOW | API endpoint exists: `POST /workspaces/:slug/invite-links` returns `{ token, expiresAt, workspaceId }`. UI is a button that fires the request and displays the shareable URL (`/join?token=<uuid>`). The consumer flow at `/join` is already fully built. |
| Member list UI | Admin must see who is in the workspace | LOW | API endpoint exists: `GET /workspaces/:slug/members` returns `[{ role, user: { id, name, email } }]`. UI is a plain HTML table rendered at a new page `/w/[slug]/members`. |
| Member role management | Admin must be able to promote/demote members | MEDIUM | API endpoint exists: `PATCH /workspaces/:slug/members/:userId/role` with `{ role: 'Admin' | 'Contributor' | 'Viewer' }`. The API already enforces last-Admin protection (returns 400 if demoting sole Admin). UI: inline `<select>` per row firing PATCH on change. |
| Prisma import fix | `reactions.service.ts` imports `PrismaClientKnownRequestError` from `@prisma/client/runtime/library` — this is the TeamFlow client path | LOW | One-line change. The `@devcollab/database` package re-exports `.prisma/devcollab-client` (confirmed in `packages/devcollab-database/src/index.ts`: `export * from '.prisma/devcollab-client'`). Correct import: `from '.prisma/devcollab-client/runtime/library'`. The wrong import may silently work in monorepo dev (both prisma clients share the same runtime JS file on disk) but risk mis-identifying error codes or failing type-checks in the isolated Docker container. |
| Resume PDF | Portfolio visitors expect a downloadable CV | LOW | No `resume.pdf` found anywhere in the repo (`find` confirmed). File goes in `apps/web/public/resume.pdf` — Next.js serves everything in `public/` as static files at the path root. The Dockerfile already copies `apps/web/public` to the runner stage. No code changes required beyond placing the file. |
| Coolify deployment (both apps) | Apps must be live with HTTPS — the whole point of the milestone | MEDIUM | Two Coolify services (or one Docker Compose app). Env vars differ per app. Key constraint: devcollab-api CORS is locked to `process.env.DEVCOLLAB_WEB_URL` — this must be set to the deployed HTTPS origin of devcollab-web, or all cross-origin cookie requests will be blocked. |

### Differentiators (Beyond Minimum — Worth Adding If Time Allows)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Copy-to-clipboard on invite URL | Removes friction — admin copies link in one click rather than manually selecting text | LOW | `navigator.clipboard.writeText(url)` with a "Copied!" state on the button. Single button, no dependencies. |
| Invite link expiry display | Shows "expires in X hours" so admin knows if the link is still valid | LOW | API returns `expiresAt` ISO string. Display with `new Date(expiresAt).toLocaleString()`. Communicates the 72-hour TTL the backend enforces. |
| WorkspaceNav "Members" link | Makes the members page discoverable — without it the URL is unreachable from the UI | LOW | Add an `<a href={'/w/${slug}/members'}>Members</a>` entry to `WorkspaceNav.tsx`. Required if building the members page. |
| Member remove action | Allows Admin to remove a member from the workspace | LOW | API endpoint exists: `DELETE /workspaces/:slug/members/:userId`. UI: a "Remove" button per row. API already has last-Admin protection on deletion too. |
| Confirm before role change | Prevents accidental demotions | LOW | `window.confirm()` is sufficient — no dialog library needed for an admin-only flow that recruiters do not see. |

### Anti-Features (Do Not Build These)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Shadcn components in devcollab-web | Looks polished | devcollab-web has no Shadcn, no Tailwind, no Radix — adding it means installing ~15 packages, configuring PostCSS, and wiring a component system. A week of setup work for admin-only flows no recruiter sees. | Plain `<table>`, `<button>`, `<select>` with inline styles matching the existing `dashboard/page.tsx` aesthetic. |
| Multi-use invite links | More flexible for sharing | The API marks each link `usedAt` on first use (single-use, by design, per WORK-03 in `workspaces.service.ts`). Building multi-use UI would require API and schema changes. | Generate a new link for each invitee. Document this behavior in the UI (e.g., "Note: each link can only be used once"). |
| Real-time member list updates | Modern feel | devcollab-api has no WebSocket channel for workspace membership events. Adding one is a new feature, not UI debt closure. | HTTP fetch on page load. Add a "Refresh" button if needed. |
| Email invite sending | Enterprise pattern | Requires an email provider (Resend, SendGrid), SMTP config in Coolify, email templates, and error handling. Completely out of scope. | Admin copies the `/join?token=...` URL and sends it manually via any channel. |
| Fancy animations on admin pages | Portfolio polish | Recruiters do not see admin-only member management flows during a portfolio demo. Animation budget belongs on the public portfolio (apps/web), not DevCollab admin. | Zero animation on admin flows. Spend effort on the public site. |
| Pagination on member list | Scalability | This is a demo workspace with seed data (~5 members maximum). Pagination adds complexity with zero user benefit at demo scale. | Render all members, no pagination. |
| Member search or filter | Power user feature | Same reasoning as pagination — demo scale makes it useless. | Plain table, no filtering. |
| Server Actions in devcollab-web | Modern Next.js pattern | The entire existing devcollab-web codebase uses client-side `fetch` with `credentials: 'include'` for auth cookie forwarding. Server Actions use a different auth model and would require significant refactoring of the cookie/session pattern. | Stick with client-side fetch pattern already established throughout the app. |

---

## Expected Behavior: Invite Link UI

**Where:** A new "Admin" section on the workspace overview page (`/w/[slug]`) or on the members page (`/w/[slug]/members`). Visible only when the current user's role is Admin (determined from the members API response).

**Server-side role check:** The page fetches `GET /workspaces/:slug/members`, finds the entry where `user.id` matches the current user's ID (from the `devcollab_token` JWT, decoded via a utility or passed as a cookie-forwarded server fetch). If the current user's role is `Admin`, render the invite section. If not, render nothing (the API will 403 anyway, but avoid showing unreachable buttons).

**User flow:**
1. Admin visits workspace overview or members page.
2. Admin clicks "Generate Invite Link" button.
3. Client POSTs to `/workspaces/:slug/invite-links` with `credentials: 'include'`.
4. API returns `{ token: "<uuid>", expiresAt: "<ISO date>", workspaceId: "..." }`.
5. UI displays the full shareable URL: `<APP_URL>/join?token=<uuid>`.
6. Admin copies URL and sends it to the intended invitee.
7. Invitee visits `/join?token=<uuid>`, clicks "Accept Invite" (existing join flow — already complete).

**Error states to handle:**
- 403 — user is not Admin. Should not happen if UI hides the button, but handle as a generic error.
- Network error — show inline error message under the button.
- Any 4xx from the API — display `data.message`.

**What NOT to show:** Do not show a list of previously generated invite links. The generate endpoint returns only the newly created link. Querying all links would require a new API endpoint. Display only the most recently generated link during the current page session (stored in React state, cleared on page reload).

---

## Expected Behavior: Member Management UI

**Where:** New page at `/w/[slug]/members`. Add a "Members" nav link to `WorkspaceNav.tsx`.

**Page structure:** Server component. Fetches `GET /workspaces/:slug/members` with the auth cookie forwarded (same pattern as `app/w/[slug]/page.tsx` — pass token from `cookies()` as Cookie header). Renders a plain HTML `<table>` with columns: Name, Email, Role, Actions.

**Admin user flow:**
1. Table shows all members: name, email, current role badge.
2. Each non-self row has a role `<select>` with options: Admin, Contributor, Viewer.
3. Changing the select fires `PATCH /workspaces/:slug/members/:userId/role` with `{ role: <new value> }`.
4. On success: update the displayed role in local state.
5. On 400 ("Cannot demote the last Admin"): show the API error message inline on the row.
6. Each row has a "Remove" button that fires `DELETE /workspaces/:slug/members/:userId`.
7. On success: remove the row from the table.

**Non-Admin user flow:**
1. Same table structure, read-only.
2. Role is displayed as plain text, no `<select>`.
3. No Remove button.
4. Determined by checking if the current user's entry in the members list has `role === 'Admin'`.

**Client vs server component split:** The page itself is a server component (fetches members, determines current user role). The interactive parts (role select, remove button) are a `'use client'` child component receiving the members list as a prop. This matches the pattern used in the rest of devcollab-web and avoids Server Actions.

---

## Feature Dependencies

```
[Dashboard auth guard]
    (standalone — no dependencies, no blockers)

[Invite link generation UI]
    └──requires──> API: POST /workspaces/:slug/invite-links (EXISTS)
    └──requires──> /join page with token handling (EXISTS — already complete)
    └──pairs with──> [WorkspaceNav Members link] (ship together for discoverability)

[Member list UI]
    └──requires──> API: GET /workspaces/:slug/members (EXISTS)
    └──required by──> [Member role management]
    └──required by──> [Member remove action]
    └──pairs with──> [WorkspaceNav Members link] (page is unreachable without nav link)

[Member role management]
    └──requires──> [Member list UI] (role selects live in table rows)
    └──requires──> API: PATCH /workspaces/:slug/members/:userId/role (EXISTS)

[Member remove action]
    └──requires──> [Member list UI]
    └──requires──> API: DELETE /workspaces/:slug/members/:userId (EXISTS)

[Prisma import fix]
    (standalone — one-line change, no other dependencies)
    └──should precede──> [Coolify deployment] (wrong import can silently fail in isolated container)

[Resume PDF]
    (standalone — file placement only, no code changes)

[Coolify deployment]
    └──requires──> [Prisma import fix] first
    └──requires──> DEVCOLLAB_WEB_URL set to deployed HTTPS URL in devcollab-api (CORS blocker if wrong)
    └──requires──> NEXT_PUBLIC_API_URL set to deployed HTTPS URL in devcollab-web
    └──requires──> DEVCOLLAB_JWT_SECRET env var in devcollab-api
    └──requires──> DEVCOLLAB_DATABASE_URL env var pointing to a reachable Postgres instance
```

### Dependency Notes

- **Member role management requires member list UI.** They are the same page — role selects live in table rows. Implement both together as one unit of work.
- **WorkspaceNav Members link is a blocker for member page discoverability.** Building the page without the nav link leaves it only reachable by manually typing the URL. Treat nav link + members page as one deliverable.
- **Fix Prisma import before deploying.** In the monorepo dev environment, `@prisma/client/runtime/library` and `.prisma/devcollab-client/runtime/library` share the same file on disk via npm hoisting, so the wrong import may pass silently. In the Docker container, only the devcollab-specific client is guaranteed to be present. Fix first, deploy second.
- **CORS env var is the most likely Coolify deployment failure.** devcollab-api's CORS is locked to `process.env.DEVCOLLAB_WEB_URL` (confirmed in `src/main.ts`). If this is not set to the HTTPS origin of the deployed devcollab-web, every browser request from devcollab-web will be blocked by the browser's same-origin policy. This is the single most important env var to get right.

---

## MVP Definition

### Launch With (This Milestone — All P1)

- [ ] Prisma import fix — one-line change in `apps/devcollab-api/src/reactions/reactions.service.ts`
- [ ] Dashboard auth guard — server component conversion of `apps/devcollab-web/app/dashboard/page.tsx`
- [ ] Member list UI — new page `apps/devcollab-web/app/w/[slug]/members/page.tsx`
- [ ] WorkspaceNav Members link — add to `apps/devcollab-web/components/WorkspaceNav.tsx`
- [ ] Member role management — inline role select in the members table (client component)
- [ ] Invite link generation UI — button + URL display, Admin-only section
- [ ] Resume PDF — place file at `apps/web/public/resume.pdf`
- [ ] Coolify deployment — both apps live with HTTPS, all env vars configured

### Add If Time Allows (Same Milestone — P2)

- [ ] Copy-to-clipboard on invite URL — `navigator.clipboard.writeText` + button state
- [ ] Invite link expiry display — format `expiresAt` next to the URL
- [ ] Member remove action — "Remove" button per row with DELETE call

### Future (Out of Scope)

- [ ] Multi-use invite links — requires API and schema changes
- [ ] Email invite delivery — requires email provider setup
- [ ] Real-time member list — requires WebSocket in devcollab-api
- [ ] Shadcn UI in devcollab-web — separate milestone if the app is ever redesigned

---

## Feature Prioritization Matrix

| Feature | Recruiter-Visible Value | Implementation Cost | Priority |
|---------|------------------------|---------------------|----------|
| Coolify deployment (both apps live) | HIGH — apps are unreachable without this | MEDIUM | P1 |
| Prisma import fix | HIGH — silent production bug | LOW | P1 |
| Dashboard auth guard | HIGH — broken UX for unauthenticated visitors | LOW | P1 |
| Resume PDF | HIGH — direct job-hunt utility, static file | LOW | P1 |
| Member list UI | MEDIUM — shows RBAC works end-to-end | LOW | P1 |
| WorkspaceNav Members link | MEDIUM — required for discoverability | LOW | P1 |
| Member role management | MEDIUM — demonstrates Admin CASL enforcement | MEDIUM | P1 |
| Invite link generation UI | MEDIUM — demonstrates invite flow end-to-end | LOW | P1 |
| Copy-to-clipboard on invite URL | LOW — minor convenience | LOW | P2 |
| Invite link expiry display | LOW — informational | LOW | P2 |
| Member remove action | LOW — extra capability, API already supports it | LOW | P2 |

---

## Env Vars Reference: What Coolify Needs

### devcollab-api (port 3003)

| Env Var | Purpose | Example |
|---------|---------|---------|
| `DEVCOLLAB_JWT_SECRET` | JWT signing secret | Any strong random string |
| `DEVCOLLAB_DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/devcollab` |
| `DEVCOLLAB_WEB_URL` | CORS origin for devcollab-web | `https://devcollab.fernandomillan.dev` |
| `PORT` | Server port (default 3003) | `3003` |
| `NODE_ENV` | Production mode | `production` |

### devcollab-web (port 3002)

| Env Var | Purpose | Example |
|---------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Client-side API base URL | `https://api.devcollab.fernandomillan.dev` |
| `NODE_ENV` | Production mode | `production` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` |

---

## Sources

All findings verified directly against source files. No WebSearch required — the codebase is the authoritative source.

- `apps/devcollab-web/app/dashboard/page.tsx` — confirms client component with no auth guard, shows the broken pattern
- `apps/devcollab-web/app/w/[slug]/layout.tsx` — confirms the correct auth guard pattern to replicate
- `apps/devcollab-api/src/workspaces/workspaces.controller.ts` — confirms all API endpoints, their paths, and CASL guards
- `apps/devcollab-api/src/workspaces/workspaces.service.ts` — confirms business logic: 72h TTL, single-use tokens, last-Admin protection
- `apps/devcollab-api/src/reactions/reactions.service.ts` line 2 — confirms wrong import path `@prisma/client/runtime/library`
- `packages/devcollab-database/src/index.ts` — confirms `export * from '.prisma/devcollab-client'` is the correct export
- `apps/devcollab-web/package.json` — confirms no Shadcn, no Tailwind, no Radix installed
- `apps/web/components.json` — confirms Shadcn is TeamFlow-only (`apps/web`)
- `apps/devcollab-web/Dockerfile` — confirms `apps/devcollab-web/public` is copied at build time
- `apps/devcollab-api/src/main.ts` — confirms `DEVCOLLAB_WEB_URL` env var name and CORS configuration
- `apps/devcollab-api/src/app.module.ts` — confirms `DEVCOLLAB_JWT_SECRET` env var name
- `apps/devcollab-web/app/join/page.tsx` — confirms the join flow is complete (no UI work needed there)
- `apps/devcollab-web/components/WorkspaceNav.tsx` — confirms no Members link exists today

---
*Feature research for: DevCollab UI gaps + Coolify deployment milestone*
*Researched: 2026-02-19*
