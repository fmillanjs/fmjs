# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 Foundation & Features** — Phases 1-7 (shipped 2026-02-16)
- ✅ **v1.1 UI/Design System Overhaul** — Phases 8-13 (shipped 2026-02-17)
- ✅ **v2.0 DevCollab** — Phases 14-21 (shipped 2026-02-18)

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

### ✅ v2.0 DevCollab (Phases 14-21) — SHIPPED 2026-02-18

**Milestone Goal:** Build and deploy DevCollab — a developer collaboration platform combining GitHub-style technical content with Discord-style workspace organization, added to the portfolio alongside TeamFlow.

- [x] **Phase 14: Monorepo Scaffold + Infrastructure** - Two new Turborepo apps, separate Postgres, Docker compose extended, deny-by-default CASL guard established before any controllers (completed 2026-02-17)
- [x] **Phase 15: Authentication System** - DevCollab-specific JWT auth (DEVCOLLAB_JWT_SECRET, completely separate from TeamFlow), httpOnly cookie session, deny-by-default RBAC guard with unit tests (completed 2026-02-17)
- [x] **Phase 16: Workspaces + Membership + RBAC** - Workspace CRUD with slug routing, invite-link flow, Admin/Contributor/Viewer roles enforced at guard level, last-admin protection (completed 2026-02-17)
- [x] **Phase 17: Content Creation — Snippets + Posts** - Code snippets with Shiki syntax highlighting, Markdown posts with Tiptap write/preview editor (immediatelyRender: false validated with next build && next start) (completed 2026-02-18)
- [x] **Phase 18: Discussions + Reactions** - Threaded comments (1-level deep) on snippets and posts, emoji reactions, flat model with in-memory tree assembly (completed 2026-02-18)
- [x] **Phase 19: Notifications + Activity Feed** - @mention notifications with bell icon, unread badge, 60s poll; workspace activity feed with 30s poll and cursor pagination (completed 2026-02-18)
- [x] **Phase 20: Full-Text Search** - Postgres tsvector with trigger pattern (NOT Meilisearch), GIN index, Cmd+K modal, grouped results with ts_headline() highlighting; validated with prisma migrate dev x3 ritual
- [x] **Phase 21: Seed Data + Portfolio Integration** - Demo workspace with all three roles demonstrated, deterministic faker seed, portfolio card + case study + live demo link (completed 2026-02-18)

## Phase Details

### Phase 14: Monorepo Scaffold + Infrastructure
**Goal**: Two new Turborepo apps (devcollab-web on port 3002, devcollab-api on port 3003) run in Docker alongside TeamFlow; the deny-by-default CASL guard is installed before any feature controllers exist
**Depends on**: Phase 13 (v1.1 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts devcollab-postgres (port 5435), devcollab-api (port 3003), and devcollab-web (port 3002) with healthy status; TeamFlow containers are unaffected
  2. `GET /health` on devcollab-api returns 200; devcollab-web shows a login placeholder page at port 3002
  3. `packages/devcollab-database` Prisma client is generated with its own output path (not overwriting TeamFlow's `@prisma/client`); initial migration is applied to devcollab-postgres
  4. A dedicated `migrate` service runs `prisma migrate deploy` and exits before devcollab-api starts (no migration race condition)
  5. CI/CD pipeline builds and pushes devcollab-web and devcollab-api images to GHCR on push to main
**Plans**: 4 plans
Plans:
- [ ] 14-01-PLAN.md — packages/devcollab-database: Prisma schema, isolated client, Dockerfile.migrate
- [ ] 14-02-PLAN.md — apps/devcollab-api (NestJS 11, CASL guard, /health) + apps/devcollab-web (Next.js 15, login placeholder)
- [ ] 14-03-PLAN.md — docker-compose.yml: devcollab-postgres, devcollab-migrate, devcollab-api, devcollab-web, MinIO
- [ ] 14-04-PLAN.md — CI/CD: build-and-push-devcollab job for GHCR

### Phase 15: Authentication System
**Goal**: Users can sign up, log in, and maintain sessions in DevCollab using a completely separate JWT system from TeamFlow; deny-by-default RBAC guard is unit-tested before any feature routes exist
**Depends on**: Phase 14
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. A new user can create a DevCollab account with email and password; the account is isolated from TeamFlow (no shared user table, no shared JWT secret)
  2. A user can log in with email and password and receive an httpOnly cookie; the cookie persists the session across browser refresh
  3. A user can log out and the session cookie is cleared; subsequent requests without a cookie are rejected
  4. Any DevCollab API endpoint without a `@CheckAbility` decorator returns 403 (ForbiddenException), not 200 — verified by unit test enumeration of all controller methods
**Plans**: 5 plans
Plans:
- [ ] 15-01-PLAN.md — Prisma password migration + env vars (DEVCOLLAB_JWT_SECRET in .env and docker-compose)
- [ ] 15-02-PLAN.md — API foundation: auth deps in package.json, cookie-parser + CORS in main.ts, @CheckAbility/@CurrentUser decorators, CaslAuthGuard upgrade
- [ ] 15-03-PLAN.md — Auth feature: DatabaseModule, AuthModule, AuthService, AuthController (signup/login/logout/me), JwtStrategy, AppModule wiring
- [ ] 15-04-PLAN.md — devcollab-web: login form, signup form, logout route handler, dashboard placeholder
- [ ] 15-05-PLAN.md — TDD meta-test: Vitest setup + controller-coverage spec (deny-by-default invariant enforced in CI)

### Phase 16: Workspaces + Membership + RBAC
**Goal**: Users can create workspaces, invite members via time-limited single-use links, and have role-based permissions enforced at the API guard level — Admin, Contributor, and Viewer roles all behave correctly
**Depends on**: Phase 15
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, RBAC-01, RBAC-04
**Note**: RBAC-02 and RBAC-03 (Contributor/Viewer enforcement on snippet/post endpoints) moved to Phase 17 — those endpoints don't exist until Phase 17; CASL rules are fully implemented in WorkspaceAbilityFactory and will be exercised there.
**Success Criteria** (what must be TRUE):
  1. A logged-in user can create a workspace with a name and slug; the workspace is accessible at `/w/:slug`
  2. A workspace Admin can generate an invite link; the link expires after 72 hours and cannot be reused after the first successful join
  3. A user with an invite link can join the workspace and is assigned the Contributor role by default
  4. The last Admin in a workspace cannot be removed or demoted; the API returns an error and the member list is unchanged
**Plans**: 4 plans
Plans:
- [x] 16-01-PLAN.md — Prisma schema: Workspace, WorkspaceMember, InviteLink models + PrismaService accessors
- [x] 16-02-PLAN.md — WorkspaceAbilityFactory + async CaslAuthGuard + AppModule wiring
- [x] 16-03-PLAN.md — WorkspacesService + WorkspacesController (8 endpoints) + DTOs
- [x] 16-04-PLAN.md — Controller meta-test update + Next.js 15 workspace UI pages

### Phase 17: Content Creation — Snippets + Posts
**Goal**: Contributors can create and share code snippets with syntax highlighting and Markdown posts with a write/preview editor; both content types are readable by all workspace members; Tiptap SSR is validated against a production build
**Depends on**: Phase 16
**Requirements**: SNIP-01, SNIP-02, SNIP-03, SNIP-04, SNIP-05, POST-01, POST-02, POST-03, RBAC-02, RBAC-03
**Success Criteria** (what must be TRUE):
  1. A user can create a code snippet with a title, language selector, and code body; the snippet renders with Shiki syntax highlighting (server-side, zero client JS); a copy button copies the code to clipboard
  2. Each snippet has a shareable URL (`/w/:slug/snippets/:id`) accessible to any workspace member; the URL works when opened in a new tab (GitHub Gist-style)
  3. A user can create a Markdown post using a write/preview split-pane editor; the preview renders Shiki-highlighted code fences
  4. A user can save a post as draft (not visible to others) or publish it (visible to all workspace members); a published post can be reverted to draft
  5. `next build && next start` completes with zero React hydration errors and zero "Duplicate extension names" Tiptap warnings in the browser console — SSR validation is a hard acceptance criterion before merge
  6. A Viewer-role user receives 403 when attempting to create a snippet or post; a Contributor-role user succeeds — role enforcement is at the API level (RBAC-02/RBAC-03 exercised against real snippet/post endpoints)
**Plans**: 5 plans
Plans:
- [x] 17-01-PLAN.md — Prisma schema (Snippet + Post + PostStatus enum), migration, PrismaService getters, CASL Contributor delete ability
- [x] 17-02-PLAN.md — NestJS SnippetsModule + PostsModule (controllers, services, DTOs), AppModule wiring, meta-test update
- [x] 17-03-PLAN.md — Install npm packages + Shiki singleton + SnippetCodeBlock + CopyButton + LanguageSelector + snippet pages
- [x] 17-04-PLAN.md — PostEditor (textarea + react-markdown split pane) + MarkdownRenderer + post pages
- [x] 17-05-PLAN.md — Production build validation + RBAC smoke tests + human-verify checkpoint

### Phase 18: Discussions + Reactions
**Goal**: Workspace members can comment on snippets and posts in a threaded structure (one level of replies), edit and delete their own comments, and react to content with emoji reactions
**Depends on**: Phase 17
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. A user can post a top-level comment on any snippet or post; the comment appears immediately with the author's name and timestamp
  2. A user can reply to a top-level comment (one level deep); reply-to-reply is not possible — the UI does not offer that action
  3. A user can edit their own comment (an "edited" timestamp appears) and delete it (content becomes "[deleted]" preserving thread structure); an Admin can hard-delete any comment
  4. A user can add a reaction (thumbs up, heart, +1, laugh) to a post or comment; reaction counts update without a full page reload; a second click on the same reaction removes it
  5. The total number of Prisma queries per thread fetch stays below 5 (flat model + in-memory tree assembly — no N+1 recursive include)
**Plans**: 4 plans
Plans:
- [ ] 18-01-PLAN.md — Prisma schema: Comment + Reaction models, back-refs on User/Post/Snippet, migration, PrismaService getters
- [ ] 18-02-PLAN.md — NestJS CommentsModule + ReactionsModule (controllers, services, DTOs), AppModule wiring
- [ ] 18-03-PLAN.md — Web components: CommentForm, CommentItem, ThreadedComments, ReactionBar
- [ ] 18-04-PLAN.md — Wire components into post/snippet detail pages + human-verify checkpoint

### Phase 19: Notifications + Activity Feed
**Goal**: Users are notified when mentioned by @name in comments; the workspace activity feed shows a reverse-chronological stream of workspace events; both surfaces use polling (not WebSockets)
**Depends on**: Phase 18
**Requirements**: NOTF-01, NOTF-02, NOTF-03, FEED-01
**Success Criteria** (what must be TRUE):
  1. When a user types `@name` in a comment and saves it, the mentioned user sees a new notification; the notification count in the bell icon increments within 60 seconds (poll interval)
  2. The bell icon displays an unread badge with the correct count; clicking the bell shows the notification list with a link to the source comment
  3. A user can mark individual notifications as read or mark all as read; the unread badge updates immediately
  4. The workspace activity feed shows workspace events (member joins, content created, content updated) in reverse-chronological order, paginated with cursor pagination at 20 per page; the feed refreshes within 30 seconds without a page reload
**Plans**: 4 plans
Plans:
- [x] 19-01-PLAN.md — Prisma schema: Notification + ActivityEvent models, migration, PrismaService getters, CASL Subject union update
- [x] 19-02-PLAN.md — NestJS NotificationsModule + ActivityModule + mention hooks in CommentsService + activity logging in existing services + AppModule wiring + meta-test
- [x] 19-03-PLAN.md — Frontend: WorkspaceNav + BellIcon (60s poll) + NotificationList (mark read) + ActivityFeed (30s refresh + cursor pagination) + activity page
- [x] 19-04-PLAN.md — Human-verify checkpoint: @mention flow, bell badge, mark read, activity feed

### Phase 20: Full-Text Search
**Goal**: Workspace members can search across all posts and snippets using full-text search powered by Postgres tsvector; results are grouped and highlighted; the Cmd+K shortcut opens the search modal; GIN index migration drift is eliminated
**Depends on**: Phase 19
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. A user can type a search query in the search bar and receive results scoped to their current workspace; results include both posts and snippets; search works with partial words (prefix matching)
  2. Search results are grouped into "Posts" and "Snippets" sections; matching terms are highlighted with `ts_headline()` so the user can see why each result matched
  3. Pressing `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) opens the global search modal from any page; pressing `Escape` or clicking outside closes it
  4. Running `prisma migrate dev` three consecutive times generates zero new migration files on runs 2 and 3 — GIN index migration drift is eliminated by the trigger-based tsvector pattern
**Plans**: 3 plans
Plans:
- [x] 20-01-PLAN.md — Prisma schema (searchVector Unsupported tsvector), trigger-based migration SQL, GIN indexes, PrismaService $queryRaw delegation
- [x] 20-02-PLAN.md — NestJS SearchModule (SearchService + SearchController with @CheckAbility), AppModule wiring, meta-test update
- [x] 20-03-PLAN.md — Frontend SearchModal (Cmd+K, Escape, backdrop) + SearchResults (Posts/Snippets grouped, ts_headline mark highlighting) + WorkspaceNav injection + human-verify

### Phase 21: Seed Data + Portfolio Integration
**Goal**: The DevCollab demo workspace contains realistic content demonstrating all three roles; the portfolio site presents DevCollab with a project card, case study, and live demo link; recruiters can interact with the demo immediately on first visit
**Depends on**: Phase 20
**Requirements**: PORT-01, PORT-02, PORT-03, SEED-01, SEED-02
**Success Criteria** (what must be TRUE):
  1. On first launch (empty database), the seed script creates a demo workspace with at least 3 user accounts (one Admin, one Contributor, one Viewer), 5+ snippets in varied languages, 3+ published posts with discussions including @mentions, and an activity feed with visible history
  2. The seed is deterministic: running the seed script twice produces identical content (fixed `faker.seed()` number); no duplicate entries are created on re-run
  3. Fernando's portfolio homepage displays a DevCollab project card alongside the TeamFlow card; the card includes a live demo link that opens DevCollab in the demo workspace
  4. A DevCollab case study page exists at `/projects/devcollab` with technology choices, architecture decisions, and lessons learned documented; the case study links to the live demo and source code
**Plans**: 3 plans
Plans:
- [x] 21-01-PLAN.md — Seed script (faker.seed(42), idempotent, 3 users + 5 snippets + 3 posts + activity events) + package.json seed script + docker-compose devcollab-seed service
- [x] 21-02-PLAN.md — Portfolio pages (DevCollab case study at /projects/devcollab, homepage card, projects listing card, login demo hints)
- [x] 21-03-PLAN.md — Seed verification against live devcollab-postgres + human-verify checkpoint for full recruiter flow

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
| 14. Monorepo Scaffold + Infrastructure | v2.0 | Complete    | 2026-02-17 | - |
| 15. Authentication System | v2.0 | Complete    | 2026-02-17 | - |
| 16. Workspaces + Membership + RBAC | v2.0 | 4/4 | Complete | 2026-02-17 |
| 17. Content Creation — Snippets + Posts | v2.0 | Complete    | 2026-02-18 | 2026-02-18 |
| 18. Discussions + Reactions | 4/4 | Complete    | 2026-02-18 | - |
| 19. Notifications + Activity Feed | v2.0 | Complete    | 2026-02-18 | 2026-02-18 |
| 20. Full-Text Search | 2/3 | Complete    | 2026-02-18 | - |
| 21. Seed Data + Portfolio Integration | v2.0 | Complete    | 2026-02-18 | 2026-02-18 |
