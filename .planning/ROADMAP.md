# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 Foundation & Features** — Phases 1-7 (shipped 2026-02-16)
- ✅ **v1.1 UI/Design System Overhaul** — Phases 8-13 (shipped 2026-02-17)
- ✅ **v2.0 DevCollab** — Phases 14-21 (shipped 2026-02-18)
- ✅ **v2.5 Matrix Portfolio Overhaul** — Phases 22-26 (shipped 2026-02-19)
- 🚧 **v3.0 Deployment & Tech Debt Closure** — Phases 27-28 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation & Features (Phases 1-7) — SHIPPED 2026-02-16</summary>

- [x] Phase 1: Foundation & Authentication (7/7 plans) — completed 2026-02-14
- [x] Phase 2: Core Work Management (11/11 plans) — completed 2026-02-14
- [x] Phase 3: Real-Time Collaboration (4/4 plans) — completed 2026-02-15
- [x] Phase 4: Portfolio & Polish (10/10 plans) — completed 2026-02-15
- [x] Phase 5.1: Authentication Investigation (2/2 plans) — completed 2026-02-15
- [x] Phase 6: Authentication Fixes (2/2 plans) — completed 2026-02-16
- [x] Phase 6.1: User Flow & Architecture Audit (6/6 plans) — completed 2026-02-16
- [x] Phase 7: Phase 3 Verification & Real-Time Features Validation (1/1 plan) — completed 2026-02-16

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 UI/Design System Overhaul (Phases 8-13) — SHIPPED 2026-02-17</summary>

- [x] Phase 8: Foundation Validation (2/2 plans) — completed 2026-02-16
- [x] Phase 9: Design System Foundation (4/4 plans) — completed 2026-02-16
- [x] Phase 10: Component Migration (Portfolio) (4/4 plans) — completed 2026-02-17
- [x] Phase 11: Form Components & Validation (4/4 plans) — completed 2026-02-17
- [x] Phase 12: Critical Route Migration (9/9 plans) — completed 2026-02-17
- [x] Phase 13: Automation & Optimization (3/3 plans) — completed 2026-02-17

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 DevCollab (Phases 14-21) — SHIPPED 2026-02-18</summary>

- [x] Phase 14: Monorepo Scaffold + Infrastructure (4/4 plans) — completed 2026-02-17
- [x] Phase 15: Authentication System (5/5 plans) — completed 2026-02-17
- [x] Phase 16: Workspaces + Membership + RBAC (4/4 plans) — completed 2026-02-17
- [x] Phase 17: Content Creation — Snippets + Posts (5/5 plans) — completed 2026-02-18
- [x] Phase 18: Discussions + Reactions (4/4 plans) — completed 2026-02-18
- [x] Phase 19: Notifications + Activity Feed (4/4 plans) — completed 2026-02-18
- [x] Phase 20: Full-Text Search (3/3 plans) — completed 2026-02-18
- [x] Phase 21: Seed Data + Portfolio Integration (3/3 plans) — completed 2026-02-18

Full archive: `.planning/milestones/v2.0-ROADMAP.md`

</details>

<details>
<summary>✅ v2.5 Matrix Portfolio Overhaul (Phases 22-26) — SHIPPED 2026-02-19</summary>

- [x] Phase 22: Token Foundation (4/4 plans) — completed 2026-02-19
- [x] Phase 23: Canvas Matrix Rain (4/4 plans) — completed 2026-02-19
- [x] Phase 24: Scroll Animations + Entrance (3/3 plans) — completed 2026-02-19
- [x] Phase 25: Personality Effects (4/4 plans) — completed 2026-02-19
- [x] Phase 26: Navigation Redesign (2/2 plans) — completed 2026-02-19

Full archive: `.planning/milestones/v2.5-ROADMAP.md`

</details>

### 🚧 v3.0 Deployment & Tech Debt Closure (In Progress)

**Milestone Goal:** Deploy both SaaS apps to production on Coolify with HTTPS and close all known UI/code gaps so recruiters can interact with live, production-quality applications.

- [ ] **Phase 27: Infrastructure Foundation + Prisma Fix** - Deploy both apps to Coolify with HTTPS, CI/CD webhooks, GHCR pull auth, NEXT_PUBLIC baking, CORS, and Prisma import isolation
- [ ] **Phase 28: DevCollab UI Debt Closure** - Dashboard auth guard, member management UI, invite link generation, WorkspaceNav Members link, and real resume PDF

## Phase Details

### Phase 27: Infrastructure Foundation + Prisma Fix
**Goal**: Both TeamFlow and DevCollab applications are live on Coolify at HTTPS custom domains, auto-deploying from GitHub, with all environment configuration correct and the Prisma isolation bug eliminated
**Depends on**: Nothing (first phase of v3.0)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, FIX-01
**Success Criteria** (what must be TRUE):
  1. Visiting `https://devcollab.fernandomillan.dev` and `https://devcollab-api.fernandomillan.dev` in a browser returns live pages with valid TLS — no certificate warnings, no HTTP fallback
  2. Visiting `https://teamflow.fernandomillan.dev` and related TeamFlow domains returns live pages with valid TLS
  3. A browser console network tab on the DevCollab frontend shows API calls going to `https://devcollab-api.fernandomillan.dev` (not `localhost:3003`) — confirming NEXT_PUBLIC_API_URL was baked correctly at build time
  4. Logging into DevCollab in a browser sets a working auth cookie and subsequent API requests succeed — confirming CORS is configured with the exact HTTPS origin
  5. Pushing a commit to `main` triggers both the TeamFlow and DevCollab Coolify stacks to pull updated GHCR images and redeploy automatically within a few minutes
**Plans**: 3 plans

Plans:
- [ ] 27-01-PLAN.md — Fix Prisma import, cookie SameSite, and Dockerfile build-arg (FIX-01, DEPLOY-03, DEPLOY-04)
- [ ] 27-02-PLAN.md — GHA workflow update + coolify-compose.yml creation (DEPLOY-05, DEPLOY-06)
- [ ] 27-03-PLAN.md — Manual VPS GHCR auth, GitHub secrets, Coolify stack setup (DEPLOY-01, DEPLOY-02, DEPLOY-06)

### Phase 28: DevCollab UI Debt Closure
**Goal**: All previously API-only DevCollab admin features have working browser UI, the portfolio serves a real resume PDF, and unauthenticated visitors are correctly redirected
**Depends on**: Phase 27
**Requirements**: FIX-02, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Visiting `/dashboard` while logged out immediately redirects to `/login` — no flash of empty content, redirect happens server-side before any page content renders
  2. Navigating to `/w/devcollab-demo/members` shows a table of all workspace members with their names, email addresses, and current roles
  3. An Admin user can change a member's role using an inline selector on the members page and the change persists after page refresh
  4. An Admin user can click "Remove" next to any non-admin member and that member disappears from the table after the action completes
  5. An Admin user can click "Generate Invite Link" and see a complete shareable URL they can copy and send to someone to join the workspace
  6. The workspace navigation sidebar contains a "Members" link that navigates to the members page — the page is reachable without manually typing the URL
  7. Downloading `https://fernandomillan.dev/resume.pdf` (or equivalent portfolio domain) delivers a real PDF file, not a 404
**Plans**: 3 plans

Plans:
- [ ] 28-01-PLAN.md — Dashboard auth guard + portfolio fixes (FIX-02, UI-01)
- [ ] 28-02-PLAN.md — WorkspaceNav Members link + members page + MembersTable (UI-02, UI-03, UI-04, UI-05, UI-06)
- [ ] 28-03-PLAN.md — Phase 28 browser verification checkpoint (FIX-02, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 7/7 | Complete | 2026-02-14 |
| 2. Core Work Management | v1.0 | 11/11 | Complete | 2026-02-14 |
| 3. Real-Time Collaboration | v1.0 | 4/4 | Complete | 2026-02-15 |
| 4. Portfolio & Polish | v1.0 | 10/10 | Complete | 2026-02-15 |
| 5.1. Authentication Investigation | v1.0 | 2/2 | Complete | 2026-02-15 |
| 6. Authentication Fixes | v1.0 | 2/2 | Complete | 2026-02-16 |
| 6.1. User Flow & Architecture Audit | v1.0 | 6/6 | Complete | 2026-02-16 |
| 7. Phase 3 Verification | v1.0 | 1/1 | Complete | 2026-02-16 |
| 8. Foundation Validation | v1.1 | 2/2 | Complete | 2026-02-16 |
| 9. Design System Foundation | v1.1 | 4/4 | Complete | 2026-02-16 |
| 10. Component Migration (Portfolio) | v1.1 | 4/4 | Complete | 2026-02-17 |
| 11. Form Components & Validation | v1.1 | 4/4 | Complete | 2026-02-17 |
| 12. Critical Route Migration | v1.1 | 9/9 | Complete | 2026-02-17 |
| 13. Automation & Optimization | v1.1 | 3/3 | Complete | 2026-02-17 |
| 14. Monorepo Scaffold + Infrastructure | v2.0 | 4/4 | Complete | 2026-02-17 |
| 15. Authentication System | v2.0 | 5/5 | Complete | 2026-02-17 |
| 16. Workspaces + Membership + RBAC | v2.0 | 4/4 | Complete | 2026-02-17 |
| 17. Content Creation — Snippets + Posts | v2.0 | 5/5 | Complete | 2026-02-18 |
| 18. Discussions + Reactions | v2.0 | 4/4 | Complete | 2026-02-18 |
| 19. Notifications + Activity Feed | v2.0 | 4/4 | Complete | 2026-02-18 |
| 20. Full-Text Search | v2.0 | 3/3 | Complete | 2026-02-18 |
| 21. Seed Data + Portfolio Integration | v2.0 | 3/3 | Complete | 2026-02-18 |
| 22. Token Foundation | v2.5 | 4/4 | Complete | 2026-02-19 |
| 23. Canvas Matrix Rain | v2.5 | 4/4 | Complete | 2026-02-19 |
| 24. Scroll Animations + Entrance | v2.5 | 3/3 | Complete | 2026-02-19 |
| 25. Personality Effects | v2.5 | 4/4 | Complete | 2026-02-19 |
| 26. Navigation Redesign | v2.5 | 2/2 | Complete | 2026-02-19 |
| 27. Infrastructure Foundation + Prisma Fix | v3.0 | 2/3 | In Progress | - |
| 28. DevCollab UI Debt Closure | 1/3 | In Progress|  | - |
