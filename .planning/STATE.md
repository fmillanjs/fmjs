# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** v2.0 DevCollab — Phase 19 IN PROGRESS (1 of 4 plans) — Notifications + Activity Feed

## Current Position

Phase: 19 of 21 (Notifications + Activity Feed)
Plan: 1 of 4 in Phase 19 — COMPLETE (2026-02-18)
Status: Phase 19 Plan 01 complete — Notification + ActivityEvent Prisma models, migration applied to devcollab-postgres, PrismaService getters, CASL Subject union extended
Last activity: 2026-02-18 — Phase 19 Plan 01 complete: schema + migration + PrismaService + CASL foundation (afc764a)

Progress: [█████░░░░░░░░░░░░░░░] ~32% (v2.0 phase 14-21, 14 plans complete across 19-01 plans)

Previous milestones: v1.1 COMPLETE (16/16 requirements) | v1.0: complete

## Performance Metrics

**Velocity (v1.0 + v1.1 combined):**
- Total plans completed: 46
- Average duration: 9.3 min/plan
- Total execution time: ~7.1 hours

**By Phase (historical):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 11 | 62 min | 5.6 min |
| 06.1-user-flow-architecture-audit | 6 | 158 min | 26.3 min |
| 12-critical-route-migration | 9 | 37 min | 4.1 min |
| 13-automation-optimization | 3 | 39 min | 13.0 min |
| 14-monorepo-scaffold-infrastructure | 4 | 4 min | 1.0 min |
| 15-authentication-system | 5 (of 5) | 13 min | 2.6 min |
| 16-workspaces-membership-rbac | 4 (of 4) | ~15 min | 3.8 min |

**Recent Trend:**
- Last 5 plans: 16-P04 (~10m), 16-P02 (1m), 16-P01 (2m), 15-P05 (1m), 15-P04 (2m)
- Trend: Stable — infrastructure plans run fast with complete plan specs

*Updated after each plan completion*
| Phase 17 P02 | 2 | 2 tasks | 12 files |
| Phase 17 P03 | 2 | 2 tasks | 11 files |
| Phase 17 P04 | 2 | 2 tasks | 6 files |
| Phase 17 P05 | 6 | 2 tasks | 4 files |
| Phase 18-discussions-reactions P02 | 4 | 2 tasks | 10 files |
| Phase 18-discussions-reactions P03 | 2 | 2 tasks | 4 files |
| Phase 18-discussions-reactions P04 | ~30 | 2 tasks | 4 files |
| Phase 19 P01 | 2 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions for v2.0:

- DevCollab uses completely separate JWT secret (DEVCOLLAB_JWT_SECRET) — no sharing with TeamFlow
- Deny-by-default CASL guard must be installed in Phase 14 before any feature controllers
- Postgres tsvector (NOT Meilisearch) for full-text search — adequate at portfolio scale, no extra Docker service
- Tiptap v3 with immediatelyRender: false — validated with next build && next start before merge
- MinIO for dev file storage, Cloudflare R2 for production — same AWS SDK v3 code path
- devcollab-web on port 3002, devcollab-api on port 3003 — avoids conflict with TeamFlow API on 3001
- Single dedicated migrate Docker service — prevents migration race condition (Pitfall 5)
- tsvector trigger pattern — eliminates GIN index migration drift (Pitfall 2)
- Prisma output set to node_modules/.prisma/devcollab-client — isolates DevCollab client from TeamFlow's @prisma/client (14-01)
- Import in client.ts uses '.prisma/devcollab-client' not '@prisma/client' — critical isolation boundary (14-01)
- globalThis key named devcollabPrisma to avoid collision with TeamFlow's singleton pattern (14-01)
- Package names devcollab-api and devcollab-web (not scoped) so turbo prune filter matches exactly (14-02)
- CaslAuthGuard installed as APP_GUARD before any feature controllers — deny-by-default security invariant active (14-02)
- Auth deferred to Phase 15 — devcollab-web/app/page.tsx is a placeholder only (14-02)
- devcollab-migrate has no restart policy — exits cleanly after prisma migrate deploy to satisfy service_completed_successfully (14-03)
- devcollab-network isolates all DevCollab services; TeamFlow services remain on teamflow-network only (14-03)
- MinIO --console-address ":9001" flag required — without it console binds to a random port (14-03)
- Default env var values (:-devcollab, :-minioadmin) allow docker compose up without .env for local dev (14-03)
- [Phase 14]: build-and-push-devcollab uses needs: [test] only — DevCollab images build independently from Lighthouse CI check
- [Phase 14]: Both devcollab images built in same CI job as sequential steps — saves CI minutes by sharing checkout, buildx setup, and GHCR login (14-04)
- [Phase 15]: prisma migrate diff --from-empty generates migration SQL without database connection — used when devcollab-postgres not running locally (15-01)
- [Phase 15]: import cookieParser from 'cookie-parser' (default import with esModuleInterop:true) — import * as causes TS2349 no call signatures error (15-03 corrects 15-02 decision)
- [Phase 15]: CORS origin uses DEVCOLLAB_WEB_URL env var with localhost:3002 fallback; credentials:true required for httpOnly cookie cross-origin (15-02)
- [Phase 15]: CaslAuthGuard injects JwtService — DI wiring completes in Plan 03 when AppModule registers global JwtModule (15-02)
- [Phase 15]: CHECK_ABILITY_KEY = 'check_ability' string literal is the Reflector metadata key for @CheckAbility decorator (15-02)
- [Phase 15]: JwtModule.registerAsync global: true in AppModule makes JwtService available to CaslAuthGuard APP_GUARD — without global: true, DI throws at startup (15-03)
- [Phase 15]: PrismaService exposes get user() accessor only — AuthService cannot access other models, enabling precise testability via mock (15-03)
- [Phase 15]: SafeUser interface must be exported from auth.service.ts — TypeScript strict TS4053 requires named return types to be exportable (15-03)
- [Phase 15]: Prisma client must be regenerated after schema changes — node_modules/.prisma/devcollab-client stale after Plan 01 password field addition (15-03)
- [Phase 15]: (auth) route group keeps /login and /signup URLs clean without 'auth' prefix in the path (15-04)
- [Phase 15]: GET handler for /api/logout allows <a href> logout without JavaScript — sufficient for this phase (15-04)
- [Phase 15]: NEXT_PUBLIC_API_URL env var with localhost:3003 fallback used in all frontend API calls (15-04)
- [Phase 15]: Reflect.getMetadata('path', handler) used to filter NestJS route handlers in invariant meta-test — private helpers excluded; reflect-metadata must be first import
- [Phase 16]: WorkspaceMember @@unique([userId, workspaceId]) generates named Prisma accessor userId_workspaceId for findUnique queries (16-01)
- [Phase 16]: prisma migrate diff --from-empty offline SQL requires manual extraction of workspace-only DDL — User table already covered by prior migration (16-01)
- [Phase 16]: PrismaService one-accessor-per-model pattern extended to workspace, workspaceMember, inviteLink (16-01)
- [Phase 16]: CaslAuthGuard workspace-scoped check: extract :slug from request.params, only build CASL ability when slug present — workspace-agnostic routes bypass to service layer
- [Phase 16]: Contributor unconditional update on Post/Snippet/Comment (no authorId condition) — own-content-only constraint deferred to Phase 17 when authorId exists on Prisma models
- [Phase 16]: WorkspacesModule exported as skeleton before controller added — Plan 03 adds WorkspacesController without module restructuring (16-02)
- [Phase 16]: POST /workspaces/join declared before GET /workspaces/:slug — NestJS resolves routes top-to-bottom, static path segments must precede dynamic (16-03)
- [Phase 16]: DTO properties use ! definite assignment assertion (name!, token!, role!) — matches project strict TS pattern from auth DTOs (16-03)
- [Phase 16]: JwtPayload imported from current-user.decorator.ts in WorkspacesController — avoids local redefinition, single source of truth (16-03)
- [Phase 16]: WorkspacesController added to ALL_CONTROLLERS in meta-test — 13 invariant tests pass including all 8 controller methods
- [Phase 16]: Dashboard converted to client component; join page uses Suspense around useSearchParams; Next.js 15 async params awaited throughout
- [Phase 16]: webpack.config.js added to devcollab-api (bcrypt external, dist/main.js at root) — required for NestJS Docker image to build and start correctly (16-04)
- [Phase 16]: Workspace migration renamed to run after User table migration — FK constraint on WorkspaceMember.userId was failing on devcollab-migrate startup (16-04)
- [Phase 17]: Migration applied via prisma migrate deploy locally against devcollab-postgres on port 5435 — no need to start devcollab-api or devcollab-migrate containers for schema-only task (17-01)
- [Phase 17]: Migration SQL generated with prisma migrate diff --from-url (live DB diff) — exact DDL, no drift (17-01)
- [Phase 17]: Owner-only (authorId) enforcement deferred to service layer — CASL guard grants delete to Contributor unconditionally; service throws ForbiddenException if requester is not author (17-01)
- [Phase 17]: SnippetsController routes use @Controller('workspaces/:slug/snippets') — workspace-scoped URL pattern consistent with WorkspacesController (17-02)
- [Phase 17]: PostsService setStatus sets publishedAt to new Date() when transitioning to Published, null when reverting to Draft (17-02)
- [Phase 17]: PostsController PATCH :id/status declared after PATCH :id — NestJS resolves specific paths before dynamic when using distinct segments (17-02)
- [Phase 17]: Meta-test expanded from 3 to 5 controllers; test count grows from 13 to 24 as each handler is checked individually (17-02)
- [Phase 17]: getHighlighter exported from lib/shiki.ts so plan 17-04 rehype plugin can call codeToHtml directly with custom options
- [Phase 17]: Shiki singleton pattern: module-level promise lazy-initialized, reused across all requests — createHighlighter called once per process
- [Phase 17]: LanguageSelector imports SNIPPET_LANGUAGES from lib/shiki.ts — single source of truth for the 20-language list
- [Phase 17]: MarkdownRenderer is a Server Component (no 'use client') — async rehype plugin calls lib/shiki.ts getHighlighter() server-side for zero client JS code highlighting on published post views (17-04)
- [Phase 17]: PostEditor uses react-syntax-highlighter (client) for live preview — intentional; hard Shiki criterion only applies to MarkdownRenderer on published post detail page (17-04)
- [Phase 17]: New post creation uses two API calls: POST creates Draft, then PATCH /status to Published if Publish button clicked (17-04)
- [Phase 17]: [Phase 17 P05]: next build run locally (not via Docker) — faster, identical output; dist written to apps/devcollab-web/.next
- [Phase 17]: [Phase 17 P05]: RBAC smoke test confirms default join role is Contributor — Viewer=403, Contributor=201 on snippet creation
- [Phase 17]: [Phase 17 P05]: Next.js App Router server components must use next/headers cookies() for SSR auth cookie forwarding — credentials:'include' is browser-only and silently drops the cookie on server-side fetch (382b0c8)
- [Phase 17]: [Phase 17 P05]: MarkdownRenderer must use unified+hast-util-to-html pipeline not react-markdown+async rehype plugin — react-markdown does not await async plugin transforms, causing Shiki output to be lost (382b0c8)
- [Phase 18]: Comment self-relation uses onDelete: NoAction, onUpdate: NoAction on parentId FK — prevents cascade-delete of replies when parent soft-deleted (18-01)
- [Phase 18]: Reaction uses two separate nullable FKs (postId, commentId) not polymorphic targetType/targetId — preserves real FK referential integrity (18-01)
- [Phase 18]: prisma migrate diff --from-url + prisma migrate deploy pattern for non-interactive migration generation — consistent with Phase 17 approach (18-01)
- [Phase 18]: CommentsService.update is owner-only unconditionally — Admin role does NOT bypass ForbiddenException on comment edit
- [Phase 18]: In-memory comment tree: flat Prisma findMany + Map loop assembly (max 2 DB queries); no recursive Prisma include
- [Phase 18]: ReactionsService toggleReaction: findUnique first, delete if exists or create with P2002 catch for race condition idempotency
- [Phase 18]: Import path from CommentItem to ReactionBar is ../reaction/ReactionBar (one level up from discussion/) — plan had incorrect ../../reaction/ReactionBar
- [Phase 18]: CommentNode interface exported from ThreadedComments.tsx — canonical export for Plan 04 detail pages
- [Phase 18]: PostsService.findOne includes reactions (id, emoji, userId) — enables SSR to pass initialReactions to ReactionBar without extra client fetch (18-04)
- [Phase 18]: CommentsService.create parent comment lookup uses OR: [{ post: { workspaceId } }, { snippet: { workspaceId } }] — plain post: { workspaceId } silently failed for snippet comments (18-04 bug fix)
- [Phase 19]: prisma migrate diff --from-url + direct psql apply + prisma migrate resolve --applied for non-interactive migration on live devcollab-postgres (19-01)
- [Phase 19]: entityType on ActivityEvent is String not enum — stores Post/Snippet/User as plain string for future entity type flexibility (19-01)
- [Phase 19]: CASL Subject union extended with Reaction and User (were missing before) + Notification and ActivityEvent — Contributor granted read/update Notification and read ActivityEvent (19-01)

### Pending Todos

None.

### Blockers/Concerns

**Phase 17 (Tiptap) — Research flag:**
- Tiptap v3 + Next.js 15 App Router SSR is highest-risk area. Run 1-day spike: isolated component, production build, confirm no hydration errors before full implementation.
- Resolve Tiptap content storage format (JSON vs sanitized HTML) before writing schema migrations.

**Phase 20 (Search) — Validation ritual:**
- Run `prisma migrate dev` three consecutive times after adding tsvector columns. Runs 2 and 3 must generate zero migration files. Do not proceed past Phase 20 without this check passing.

**Phase 21 (Deployment) — Research flag:**
- Coolify per-service webhook trigger behavior for a second app is not fully documented. Plan for hands-on iteration when configuring deployment pipeline.
- Lock every credential in Coolify UI immediately on first deploy. Verify deployment log shows REDACTED before sharing demo URL.

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 19-01-PLAN.md — Notification + ActivityEvent schema, migration applied to devcollab-postgres, PrismaService getters, CASL Subject union extended (afc764a)
Resume file: None
Next action: Execute Phase 19 Plan 02 (NestJS notification + activity-feed services)
