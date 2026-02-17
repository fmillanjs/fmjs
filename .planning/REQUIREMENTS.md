# Requirements: Fernando Millan Portfolio & DevCollab

**Defined:** 2026-02-17
**Core Value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

## v2.0 Requirements

Requirements for v2.0 DevCollab milestone. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: devcollab-web (Next.js 15, port 3002) and devcollab-api (NestJS 11, port 3003) scaffold in existing Turborepo monorepo
- [ ] **INFRA-02**: `packages/devcollab-database` with separate Postgres (port 5435), Prisma schema, and generated client
- [ ] **INFRA-03**: Docker compose extended with devcollab-postgres, devcollab-api, devcollab-web, and MinIO services
- [ ] **INFRA-04**: CI/CD extended to build and push devcollab-web and devcollab-api images to GHCR

### Authentication

- [ ] **AUTH-01**: User can sign up for a DevCollab account (separate from TeamFlow)
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User session persists across browser refresh (httpOnly cookie)
- [ ] **AUTH-04**: User can log out

### Workspace

- [ ] **WORK-01**: User can create a new workspace with name and slug
- [ ] **WORK-02**: Admin can generate an invite link (time-limited, single-use)
- [ ] **WORK-03**: User can join a workspace via invite link
- [ ] **WORK-04**: Admin can view and manage workspace members
- [ ] **WORK-05**: Admin cannot remove the last Admin from a workspace

### Access Control

- [ ] **RBAC-01**: Admin can manage workspace members, roles, and all content
- [ ] **RBAC-02**: Contributor can create and edit own snippets, posts, and comments
- [ ] **RBAC-03**: Viewer can read all workspace content but cannot create or edit
- [ ] **RBAC-04**: All API endpoints deny access by default when no role decorator present

### Snippets

- [ ] **SNIP-01**: User can create a code snippet (title, language, code body)
- [ ] **SNIP-02**: Snippet displays with Shiki syntax highlighting and language selector
- [ ] **SNIP-03**: User can copy snippet code with a copy button
- [ ] **SNIP-04**: User can edit and delete own snippet
- [ ] **SNIP-05**: Each snippet has a shareable URL (GitHub Gist-style)

### Posts

- [ ] **POST-01**: User can create a Markdown post using a write/preview split-pane editor
- [ ] **POST-02**: User can save post as draft or publish it
- [ ] **POST-03**: User can edit and delete own post

### Discussions & Reactions

- [ ] **DISC-01**: User can comment on a snippet or post
- [ ] **DISC-02**: User can reply to a comment (one level deep)
- [ ] **DISC-03**: User can edit and delete own comment
- [ ] **DISC-04**: User can react to a post or comment (👍 ❤️ +1 😄)

### Notifications & Feed

- [ ] **NOTF-01**: User is notified when mentioned with @name in a comment
- [ ] **NOTF-02**: User sees unread notification count in bell icon
- [ ] **NOTF-03**: User can mark notifications as read
- [ ] **FEED-01**: User can view workspace activity feed (reverse-chronological, paginated)

### Search

- [ ] **SRCH-01**: User can search posts and snippets by text (full-text, workspace-scoped)
- [ ] **SRCH-02**: Search results are grouped (Posts / Snippets) with match highlighting
- [ ] **SRCH-03**: User can open global search with Cmd+K shortcut

### Portfolio

- [ ] **PORT-01**: DevCollab project card appears on Fernando's portfolio homepage
- [ ] **PORT-02**: DevCollab case study page exists at /projects/devcollab
- [ ] **PORT-03**: Portfolio links to DevCollab live demo

### Seed Data

- [ ] **SEED-01**: Demo workspace exists on first launch with realistic content (deterministic faker seed)
- [ ] **SEED-02**: Demo workspace demonstrates all three roles (Admin, Contributor, Viewer accounts)

## v3.0 Requirements (Deferred)

### Deployment

- **DEPL-01**: devcollab-web deployed to Coolify (custom domain, HTTPS, env vars locked)
- **DEPL-02**: devcollab-api deployed to Coolify (custom domain, HTTPS, env vars locked)

### File Uploads

- **FILE-01**: User can upload images and PDFs (up to 10MB) on a snippet or post
- **FILE-02**: Upload progress bar shown during file transfer
- **FILE-03**: MIME type validated via magic bytes (not Content-Type header only)

### TeamFlow Deferred Items

- **TF-01**: TeamFlow deployed to Coolify
- **TF-02**: Real resume PDF at /resume.pdf
- **TF-03**: TypeScript error cleanup in test files

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email notifications | Requires SMTP, deliverability, unsubscribe flows — high ops cost |
| Real-time activity feed (WebSocket) | 30s polling appropriate for content platform; WebSocket adds complexity with no recruiter-visible benefit |
| Content version history + diff view | HIGH complexity; impressive if built but deferred to v3+ |
| OAuth login for DevCollab | Email/password sufficient for portfolio demo |
| Voice/video channels | Out of DevCollab scope — not a communication-first tool |
| Mobile native app | Web-first approach across all projects |
| Meilisearch | Postgres tsvector sufficient at portfolio scale; Meilisearch adds Docker service overhead with no visible benefit |
| Multi-tenant billing | Not applicable to portfolio demo |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 14 | Pending |
| INFRA-02 | Phase 14 | Pending |
| INFRA-03 | Phase 14 | Pending |
| INFRA-04 | Phase 14 | Pending |
| AUTH-01 | Phase 15 | Pending |
| AUTH-02 | Phase 15 | Pending |
| AUTH-03 | Phase 15 | Pending |
| AUTH-04 | Phase 15 | Pending |
| WORK-01 | Phase 16 | Pending |
| WORK-02 | Phase 16 | Pending |
| WORK-03 | Phase 16 | Pending |
| WORK-04 | Phase 16 | Pending |
| WORK-05 | Phase 16 | Pending |
| RBAC-01 | Phase 16 | Pending |
| RBAC-02 | Phase 16 | Pending |
| RBAC-03 | Phase 16 | Pending |
| RBAC-04 | Phase 16 | Pending |
| SNIP-01 | Phase 17 | Pending |
| SNIP-02 | Phase 17 | Pending |
| SNIP-03 | Phase 17 | Pending |
| SNIP-04 | Phase 17 | Pending |
| SNIP-05 | Phase 17 | Pending |
| POST-01 | Phase 17 | Pending |
| POST-02 | Phase 17 | Pending |
| POST-03 | Phase 17 | Pending |
| DISC-01 | Phase 18 | Pending |
| DISC-02 | Phase 18 | Pending |
| DISC-03 | Phase 18 | Pending |
| DISC-04 | Phase 18 | Pending |
| NOTF-01 | Phase 19 | Pending |
| NOTF-02 | Phase 19 | Pending |
| NOTF-03 | Phase 19 | Pending |
| FEED-01 | Phase 19 | Pending |
| SRCH-01 | Phase 20 | Pending |
| SRCH-02 | Phase 20 | Pending |
| SRCH-03 | Phase 20 | Pending |
| PORT-01 | Phase 21 | Pending |
| PORT-02 | Phase 21 | Pending |
| PORT-03 | Phase 21 | Pending |
| SEED-01 | Phase 21 | Pending |
| SEED-02 | Phase 21 | Pending |

**Coverage:**
- v2.0 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

Note: The previous version of this file claimed 42 requirements. A recount of the actual requirement IDs listed above yields 41. No requirement is orphaned — all 41 are mapped to exactly one phase.

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 — traceability confirmed during roadmap creation (Phases 14-21)*
