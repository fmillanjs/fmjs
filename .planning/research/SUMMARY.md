# Project Research Summary

**Project:** DevCollab v2.0 — Developer Collaboration Platform
**Domain:** GitHub/Discord hybrid — workspace-based code sharing, markdown posts, threaded discussions, real-time notifications
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

DevCollab is a portfolio second app being added to an existing Next.js 15 + NestJS 11 + Turborepo monorepo. The platform is a GitHub Gist / Discord hybrid: workspace-organized code snippet sharing with syntax highlighting, markdown posts, threaded discussions, @mention notifications, file uploads, and full-text search. Experts build platforms of this type with strict separation between apps at the database and auth layer while reusing shared infrastructure (Redis, TypeScript configs, Zod schemas). The recommended approach is two new Turborepo apps (`apps/devcollab-web` on port 3002 and `apps/devcollab-api` on port 3003) backed by a separate Postgres instance, a separate Prisma package (`packages/devcollab-database`), and a completely separate JWT auth system — all connected to the existing shared Redis container and deployed alongside TeamFlow on Coolify.

The stack is well-established. Tiptap v3 handles the rich text editor with `immediatelyRender: false` required to prevent SSR crashes in Next.js App Router. Shiki v3 handles server-side syntax highlighting (zero client JS, VS Code quality). AWS SDK v3 handles file storage against MinIO in dev and Cloudflare R2 in production using a single code path (only the endpoint env var changes). Full-text search uses Postgres tsvector. This last point resolves a conflict between research files: STACK.md recommended Meilisearch for its typo tolerance and instant results, while FEATURES.md and ARCHITECTURE.md independently concluded Postgres tsvector is the correct choice at portfolio scale. The decisive factors are that tsvector handles thousands of records with sub-100ms queries via a GIN index, adding Meilisearch requires an extra Docker service and write-time index sync with no recruiter-visible benefit, and Prisma's `fullTextSearchPostgres` preview feature is still not GA for Postgres — making raw SQL necessary regardless of search backend. Meilisearch remains documented as a v2+ upgrade path.

The four critical risks are: (1) Tiptap SSR hydration crash if `immediatelyRender: false` is omitted — the editor renders blank in production while appearing to work in dev; (2) Prisma GIN index migration drift that silently drops and recreates the tsvector index on every `prisma migrate dev` run; (3) the existing CASL guard's allow-by-default behavior when `@CheckAbility` is missing on a new endpoint — any new controller without the decorator is accessible to all authenticated users; and (4) Coolify secret leakage in deployment logs for env vars that are not manually locked in the Coolify UI. All four have known preventions that must be applied at specific phases.

---

## Key Findings

### Recommended Stack

DevCollab reuses the full TeamFlow stack (Next.js 15, NestJS 11, Prisma, PostgreSQL, Socket.IO, CASL, Zod, Vitest, Playwright, shadcn/ui, Tailwind v4) and adds four new library groups, scoped exclusively to the new `apps/devcollab-web` and `apps/devcollab-api`. Nothing installs into the existing TeamFlow apps.

**Core additions (new for DevCollab only):**
- **Tiptap v3** (`@tiptap/react ^3.19.0`, `@tiptap/pm`, `@tiptap/starter-kit`): Rich text editor for posts and discussion comments. Version 3.19+ is React 19 compatible. Must use `immediatelyRender: false` and `'use client'` on every component containing `useEditor`. Do not use `@tiptap-pro` extensions — `tippyjs-react` has React 19 incompatibility. All Tiptap packages must stay on matching versions.
- **Shiki v3** (`shiki ^3.22.0`, `react-markdown ^10.1.0`, `rehype-pretty-code ^0.14.x`): Server-side syntax highlighting via `codeToHtml()` in React Server Components. Ships zero JavaScript to the client. Use `github-dark` / `github-light` theme pair. Do not use `react-syntax-highlighter` — ships 400KB+ to the client with no RSC support.
- **AWS SDK v3** (`@aws-sdk/client-s3 ^3.991.0`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/lib-storage`, `multer-s3 ^3.0.1`): S3-compatible client for both MinIO (dev) and Cloudflare R2 (production). `forcePathStyle: true` required for MinIO. Use presigned PUT URLs — browser uploads directly to storage, bypassing NestJS API. `multer-s3` must be v3.x (AWS SDK v3 compatible).
- **Postgres tsvector** (no additional library): Full-text search via PostgreSQL triggers that maintain a `tsvector` column on `Post` and `Snippet`. GIN index applied via raw migration SQL. All search queries use parameterized `$queryRaw`. Meilisearch is deferred.

**Resolved search conflict — Meilisearch vs Postgres tsvector:**
STACK.md recommended Meilisearch. FEATURES.md and ARCHITECTURE.md independently recommended Postgres tsvector. The recommendation is tsvector because: portfolio data volume (thousands of records) is well within tsvector performance range with a GIN index; Meilisearch adds a Docker service, index sync on every write, and a NestJS module with no recruiter-visible benefit; and Prisma's native FTS preview feature requires raw SQL regardless. Meilisearch is noted as a valid growth-stage upgrade.

**File storage confirmed — MinIO dev, Cloudflare R2 production:**
Both STACK.md and ARCHITECTURE.md agree on this pattern. Same AWS SDK v3 code, only endpoint env var changes. R2 has zero egress fees vs S3's per-GB download cost. MinIO is S3-compatible and purpose-built for local dev parity.

### Expected Features

**Must have (P1 — launch blockers):**
- Own auth system (JWT + bcrypt in NestJS, no NextAuth) — shows Fernando can build auth from scratch with different requirements than TeamFlow
- Workspace creation + invite-based membership with time-limited single-use tokens (72h expiry)
- RBAC: Admin / Contributor / Viewer enforced at NestJS guard level, not frontend — last-admin protection required
- Code snippet posts: language selector, Shiki highlighting, copy button (absence noticed by all recruiters)
- Markdown posts: write/preview split-pane (GitHub PR editor model), Shiki code fences, publish/draft flow
- Threaded discussions: 1-level nesting max (top-level comment + reply to comment; no reply-to-reply)
- Activity feed: reverse-chronological, 20 per page with cursor pagination, 30s client poll
- In-app mention notifications: bell icon with unread badge, mark-as-read, 60s client poll
- Workspace-scoped full-text search: Postgres tsvector, posts + snippets, grouped results with match highlighting
- File uploads: presigned PUT to Cloudflare R2, images + PDF, 10MB limit, progress bar, magic-byte MIME validation
- Seed data: demo workspace with realistic content (fixed `faker.seed()` number for determinism)

**Should have (P2 — polish after P1 works end-to-end):**
- Reactions on posts/comments (thumbs up, heart, +1, laugh — count only)
- Snippet embed/share URL (`/w/:slug/snippets/:id`) — GitHub Gist-style shareable link
- `Cmd+K` search modal with grouped results
- Language auto-detection fallback (default to `plaintext` for MVP)

**Defer to v2+ (do not build, mention in case study):**
- Content version history + diff view — HIGH complexity, HIGH engineering signal, genuinely impressive if built
- Email notification delivery — requires SMTP, deliverability, unsubscribe flows
- Real-time activity feed via WebSocket — 30s polling is appropriate for a content platform
- Workspace public/private discovery toggle — security boundary complexity
- WYSIWYG TipTap collaboration with CRDT — developers prefer split-pane markdown

**Feature dependency order (gates):**
Auth → Workspace/Membership → RBAC → Content (snippets/posts) → Threads/Activity → Search/Notifications → Files → Polish/Seed/Deploy

### Architecture Approach

DevCollab is architecturally isolated from TeamFlow at database, auth, and Prisma client layers while sharing the Docker network, Redis instance, TypeScript configs, and `@repo/shared` type package (extended with DevCollab sub-exports to avoid namespace collisions). Two new Turborepo apps are added. A new `packages/devcollab-database` Prisma package is created with its own `schema.prisma`, its own custom `output` path in the generator block (to avoid overwriting TeamFlow's `@prisma/client`), and its own migration history. A new `devcollab-postgres` container on port 5435 is added to `docker-compose.dev.yml`.

**Major components:**
1. `apps/devcollab-web` (port 3002) — Next.js 15 frontend, custom JWT auth (no NextAuth), shadcn/ui, Tiptap editor client components, Shiki RSC rendering, typed fetch wrapper to devcollab-api
2. `apps/devcollab-api` (port 3003) — NestJS 11 backend, all business logic, deny-by-default CASL RBAC guard, Socket.IO gateway on shared Redis, 10 feature modules
3. `packages/devcollab-database` — Separate Prisma package; own `schema.prisma` with `Unsupported("tsvector")` columns; custom generated client output; GIN indexes via raw migration SQL; `devcollab-postgres` DB
4. `devcollab-postgres` (port 5435) — New Docker container, completely isolated from TeamFlow's Postgres
5. `devcollab-minio` (ports 9000/9001) — New Docker container for dev-only S3-compatible storage; production uses Cloudflare R2

**Key patterns:**
- Global `JwtAuthGuard` + deny-by-default `RbacGuard` at `AppModule` level — every route protected by default; missing `@CheckAbility` throws `ForbiddenException`
- Single dedicated `migrate` Docker service runs `prisma migrate deploy`; both API containers `depends_on: [migrate]` — prevents migration race condition
- Prisma `$queryRaw` for all tsvector search queries — `findMany` does not route through the GIN index
- Presigned URL flow for files — browser uploads directly to MinIO/R2, API stores only the S3 key
- All DevCollab modules import `@repo/devcollab-database`, never `@repo/database`
- Internal package dependencies use `"*"` not `"workspace:*"` — npm workspaces syntax required for Turborepo dependency edge detection
- DevCollab apps on ports 3002/3003 (Architecture doc shows 3002/3003; STACK.md shows 3001/4001 — use 3002/3003 to avoid conflict with existing TeamFlow API on 3001)

### Critical Pitfalls

1. **Tiptap SSR hydration crash** — `useEditor` without `immediatelyRender: false` causes React hydration mismatch; editor renders blank in production (SSR is more aggressive than `next dev` with Turbopack). Prevention: `immediatelyRender: false` + `'use client'` on every Tiptap component file. Validate with `next build && next start` before merging any editor feature. Playwright e2e tests may pass while Lighthouse sees blank content.

2. **Prisma GIN index migration drift** — Prisma's diff logic does not compare raw operator classes in GIN index definitions correctly. Every `prisma migrate dev` run generates a migration dropping and recreating the GIN index even when nothing changed. Prevention: trigger-based pattern — `Unsupported("tsvector")` nullable column + PostgreSQL `BEFORE INSERT OR UPDATE` trigger + GIN index created manually in migration SQL (`CREATE INDEX IF NOT EXISTS ... USING GIN`). Validation ritual: run `prisma migrate dev` three consecutive times; runs 2 and 3 must generate zero migration files.

3. **CASL guard allows access when decorator is missing** — The existing `apps/api` `RbacGuard` (line 24) reads `if (!requirement) { return true; }`. Any new DevCollab controller added without `@CheckAbility` silently grants access to all authenticated users. Prevention: DevCollab's own `RbacGuard` throws `ForbiddenException` when no decorator is present. This guard must be written before any feature controllers exist. Add a unit test enumerating all controller methods asserting each has `@CheckAbility` or `@Public`.

4. **Coolify secret leakage in deployment logs** — Confirmed open Coolify bugs (#7019, #7235): all env var values appear in plain text in deployment logs unless manually locked. With both apps on the same server, a recruiter with view access sees DB credentials and JWT secrets for both apps. Prevention: immediately lock every sensitive variable (DB credentials, S3 secrets, JWT secrets) via Coolify's lock icon. Verify by triggering a deployment and confirming logs show `<REDACTED>` before sharing any public demo link.

5. **Prisma migration race condition** — If both `devcollab-api` and any other container run `prisma migrate deploy` on startup against the same database, they race on the `_prisma_migrations` lock table. Prevention: single dedicated `migrate` service in docker-compose that runs `prisma migrate deploy` then exits; app containers use `depends_on: [migrate]`.

---

## Implications for Roadmap

Based on dependency analysis across all four research files, the recommended structure is 8 phases. Auth and infrastructure must come first because every other feature requires them. Content creation comes before discussions and search because both require content to exist. Deployment comes last because it requires stable images and seed data from all prior phases.

### Phase 1: Monorepo Scaffold + Infrastructure
**Rationale:** Creates the foundation all other phases build on. Turbo build order, Docker network, and migration runner must be validated before any business logic is written. The deny-by-default CASL guard must be established before any controllers exist — impossible to retrofit safely later.
**Delivers:** Running `devcollab-web` (login placeholder) and `devcollab-api` (health endpoint on port 3003) in Docker; `packages/devcollab-database` with initial migration applied; Turbo `--dry-run` shows correct dependency order; `devcollab-postgres` and `devcollab-minio` containers healthy; single `migrate` service pattern in place.
**Addresses:** Separate Postgres DB, shared Redis, Docker compose integration, Turborepo multi-app setup.
**Avoids:** Pitfall 5 (Turbo cache stale — verify with `--dry-run` before any feature work), Pitfall 6 (migration race — dedicated migrate service), Pitfall 11 (Turbo build order — `"*"` not `"workspace:*"` in package.json deps).
**Research flag:** Standard Turborepo + Docker patterns. No deeper research needed. Verify port assignments (3002/3003) don't conflict with existing services.

### Phase 2: Auth System (DevCollab-Specific JWT)
**Rationale:** Auth is the hard dependency gate for every authenticated feature. Deliberately separate from TeamFlow's NextAuth — raw NestJS passport-jwt + bcrypt — demonstrating Fernando can build auth from scratch with different requirements. The deny-by-default RBAC guard is finalized here with unit tests before any feature routes exist.
**Delivers:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, httpOnly cookie token storage in devcollab-web, user profile endpoint, `DEVCOLLAB_JWT_SECRET` isolated from TeamFlow, deny-by-default `RbacGuard` with unit test coverage.
**Addresses:** Own auth system (P1), RBAC guard infrastructure.
**Avoids:** Pitfall 4 (CASL guard bypass — deny-by-default guard installed and tested before any feature routes).
**Research flag:** Standard NestJS passport-jwt patterns. No deeper research needed.

### Phase 3: Workspaces + Membership + RBAC
**Rationale:** Workspace and membership are the second dependency gate — no content can be scoped without them. RBAC roles must be enforced and tested before content creation to prevent privilege escalation.
**Delivers:** Workspace CRUD, slug-based routing, invite token flow (generate/accept/expire/single-use), `WorkspaceMember` model with Admin/Contributor/Viewer, RBAC enforcement on all workspace endpoints, workspace member list UI, last-admin protection (cannot remove or demote last admin).
**Addresses:** Workspace creation, invite-based membership, RBAC (all P1 features).
**Avoids:** Pitfall 4 (validate Viewer-role user receives 403 on Contributor-only actions, not 200).
**Research flag:** Standard CASL + NestJS patterns. Can mirror existing TeamFlow `apps/api` RBAC structure directly.

### Phase 4: Content Creation — Snippets + Markdown Posts
**Rationale:** Core value proposition. Tiptap editor is introduced here — highest-risk technical area. Shiki RSC rendering is also introduced. Both must be validated against production SSR before shipping.
**Delivers:** Snippet CRUD (title, language selector, code body, Shiki-highlighted display, copy button), Markdown post CRUD (write/preview split-pane, Shiki code fences, publish/draft flow with `updated_at`), activity events emitted for content creation.
**Addresses:** Code snippets, Markdown posts, copy button, activity feed event data (all P1).
**Avoids:** Pitfall 1 (Tiptap SSR — validate `immediatelyRender: false` with `next build && next start` before merging any Tiptap component), Pitfall 2 (StarterKit extension conflicts — zero "Duplicate extension names" warnings in console is an acceptance criterion).
**Research flag:** Tiptap v3 + Next.js 15 App Router SSR integration is the highest-risk technical area. Recommend a 1-day spike — create an isolated `EditorContent` component with `immediatelyRender: false`, build and start production Next.js, confirm no hydration errors before full feature implementation. Also resolve the Tiptap content storage format decision (Tiptap JSON vs sanitized HTML) before writing schema migrations.

### Phase 5: Threaded Discussions
**Rationale:** Discussions require snippets and posts to exist as attachment points. The N+1 query pitfall must be addressed from day one with the flat-model pattern — retrofitting is painful once the naive recursive include is shipped.
**Delivers:** Thread per snippet/post, top-level comments, 1-level replies (no reply-to-reply), author display, edit (with "edited" timestamp), delete with "[deleted]" content preservation, Admin moderation (hard delete), optimistic UI with rollback on failure.
**Addresses:** Threaded discussions (P1).
**Avoids:** Pitfall 8 (N+1 recursive queries — flat model with in-memory tree assembly; Prisma query count per thread fetch must be under 5 as an acceptance criterion), Pitfall 12 (optimistic update reordering — sort by `createdAt` including temp entries with `id: 'temp-${Date.now()}'`).
**Research flag:** Flat threaded comment model with Prisma is well-documented. No additional research needed.

### Phase 6: Full-Text Search
**Rationale:** Search requires content to exist and be indexed. The tsvector trigger is applied as a standalone migration after content tables are stable. Isolated as its own phase because GIN index migration drift is a discrete risk requiring its own validation ritual before any other work continues.
**Delivers:** `Unsupported("tsvector")` columns on `Post` and `Snippet`, PostgreSQL trigger maintaining vectors on insert/update, GIN index in raw migration SQL, `SearchService` with parameterized `$queryRaw`, workspace-scoped search API, search UI with grouped results (Posts / Snippets) and `ts_headline()` match highlighting, `Cmd+K` shortcut (P2 — can be in this phase or next).
**Addresses:** Basic full-text search (P1), search UX polish (P2).
**Avoids:** Pitfall 3 (GIN index migration drift — validation ritual: run `prisma migrate dev` three consecutive times; runs 2 and 3 must generate no migration files; use `plainto_tsquery()` not `to_tsquery()` to handle arbitrary user input safely).
**Research flag:** tsvector + Prisma trigger pattern is fully specified in ARCHITECTURE.md with complete SQL. No additional research needed. Use `plainto_tsquery()` for safe user input handling.

### Phase 7: Notifications + Activity Feed + File Uploads
**Rationale:** These three features are grouped because they all depend on content existing and all operate as secondary interaction surfaces. Mentions reference discussion comments. Activity events reference content. File uploads enhance posts. Grouping them avoids partial-feature states where the notification bell exists but has nothing to notify about.
**Delivers:** Mention detection in Tiptap editor (debounced 300ms `items` callback to member search API), Notification model with `@@unique([recipientId, entityId, type])` preventing duplicates, EventEmitter fan-out for notification creation (async after response), bell icon with unread badge (60s poll), mark-read endpoints, activity feed (30s poll, 20 per page cursor pagination), presigned URL file upload flow (MinIO dev / R2 prod), upload progress bar via XHR `onprogress`, `file-type` magic-byte validation, `@Catch(MulterError)` filter returning 413 (not 500) on size exceeded.
**Addresses:** Mention notifications, read/unread state, activity feed, file uploads (all P1).
**Avoids:** Pitfall 7 (MIME spoofing — `file-type` magic bytes + `@Catch(MulterError)` for 413; R2 CORS must explicitly list `content-type`, not wildcard), Pitfall 9 (mention thundering herd and duplicates — EventEmitter fan-out + unique constraint + 300ms debounce + membership validation before creating notifications).
**Research flag:** Cloudflare R2 CORS configuration for browser direct upload with presigned PUT URLs needs hands-on verification. The R2 wildcard header limitation is confirmed, but the exact CORS configuration that works reliably from a Next.js frontend is not fully documented. Verify with a real browser upload test before shipping.

### Phase 8: Seed Data + Polish + CI/CD + Coolify Deployment
**Rationale:** Everything must work end-to-end before deploying. Seed data must be deterministic (fixed `faker.seed()`) for a consistent recruiter demo. Coolify secret locking must happen immediately on first deploy — before any public link is shared.
**Delivers:** Realistic seed data (demo workspace, 3 users with all three roles demonstrated, 5+ snippets in varied languages, 3+ posts with discussions including @mentions, activity feed populated), Reactions P2, Snippet embed URLs P2, `devcollab-web` and `devcollab-api` Dockerfiles, GHCR image builds in `deploy.yml`, Coolify services configured with all credentials locked, deployed and accessible at a public URL, Playwright E2E tests for critical recruiter paths, Portfolio integration (screenshot + live demo link in `apps/web`).
**Addresses:** Seed data requirement, P2 polish features, production deployment.
**Avoids:** Pitfall 10 (Coolify secret leakage — lock every credential immediately; verify deployment log shows `<REDACTED>` before sharing demo URL; keep TeamFlow and DevCollab in separate Coolify Projects for log isolation).
**Research flag:** Deploying a second application alongside an existing one in Coolify using separate GHCR images requires hands-on verification. Webhook trigger behavior for per-service deploys (not both apps simultaneously) is not fully documented. Plan for iteration on the Coolify configuration.

### Phase Ordering Rationale

- Auth before content: Every content endpoint requires JWT validation and workspace membership. No workaround.
- Workspace before RBAC before content: RBAC rules reference workspace membership. Content is scoped to workspaces. Both must exist first.
- Content before discussions: Discussions use foreign keys to snippets and posts. The models must exist before the relations can reference them.
- Content before search: The tsvector trigger only fires on insert/update. Existing content must be seeded before search has anything to index.
- Discussions before notifications: Mention notifications are created when discussion comments are saved. The notification fan-out references comment IDs.
- All features before seed data: The seed script exercises the full feature surface. Incomplete features produce broken or misleading seed data.
- Seed data before deployment: The Coolify deployment should serve a demo-ready product with realistic content on first launch.

### Research Flags

Phases needing careful validation or additional research during execution:

- **Phase 4 (Tiptap/Content):** Tiptap v3 + Next.js 15 App Router SSR is the highest-risk technical area. Validate SSR behavior with a 1-day spike (isolated component, production build) before committing to full implementation. Also resolve Tiptap content storage format (JSON vs HTML) before schema migrations.
- **Phase 7 (File Uploads/R2 CORS):** Cloudflare R2 direct browser upload CORS configuration needs a real browser upload test before shipping. The `content-type` explicit header requirement is confirmed but exact working configuration may require iteration.
- **Phase 8 (Coolify multi-service deployment):** Second-service webhook trigger behavior in Coolify is not fully documented. Plan for hands-on iteration when configuring the deployment pipeline.

Phases with standard patterns (no additional research needed):

- **Phase 1 (Scaffold):** Turborepo multi-app + Docker compose patterns are thoroughly documented and mirror the existing project structure.
- **Phase 2 (Auth):** NestJS passport-jwt is a solved problem with official documentation and abundant examples.
- **Phase 3 (Workspace/RBAC):** CASL + NestJS mirrors the existing TeamFlow `apps/api` implementation directly.
- **Phase 5 (Discussions):** Flat threaded comment model with Prisma is well-documented. N+1 prevention pattern is standard.
- **Phase 6 (Search):** Complete SQL for tsvector triggers and GIN indexes is provided in ARCHITECTURE.md. Only the validation ritual (run migrate dev 3x) requires discipline, not research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All DevCollab library versions verified against npm, GitHub releases, and official docs. React 19 and NestJS 11 compatibility confirmed for all additions. One conflict (Meilisearch vs tsvector) resolved with explicit rationale based on scale analysis and 2-of-3 file agreement. |
| Features | HIGH | Feature list derived from competitor analysis (GitHub Gist, Slack, Notion, Linear), RBAC permission tables verified against industry standards, anti-features documented with specific cost/benefit rationale. Priority matrix (P1/P2/P3) is opinionated and defensible for a portfolio project. |
| Architecture | HIGH | All integration points verified via direct codebase inspection of existing `apps/api`, `packages/database`, `docker-compose.dev.yml`, `turbo.json`, and `.github/workflows/deploy.yml`. Separate Postgres and separate Prisma client output pattern verified against official Prisma multi-database documentation. |
| Pitfalls | HIGH | All 12 pitfalls verified against official documentation, confirmed open GitHub issues (Prisma GIN drift #16275, Coolify secret leak #7019/#7235, Multer 500 #465, Tiptap SSR #5856), or direct codebase analysis (CASL guard line 24). No invented pitfalls. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tiptap content storage format:** PITFALLS.md notes that mentions stored as plain `@name` text lose interactivity when rendered without the Tiptap extension. The decision between storing Tiptap JSON (full fidelity, requires Tiptap to read) vs sanitized HTML (portable, loses mention interactivity) affects the `content` column type on `Post` and `ThreadComment` models. Must be resolved in Phase 4 planning before schema migrations are written.

- **R2 CORS exact configuration:** PITFALLS.md confirms R2 does not support wildcard `AllowedHeaders: ["*"]` and requires explicit `content-type` listing. The exact working CORS configuration for browser presigned PUT uploads has community reports of subtle failures. Verify with a real browser upload during Phase 7 before shipping.

- **Coolify per-service webhook trigger:** The existing `deploy.yml` uses a single Coolify webhook for TeamFlow. Adding DevCollab may require a separate webhook URL or a Coolify API call to trigger only the DevCollab services. This is Coolify-instance-specific and cannot be fully resolved from documentation — needs hands-on testing in Phase 8.

- **Port conflict resolution:** STACK.md and ARCHITECTURE.md disagree on DevCollab ports. STACK.md says 3001/4001, ARCHITECTURE.md says 3002/3003. Given that TeamFlow API already runs on 3001, use 3002/3003 (Architecture doc values). Confirm no conflicts in the actual running `docker-compose.dev.yml` before Phase 1 scaffold.

---

## Sources

### Primary (HIGH confidence)
- [Tiptap Next.js Installation Guide](https://tiptap.dev/docs/editor/getting-started/install/nextjs) — `immediatelyRender: false` SSR fix, v3 package list
- [Tiptap SSR hydration issue #5856](https://github.com/ueberdosis/tiptap/issues/5856) — confirmed bug and fix
- [Tiptap 3.0 Stable Release](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) — architecture changes, React 19 compatibility
- [Shiki Next.js Integration](https://shiki.style/packages/next) — v3.22.0 RSC usage patterns
- [AWS SDK v3 S3 Request Presigner](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) — presigned URL API
- [Cloudflare R2 S3 Compatibility](https://developers.cloudflare.com/r2/examples/) — R2 S3 API examples
- [Cloudflare R2 CORS configuration](https://developers.cloudflare.com/r2/buckets/cors/) — wildcard header restriction confirmed
- [Meilisearch Docker Guide](https://www.meilisearch.com/docs/guides/docker) — official Docker setup
- [nestjs-meilisearch v3.0.0 Release](https://github.com/lambrohan/nestjs-meilisearch/releases) — NestJS 11 support, NestJS 10 drop confirmed
- [Prisma GIN index drop/recreate bug #16275](https://github.com/prisma/prisma/issues/16275) — confirmed open issue
- [Prisma tsvector not supported #12343](https://github.com/prisma/prisma/issues/12343) — native tsvector not supported confirmed
- [Prisma Multiple Databases Guide](https://www.prisma.io/docs/guides/multiple-databases) — separate client output pattern
- [Turborepo prune reference](https://turborepo.dev/docs/reference/prune) — multi-app build patterns
- [Turborepo env vars docs](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables) — globalEnv and globalDependencies
- [Turbo cache env var bug #10690](https://github.com/vercel/turborepo/issues/10690) — confirmed caching behavior
- [NestJS official file upload docs](https://docs.nestjs.com/techniques/file-upload) — Multer integration patterns
- [Multer size limit 500 bug #465](https://github.com/nestjs/nest/issues/465) — confirmed behavior (returns 500, not 413)
- [Coolify env variables docs](https://coolify.io/docs/knowledge-base/environment-variables) — locking secrets procedure
- [Coolify secret leakage #7019](https://github.com/coollabsio/coolify/issues/7019) — confirmed open bug
- [Coolify secrets in debug logs #7235](https://github.com/coollabsio/coolify/issues/7235) — confirmed behavior
- [Tiptap Mention extension docs](https://tiptap.dev/docs/editor/extensions/nodes/mention) — items callback pattern
- [Tiptap Mention debounce discussion #5832](https://github.com/ueberdosis/tiptap/discussions/5832) — debounce solution confirmed

### Secondary (MEDIUM confidence)
- [Postgres FTS vs Meilisearch vs Elasticsearch comparison](https://medium.com/@simbatmotsi/postgres-full-text-search-vs-meilisearch-vs-elasticsearch-choosing-a-search-stack-that-scales-fcf17ef40a1b) — Dec 2025 comparison confirming tsvector adequacy at portfolio scale
- [Prisma fullTextSearchPostgres preview status](https://github.com/prisma/prisma/discussions/26136) — still Preview for Postgres as of 2026
- [Bulletproof FTS in Prisma without migration drift](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3) — trigger-based solution pattern
- [react-markdown v10.1.0 Releases](https://github.com/remarkjs/react-markdown/releases) — React 19 compatibility confirmed in v9.0.2+
- [Cloudflare R2 NestJS Integration](https://medium.com/@nurulislamrimon/cloudflare-r2-object-storage-functions-for-the-nestjs-in-one-shot-992225952fc8) — NestJS + R2 pattern (2026)
- [Solving NestJS module resolution in Turborepo](https://medium.com/@cloudiafricaa/solving-nestjs-module-resolution-in-turborepo-the-package-json-fix-6e7ac0d037dc) — `"*"` vs `"workspace:*"` fix
- [Coding Horror: Web discussions flat by design](https://blog.codinghorror.com/web-discussions-flat-by-design/) — flat comment model rationale
- [Workspace RBAC patterns: OSO](https://www.osohq.com/learn/rbac-examples) — Admin/Contributor/Viewer permission tables

### Direct Codebase Analysis (HIGH confidence)
- `apps/api/src/core/rbac/rbac.guard.ts` — allow-by-default behavior at line 24 confirmed
- `docker-compose.dev.yml` — existing port allocations, network name `teamflow-network`, volume patterns
- `turbo.json` — existing task definitions, `dependsOn: ["^build"]`, output globs
- `.github/workflows/deploy.yml` — existing build-and-push pattern for reference
- `packages/database/` — existing Prisma package structure to mirror for `packages/devcollab-database`

---

*Research completed: 2026-02-17*
*Ready for roadmap: yes*
