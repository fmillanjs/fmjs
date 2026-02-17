# Pitfalls Research: DevCollab — Second App in Existing Turborepo Monorepo

**Domain:** Adding second NestJS + Next.js app (DevCollab) to existing Turborepo monorepo with Tiptap rich text, S3 file uploads, Postgres full-text search, threaded discussions, mention notifications, workspace RBAC, and Coolify deployment
**Researched:** 2026-02-17
**Confidence:** HIGH (verified against official docs, open GitHub issues, and existing codebase analysis)

---

## Critical Pitfalls

### Pitfall 1: Tiptap SSR Hydration — Missing `immediatelyRender: false`

**What goes wrong:**
The Tiptap editor renders on the server during Next.js SSR, producing HTML that does not match what the client renders after hydration. React throws a hydration mismatch error, the editor component crashes, and in some cases the entire page becomes non-interactive.

**Why it happens:**
Tiptap's `useEditor` hook initializes synchronously. In Next.js App Router, Server Components render first. If the Tiptap component file does not have `'use client'` at the top OR if `immediatelyRender` is not explicitly set to `false`, the editor initializes during server render. The server produces content-containing HTML; the client produces empty editor HTML. React's reconciliation fails.

**How to avoid:**
1. Every file containing `useEditor` or `<EditorContent>` must start with `'use client'`.
2. Always set `immediatelyRender: false` in `useEditor` config:
   ```typescript
   'use client'
   const editor = useEditor({
     extensions: [StarterKit],
     content: initialContent,
     immediatelyRender: false, // REQUIRED for Next.js SSR
   });
   ```
3. Never use `EditorProvider` and `useEditor` in the same component — `EditorProvider` wraps `useEditor` internally and combining them causes double initialization.
4. Isolate the editor into its own leaf client component; do not pass the editor instance up to Server Components.

**Warning signs:**
- "Hydration failed because the initial UI does not match what was rendered on the server" in the browser console
- Editor appears blank after page load
- Error fires only in production (SSR is more aggressive than `next dev` with Turbopack)
- Playwright e2e tests pass but Lighthouse sees blank content

**Phase to address:**
Phase where Tiptap editor is first introduced (rich text post/discussion creation). Validate SSR before adding any extensions.

---

### Pitfall 2: Tiptap StarterKit Extension Conflicts

**What goes wrong:**
After adding extensions beyond StarterKit (Mention, Collaboration, CodeBlockLowlight, etc.), the console shows "Duplicate extension names found" warnings. In some cases the History extension from StarterKit conflicts with the Collaboration extension's built-in undo/redo manager, silently breaking undo/redo.

**Why it happens:**
StarterKit bundles History, Bold, Italic, BulletList, etc. When developers install individual extensions that are already part of StarterKit and include them again in the `extensions` array, duplicates are registered. The Collaboration extension ships its own History implementation that must REPLACE StarterKit's, not stack with it.

**How to avoid:**
1. When adding any extension that StarterKit already includes, disable it in StarterKit:
   ```typescript
   StarterKit.configure({
     history: false, // Required when using Collaboration extension
     // disable others you're adding individually
   })
   ```
2. Use the official Tiptap extension list to check StarterKit's bundled extensions before adding any.
3. For the Mention extension: it is NOT in StarterKit, add it cleanly with no disable needed.

**Warning signs:**
- Console: "Duplicate extension names found" on editor mount
- Undo/redo stops working after adding a new extension
- Editor seems to work but keymap shortcuts behave unexpectedly

**Phase to address:**
Rich text editor phase. Run a console-warning check as part of the acceptance criteria before shipping any Tiptap feature.

---

### Pitfall 3: Prisma tsvector GIN Index Dropped on Every Migration

**What goes wrong:**
After adding a GIN index for full-text search in a Prisma migration, every subsequent `prisma migrate dev` run generates a migration that drops and recreates the GIN index, even when nothing changed. This is an open Prisma bug affecting `ops: raw()` syntax used with GIN indexes and `gin_trgm_ops`. Additionally, `GENERATED ALWAYS AS` tsvector columns cause Prisma Migrate to produce DROP/ADD expressions on every migration, eventually preventing new migrations from being applied cleanly.

**Why it happens:**
Prisma's diffing logic does not correctly compare raw operator classes in GIN index definitions. It treats the index as "changed" on every run. The same bug affects generated columns — Prisma does not understand that the column is computed and tries to manage it as a regular column.

**How to avoid:**
Use the trigger-based pattern instead of generated columns. This approach avoids both migration drift issues:
1. Add a `Unsupported("tsvector")` typed column to the Prisma schema, marked nullable so Prisma does not manage its value.
2. Create the GIN index in an initial migration using `prisma migrate dev --create-only` to get the SQL file, then add the GIN manually:
   ```sql
   CREATE INDEX IF NOT EXISTS "posts_search_idx" ON "Post" USING GIN ("search_vector");
   ```
3. Maintain the tsvector column via a PostgreSQL trigger (not a generated column):
   ```sql
   CREATE OR REPLACE FUNCTION update_post_search_vector()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.search_vector = to_tsvector('english',
       coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER post_search_vector_trigger
   BEFORE INSERT OR UPDATE ON "Post"
   FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();
   ```
4. Use `prisma.$queryRaw` for all full-text search queries — Prisma's `findMany` does not pass through to the GIN index.

**Warning signs:**
- Generated migration contains `DROP INDEX` followed immediately by `CREATE INDEX` for your GIN index with no schema changes made
- `prisma migrate dev` warns about schema drift
- `prisma db pull` removes your `ops: raw()` declarations
- Full-text queries are slow (index not being used — check with `EXPLAIN ANALYZE`)

**Phase to address:**
Full-text search phase. Validate migration stability by running `prisma migrate dev` three times in a row before merging — if any migration is generated on runs 2 or 3, the pattern is wrong.

---

### Pitfall 4: CASL Guard Allows Access When `@CheckAbility` Is Missing

**What goes wrong:**
New DevCollab endpoints (discussion threads, file uploads, workspace members) are added to the NestJS controller without `@CheckAbility` decorators. The existing `RbacGuard` contains this logic: `if (!requirement) { return true; }`. Any endpoint without the decorator is accessible to any authenticated user regardless of role, creating an authorization bypass.

**Why it happens:**
The current TeamFlow `rbac.guard.ts` line 24 explicitly allows routes with no decorator to pass through. This is intentional for TeamFlow's public-read routes, but when DevCollab adds new controllers, developers copy the controller pattern without noticing the decorator requirement. The guard silently passes the request through.

**How to avoid:**
For the DevCollab NestJS app, choose one of two approaches:

**Option A — Deny by default (recommended for DevCollab):**
```typescript
// In DevCollab's ability guard
if (!requirement) {
  // Deny by default — all routes must have @CheckAbility
  throw new ForbiddenException('Route is missing @CheckAbility decorator');
}
```

**Option B — Allow list of explicitly public routes:**
```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
  context.getHandler(),
  context.getClass(),
]);
if (isPublic) return true;
if (!requirement) throw new ForbiddenException('Missing RBAC decorator');
```

Additionally: add a unit test that enumerates all controller methods in the DevCollab API and asserts each has either `@CheckAbility` or `@Public`.

**Warning signs:**
- New controller file committed without `@CheckAbility` on any method
- Reviewer approves controller PR without checking for RBAC decorators
- Integration tests never test a forbidden role attempting the endpoint

**Phase to address:**
The very first DevCollab NestJS app setup phase. The deny-by-default guard must be in place BEFORE any business logic controllers are written.

---

### Pitfall 5: Turbo Cache Stale for Second App — `.env` at Root Only

**What goes wrong:**
The existing `turbo.json` has `"globalDependencies": [".env"]`. When DevCollab adds a second NestJS app (`apps/api-devcollab/`) with its own port and secrets (e.g., `API_DEVCOLLAB_PORT=3002`, `R2_SECRET_KEY`), those values live in the root `.env` or a separate `apps/api-devcollab/.env`. Turborepo 2.x caches builds by hashing inputs. If the DevCollab `.env` is not in `globalDependencies` or task-level `env`, the build caches stale — DevCollab rebuilds against old env values.

**Why it happens:**
Turborepo's `globalDependencies` only tracks the files listed. A second `.env` at `apps/api-devcollab/.env` is not in the global hash. Additionally, if `DATABASE_URL` changes between machines (local vs CI), the hash changes causing spurious cache misses across all apps.

**How to avoid:**
1. Keep app-specific env vars in `apps/<appname>/.env` files (not root `.env`).
2. Add per-app env tracking in `turbo.json`:
   ```json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "dist/**"],
         "env": ["NODE_ENV", "API_PORT", "API_DEVCOLLAB_PORT"]
       }
     },
     "globalDependencies": [".env", "apps/api-devcollab/.env"]
   }
   ```
3. Do NOT put `DATABASE_URL` in the Turbo env hash — it changes per machine and breaks remote cache.
4. Validate cache behavior: after a clean build of DevCollab, change only a TeamFlow file and confirm DevCollab does NOT rebuild.

**Warning signs:**
- DevCollab builds when only TeamFlow files changed
- TeamFlow and DevCollab share the same Turbo cache key (check with `turbo run build --dry-run`)
- CI builds always show cache miss despite no code changes

**Phase to address:**
Monorepo scaffold phase (adding second app to Turborepo). Validate cache keys before any feature work begins.

---

### Pitfall 6: Shared `@repo/database` Package — Both Apps Run Migrations Independently

**What goes wrong:**
Both TeamFlow (`apps/api`) and DevCollab (`apps/api-devcollab`) import from `@repo/database`. When a developer adds DevCollab-specific models (Post, Thread, Reply, Mention, FileUpload) to `packages/database/prisma/schema.prisma`, both apps pick up ALL migrations. TeamFlow is deployed first with the new DevCollab schema applied, but the TeamFlow app code does not use those tables. Worse: if migrations are run separately from each app's startup script, they race against each other in production.

**Why it happens:**
There is only one `schema.prisma` and one migration history. Running `prisma migrate deploy` from two containers simultaneously against the same database causes a race on the `_prisma_migrations` lock table.

**How to avoid:**
1. Designate ONE migration runner. In Docker Compose / Coolify, add a dedicated `migration` service that runs `prisma migrate deploy` once, then exits. Both app containers depend on it:
   ```yaml
   migrate:
     command: npx prisma migrate deploy
     depends_on: [postgres]
   api-teamflow:
     depends_on: [migrate]
   api-devcollab:
     depends_on: [migrate]
   ```
2. Never run `prisma migrate deploy` in the app's startup command when multiple services share the schema.
3. For schema additions: add new DevCollab models using additive-only changes (new tables, new columns with defaults). Never alter or drop existing TeamFlow columns.

**Warning signs:**
- Two containers both execute `prisma migrate deploy` on startup
- Migration lock timeout errors in logs (`ERROR: relation "_prisma_migrations" is locked`)
- DevCollab schema changes accidentally rename a TeamFlow field

**Phase to address:**
Monorepo scaffold phase for second app. The migration runner pattern must be in place before DevCollab API starts.

---

### Pitfall 7: File Upload — MIME Spoofing and Multer Size Limit Returns 500

**What goes wrong:**
Multer's file size limit throws an internal NestJS error (500) by default rather than a 413 Payload Too Large response. Additionally, file type validation based on the `mimetype` field from the `Content-Type` header can be bypassed — a user can rename an `.exe` to `.jpg` and upload it; Multer reports `image/jpeg` based on what the browser sends, not the actual file contents.

**Why it happens:**
Multer size limit exceeded fires the `LIMIT_FILE_SIZE` error before NestJS exception filters can handle it. The browser (or HTTP client) sets the `Content-Type` multipart boundary and individual field MIME type — these are not verified against file signatures by Multer.

**How to avoid:**
1. Catch Multer errors with a custom exception filter:
   ```typescript
   @Catch(MulterError)
   export class MulterExceptionFilter implements ExceptionFilter {
     catch(error: MulterError, host: ArgumentsHost) {
       const response = host.switchToHttp().getResponse();
       if (error.code === 'LIMIT_FILE_SIZE') {
         return response.status(413).json({ message: 'File too large' });
       }
       return response.status(400).json({ message: error.message });
     }
   }
   ```
2. Validate actual file magic bytes (file signature) with the `file-type` npm package after upload, not before:
   ```typescript
   import { fileTypeFromBuffer } from 'file-type';
   const type = await fileTypeFromBuffer(buffer);
   if (!['image/jpeg', 'image/png', 'application/pdf'].includes(type?.mime ?? '')) {
     throw new UnsupportedMediaTypeException('Invalid file type');
   }
   ```
3. Use presigned S3/R2 PUT URLs for uploads larger than 10MB — proxy uploads through NestJS consume server memory proportional to file size.
4. For Cloudflare R2: do NOT use wildcard `AllowedHeaders: ["*"]` in CORS config — R2 does not support wildcard headers. Explicitly list `content-type`.

**Warning signs:**
- File upload endpoint returns 500 on files just over the size limit
- Users upload zip files with `.jpg` extension successfully
- R2 direct upload fails with CORS error on `content-type` header
- Memory usage on NestJS container spikes proportionally with upload traffic

**Phase to address:**
File upload phase. Test with: (1) file over limit, (2) renamed executable, (3) direct browser PUT to presigned URL. All three must produce correct errors before shipping.

---

### Pitfall 8: Threaded Discussions — Unbounded Recursive Queries and N+1

**What goes wrong:**
With a parent/child self-referential Comment model, fetching a thread naively loads the top-level posts then fires N queries for first-level replies, then N*M queries for second-level replies. At three levels deep with 10 posts each, this is 111 database queries per page load. Additionally, using recursive CTEs without depth limits allows malicious or accidental infinite recursion.

**Why it happens:**
Prisma's `include` for nested relations is eager-loaded but not recursive — you must explicitly nest `include: { replies: { include: { replies: ... } } }` to each depth level you need, creating brittle hard-coded depth. Developers who try recursive CTE via `$queryRaw` without a `maxdepth` guard will hit stack issues at scale.

**How to avoid:**
1. Enforce a maximum reply depth at the schema level (column `depth INT DEFAULT 0`) and validate in the service: reject creation of replies where `parent.depth >= 3`.
2. Use a flat "threaded" model (all comments flat in DB, grouped by `threadId` and ordered by `parentId`/`createdAt`) instead of true recursive nesting. Fetch an entire thread in one query:
   ```typescript
   const comments = await prisma.comment.findMany({
     where: { threadId },
     include: { author: { select: { id: true, name: true, avatarUrl: true } } },
     orderBy: { createdAt: 'asc' },
   });
   // Tree assembly happens in-memory, not in the DB
   ```
3. For the frontend: build the tree in JavaScript from the flat array, not through nested API calls.
4. Paginate threads (cursor-based), not individual comments — fetch the whole thread at once up to a reasonable size (e.g., 500 comments max).

**Warning signs:**
- `prisma.$on('query')` logs show 50+ queries for a single thread page
- Thread page load exceeds 2 seconds on a thread with 30 replies
- Playwright test for thread view takes longer than other page tests

**Phase to address:**
Threaded discussions phase. Add Prisma query logging in integration tests and assert total query count per thread fetch is under 5.

---

### Pitfall 9: Mention Notifications — Thundering Herd and Duplicate Notifications

**What goes wrong:**
In Tiptap's Mention extension, the `items` callback fires on every keystroke. Without debouncing, a user typing `@john` fires 5 API requests (one per character). Separately: when a post with mentions is saved, the notification fan-out (one notification per mentioned user) runs synchronously in the NestJS request handler. On a post mentioning 20 users, the handler stalls for the duration of 20 sequential DB inserts. A third bug: if the user saves the same post twice (double-click), duplicate mention notifications are created.

**Why it happens:**
The Tiptap `Suggestion` utility's `items` callback is invoked synchronously on every doc change. Developers write a direct `fetch()` call in `items`, not realizing it fires per-keystroke. Notification fan-out is a natural place for `await prisma.notification.createMany()` but most implementations do it in the request handler rather than async. Idempotency on notifications is not enforced.

**How to avoid:**
1. Debounce the mention search API call inside `items`:
   ```typescript
   items: debounce(async ({ query }) => {
     if (query.length < 1) return [];
     const res = await fetch(`/api/users/search?q=${query}&limit=5`);
     return res.json();
   }, 300),
   ```
2. Fan-out mention notifications as a background job. In NestJS, use the EventEmitter pattern already in the codebase:
   ```typescript
   this.eventEmitter.emit('mention.created', { mentionedUserIds, postId, actorId });
   // Handler runs after response is sent
   ```
3. Add a unique constraint to prevent duplicate notifications: `@@unique([userId, postId, type])` on the Notification model.
4. Prevent collaborative suggestion popup from showing to all users: use `isChangeOrigin` from the Collaboration extension to suppress suggestion on remote doc changes.

**Warning signs:**
- Browser network tab shows a burst of `/api/users/search` calls while typing `@`
- Post author reports: "I mentioned someone and they got 3 notifications"
- NestJS request handler response time proportional to number of mentioned users

**Phase to address:**
Mention notifications phase. Load-test the mention search endpoint with rapid keystrokes. Verify notification uniqueness constraint prevents duplicates.

---

### Pitfall 10: Coolify Second App — Secret Leakage in Deployment Logs

**What goes wrong:**
When deploying DevCollab as a second application in Coolify on the same server as TeamFlow, the deployment debug logs expose all environment variables in plain text, including database passwords, S3 secrets, and JWT signing keys. Anyone with Coolify dashboard access (including the portfolio reviewer) can see all secrets for both apps.

**Why it happens:**
Coolify has an open bug (GitHub issue #7019 and #7235) where the deployment log leaks environment variable values. Secrets are only redacted as `<REDACTED>` if they are explicitly marked as "locked" in the Coolify UI. The default is unlocked/visible.

**How to avoid:**
1. After adding environment variables to DevCollab in Coolify, immediately lock every sensitive variable (database credentials, S3 secrets, JWT secrets, API keys) using the lock icon in Coolify's environment variable UI.
2. Use Coolify's secret management rather than plain environment variables for credentials.
3. Test: after locking, trigger a deployment and inspect the logs — sensitive values should appear as `<REDACTED>`.
4. Keep TeamFlow and DevCollab in separate Coolify "Projects" (not just separate "Services") to enforce log isolation.

**Warning signs:**
- Deployment log contains a string matching `DATABASE_URL=postgresql://...`
- Coolify environment variable list shows actual values (not `***`) in the variable list for a reviewer with view-only access

**Phase to address:**
DevCollab Coolify deployment phase. The lock-all-secrets step must be part of the deployment checklist before any public demo link is shared.

---

### Pitfall 11: Turbo Build Order — Second NestJS App Not in Pipeline `dependsOn`

**What goes wrong:**
The second DevCollab NestJS app depends on `@repo/database` and `@repo/shared`. When `turbo run build` is executed, if the new app's `package.json` does not declare these dependencies using the workspace protocol, Turborepo does not infer the build order. The DevCollab API may attempt to build before `@repo/database` generates Prisma client, causing TypeScript errors about missing types.

**Why it happens:**
The existing `turbo.json` uses `"dependsOn": ["^build"]` which correctly orders packages before apps — BUT only if the app's `package.json` properly declares `"@repo/database": "*"` as a dependency. If the DevCollab app is scaffolded with `"@repo/database": "workspace:*"` (pnpm syntax) instead of `"*"` (npm workspace syntax), npm workspaces do not resolve it, and Turbo loses the dependency edge.

**How to avoid:**
1. Use `"*"` not `"workspace:*"` for internal packages in npm workspaces (the existing apps use this pattern correctly — match it exactly).
2. Verify the new app appears in `turbo run build --dry-run` output AFTER `@repo/database` and `@repo/shared`.
3. Add `"@repo/config": "*"` if DevCollab shares ESLint/TypeScript config packages.

**Warning signs:**
- `turbo run build` fails with "Cannot find module '@repo/database'"
- DevCollab build starts before the database package build completes in the Turbo output
- `turbo run build --dry-run` shows DevCollab in the first execution tier alongside packages

**Phase to address:**
Monorepo scaffold phase. Verify with `--dry-run` before writing any DevCollab business logic.

---

### Pitfall 12: Optimistic Updates on Threaded Discussions — Stale Reply State

**What goes wrong:**
Optimistic updates for adding a reply insert the reply into local state immediately before the server confirms. If the server rejects the reply (validation error, permission denial, network failure), the rollback removes the reply from state — but if the user had already expanded the thread and scrolled, the revert causes a jarring layout shift. Worse: if two users reply simultaneously, the optimistic reply is visible to the poster but the server's sequential IDs insert the other user's reply "above" the optimistic one, causing visual reordering on confirmation.

**Why it happens:**
Optimistic updates assume eventual consistency, but thread ordering (by `createdAt`) means a reply's visual position is determined by the server timestamp, not the client-side insert time. The optimistic state uses client time; the confirmed state uses server time.

**How to avoid:**
1. Use server-assigned IDs and timestamps as the source of truth. Assign a temporary `id: 'temp-${Date.now()}'` for the optimistic entry and replace it on server confirmation.
2. Sort the local thread by `createdAt` after each update, including after optimistic inserts. The optimistic entry with a recent client timestamp will naturally sort to the end.
3. On confirmation, replace the temp entry with the server's response (which includes the real `id` and `createdAt`).
4. On rejection, remove the temp entry and show a toast error (use `sonner` which is already in the web package).

**Warning signs:**
- Duplicate replies appear briefly after posting (temp + real)
- Thread reorders visually when two users post simultaneously
- User sees their reply disappear on network error with no feedback

**Phase to address:**
Threaded discussions phase. Multi-user reply simulation is a required e2e test scenario.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Running `prisma migrate deploy` in both API container startups | Simple Dockerfile | Race condition in production, migration lock timeouts | Never — use dedicated migration service |
| Fetching full user list in Tiptap mention `items` callback | No backend needed | 5000 users loaded on every `@` keystroke | Never — always backend-search with debounce |
| Returning raw file path from NestJS upload endpoint | Simple implementation | Internal bucket structure exposed to client | Never — return only public URL or signed URL |
| Storing tsvector as `Unsupported` Prisma type without trigger | Quick schema setup | tsvector never updated when post content changes | Never — trigger must accompany column |
| `@UseGuards(JwtAuthGuard)` without `@CheckAbility` on new endpoints | Fast prototyping | Any authenticated user has access (auth != authz) | Never in production routes |
| Flat `.env` at repo root for both apps | Simple dev setup | Turbo cache includes secrets in global hash; DB URL causes spurious cache misses | Dev only — use per-app `.env` before deploying |
| `faker.seed()` without fixed number in demo seed script | Quick data generation | Different data each run breaks demo narratives | Never for recruiter demos — use fixed seed |

---

## Integration Gotchas

Common mistakes when connecting components of this specific stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tiptap + Next.js 15 App Router | Rendering Tiptap in a Server Component | Every Tiptap component must be `'use client'` + `immediatelyRender: false` |
| Cloudflare R2 + browser direct upload | Using `AllowedHeaders: ["*"]` in R2 CORS | Explicitly list `content-type` — R2 does not support wildcard headers |
| NestJS Multer + size limit | Size exceeded returns 500 | Add `@Catch(MulterError)` filter to return 413 |
| Prisma tsvector + GIN index | Using GENERATED column syntax | Use PostgreSQL trigger + nullable `Unsupported("tsvector")` column |
| Tiptap Mention + Collaboration | Both registered alongside StarterKit History | Disable `history: false` in StarterKit when using Collaboration |
| Coolify + secrets | Env vars visible in deployment logs | Lock all sensitive variables immediately after adding them in Coolify UI |
| DevCollab second API + Prisma | Both NestJS containers run `migrate deploy` | Single `migrate` service in docker-compose; app containers `depends_on: [migrate]` |
| Turbo + second NestJS app | Using `"workspace:*"` in package.json | Use `"*"` — npm workspaces syntax, not pnpm |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recursive Prisma `include` for nested comments | 100+ queries for deep thread, 5s+ load times | Flat model + in-memory tree assembly | ~30 comments in a thread |
| Syncing mention notifications in-request | Request response time scales with @mention count | EventEmitter fan-out (async after response) | ~10 mentioned users |
| Full-text search without GIN index | Search queries scan full table, >1s at scale | PostgreSQL trigger + GIN index + `$queryRaw` with `@@` operator | ~10,000 posts |
| Proxy file uploads through NestJS container | Server OOM under concurrent upload traffic | S3/R2 presigned PUT URLs for client-direct upload | ~10 concurrent uploads of 5MB+ |
| Loading all workspace members for @mention typeahead | 3-second dropdown open time in large workspaces | Debounced search API returning max 5-10 results | ~200 workspace members |
| Full schema re-generation when DevCollab types added | `@repo/database` rebuild on every DevCollab schema change | Separate schema output, or additive schema changes with stable client | At scale (CI time) |

---

## Security Mistakes

Domain-specific security issues for this feature set.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting browser-reported MIME type for uploads | Malicious file bypass (executable uploaded as image) | Verify magic bytes with `file-type` package after receiving file buffer |
| Missing `@CheckAbility` on DevCollab endpoints | Any authenticated user reads/writes any workspace's data | Deny-by-default guard; unit test enumerating all controller methods |
| Exposing internal S3/R2 bucket path in API response | Bucket structure discovery, enables path traversal attempts | Return only signed URLs or CDN URLs, never raw bucket paths |
| Coolify secrets not locked | All secrets visible in deployment logs to dashboard viewers | Lock every secret immediately after creation in Coolify UI |
| tsvector search query not sanitized | Postgres `to_tsquery()` throws on malformed input (special chars) | Use `plainto_tsquery()` or `websearch_to_tsquery()` which are safe with arbitrary input |
| Mention notification without membership check | Users can be mentioned in workspaces they don't belong to | Validate all `mentionedUserId` values are workspace members before creating notifications |
| Signed URL expiry too long for file downloads | Leaked URL gives permanent access to private file | Set presigned URL expiry to ≤ 1 hour for sensitive content |

---

## UX Pitfalls

Common user experience mistakes specific to this feature set.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Editor content lost on navigation away | Users lose long-written posts on accidental back-navigation | Auto-save draft to localStorage on every `editor.on('update')` event |
| Mention dropdown opens for all collaborative users | Other users see intrusive dropdown while one user types `@` | Use Tiptap `isChangeOrigin` to suppress suggestion popup on remote changes |
| File upload with no progress indicator | User abandons upload thinking it is broken | Show upload progress via XMLHttpRequest `onprogress` event on direct R2 PUT |
| Thread reorders after posting (optimistic mismatch) | Confusing visual jump as new reply finds its sorted position | Assign temp `createdAt: new Date()` to optimistic entry, sort consistently |
| `@mention` appears as plain text if extension not loaded | Mentions stored as `@name` text, lose interactivity if rendered without Tiptap | Store mentions as JSON (Tiptap node format) in DB, render with read-only Tiptap instance |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Tiptap editor:** Often appears to work in dev but fails in production SSR — verify `immediatelyRender: false` is set AND component has `'use client'`
- [ ] **File uploads:** MIME validation looks complete but only checks `mimetype` field — verify `file-type` magic byte check is also applied
- [ ] **Full-text search:** GIN index exists in the DB but Prisma drops it on next migration — verify `prisma migrate dev` run #2 produces no index changes
- [ ] **tsvector sync:** Column exists but trigger is missing — verify updating a post title reflects in search results without manual re-indexing
- [ ] **CASL guards:** Controller compiles and responds — verify a Viewer-role user receives 403 on Contributor-only actions, not 200
- [ ] **Mention notifications:** Notification created for each mention — verify double-save does not create duplicate notifications
- [ ] **Coolify secrets:** Env vars are set — verify deployment log does NOT contain the actual secret values (should show `<REDACTED>`)
- [ ] **Seed data:** Script runs once — verify running the seed script a second time does not create duplicate workspace/users
- [ ] **Prisma migration runner:** Both API containers start — verify only one migration runner executes `migrate deploy` (check DB migration lock table)
- [ ] **Turbo build order:** DevCollab builds successfully — verify `turbo run build --dry-run` shows `@repo/database` before `api-devcollab`

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tiptap SSR hydration crash (Pitfall 1) | LOW | Add `immediatelyRender: false` + `'use client'`, clear `.next` cache, redeploy |
| GIN index drift in every migration (Pitfall 3) | MEDIUM | Switch to trigger pattern: write new migration to DROP GENERATED column, CREATE trigger, add GIN index manually in SQL migration file |
| CASL guard bypass discovered (Pitfall 4) | HIGH | Audit all endpoints with `grep -r "@CheckAbility" apps/api-devcollab/src`, add missing decorators, add unit test to prevent regression, hot-patch deploy |
| Duplicate mention notifications in production (Pitfall 9) | MEDIUM | Add `@@unique` constraint via migration, write cleanup script for duplicate rows, add idempotency check in handler |
| Secrets leaked in Coolify logs (Pitfall 10) | HIGH | Lock secrets in Coolify UI immediately, rotate all exposed credentials (new DB password, new S3 keys, new JWT secret), update locked secrets in Coolify |
| Both API containers racing on migrations (Pitfall 6) | MEDIUM | Stop both containers, add migration service to docker-compose, redeploy with correct dependency order |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pitfall 1: Tiptap SSR hydration | Rich text editor phase — day 1 | SSR smoke test: `next build && next start`, verify no hydration errors in browser console |
| Pitfall 2: StarterKit extension conflicts | Rich text editor phase — when adding first extension beyond StarterKit | Zero "Duplicate extension names" warnings in console |
| Pitfall 3: GIN index migration drift | Full-text search phase — schema setup | Run `prisma migrate dev` 3x in a row; migrations 2 and 3 generate nothing |
| Pitfall 4: CASL guard missing decorator | DevCollab NestJS app scaffold phase — before first controller | Viewer-role requests to Contributor endpoints return 403 |
| Pitfall 5: Turbo cache stale for second app | Monorepo scaffold phase — second app added to workspace | `turbo run build --dry-run` shows correct dependency order; cache hit after clean build |
| Pitfall 6: Shared schema migration race | Monorepo scaffold phase — before DevCollab API first deploy | Single `migrate` container runs; app containers have `depends_on: [migrate]` |
| Pitfall 7: File upload MIME spoofing / 500 | File upload phase | Upload renamed `.exe` as `.jpg` → 415; upload oversized file → 413 |
| Pitfall 8: N+1 threaded queries | Threaded discussions phase | Prisma query count per thread fetch < 5; 50-comment thread loads in <500ms |
| Pitfall 9: Mention notification thundering herd | Mention notifications phase | Double-save → single notification per user; Tiptap mention search debounced to 300ms |
| Pitfall 10: Coolify secrets in logs | Coolify deployment phase — immediately on first deploy | Deployment log for DevCollab shows `<REDACTED>` for all credential vars |
| Pitfall 11: Turbo build order | Monorepo scaffold phase — adding second app | `turbo run build --dry-run` output: packages before apps |
| Pitfall 12: Optimistic update reordering | Threaded discussions phase | Playwright test: two users post simultaneously, no visual reordering on confirmation |

---

## Sources

**Tiptap + Next.js 15:**
- [Tiptap Next.js Installation Guide](https://tiptap.dev/docs/editor/getting-started/install/nextjs) — `immediatelyRender: false` requirement (official, HIGH confidence)
- [Tiptap SSR hydration issue #5856](https://github.com/ueberdosis/tiptap/issues/5856) — confirmed bug and fix (HIGH confidence)
- [StarterKit extension docs](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — bundled extension list (official, HIGH confidence)
- [Tiptap Collaboration extension](https://tiptap.dev/docs/editor/extensions/functionality/collaboration) — history conflict documentation (official, HIGH confidence)
- [Liveblocks Tiptap best practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips) — production patterns (MEDIUM confidence)

**Prisma Full-Text Search:**
- [Prisma GIN index drop/recreate bug #16275](https://github.com/prisma/prisma/issues/16275) — confirmed open issue (HIGH confidence)
- [Prisma tsvector feature request #12343](https://github.com/prisma/prisma/issues/12343) — native tsvector not supported (HIGH confidence)
- [Full-text search index not used #8950](https://github.com/prisma/prisma/issues/8950) — Prisma queries bypass GIN (HIGH confidence)
- [Bulletproof FTS in Prisma without migration drift](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3) — trigger-based solution (MEDIUM confidence)
- [Pedro Alonso: Postgres FTS with Prisma](https://www.pedroalonso.net/blog/postgres-full-text-search/) — practical implementation (MEDIUM confidence)

**CASL + NestJS RBAC:**
- [CASL + NestJS authorization guide](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1) — guard patterns (MEDIUM confidence)
- [Existing codebase: `apps/api/src/core/rbac/rbac.guard.ts`](file://.) — line 24 `if (!requirement) { return true; }` (HIGH confidence — direct code analysis)

**NestJS File Uploads:**
- [NestJS official file upload docs](https://docs.nestjs.com/techniques/file-upload) — Multer integration patterns (HIGH confidence)
- [Multer size limit 500 bug #465](https://github.com/nestjs/nest/issues/465) — confirmed behavior (HIGH confidence)
- [Cloudflare R2 CORS wildcard headers limitation](https://developers.cloudflare.com/r2/buckets/cors/) — official R2 docs (HIGH confidence)
- [R2 presigned URL CORS community thread](https://community.cloudflare.com/t/cors-issue-with-r2-presigned-url/428567) — real-world CORS failures (MEDIUM confidence)

**Threaded Discussions:**
- [Nested comments schema with Prisma](https://github.com/prisma/prisma/discussions/4394) — design patterns (MEDIUM confidence)
- [Database model for hierarchical content](https://www.aleksandra.codes/comments-db-model) — materialized path vs recursive (MEDIUM confidence)
- [Coding Horror: Flat by design](https://blog.codinghorror.com/web-discussions-flat-by-design/) — depth limit rationale (MEDIUM confidence)

**Turborepo + Second App:**
- [Turborepo env vars docs](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables) — globalEnv and globalDependencies (HIGH confidence)
- [Turbo cache despite globalEnv being different #10690](https://github.com/vercel/turborepo/issues/10690) — confirmed caching bug (HIGH confidence)
- [Solving NestJS module resolution in Turborepo](https://medium.com/@cloudiafricaa/solving-nestjs-module-resolution-in-turborepo-the-package-json-fix-6e7ac0d037dc) — workspace protocol fix (MEDIUM confidence)
- [Sharing Prisma between multiple applications](https://medium.com/@nolawnchairs/sharing-prisma-between-multiple-applications-5c7a7d131519) — migration coordination (MEDIUM confidence)

**Coolify Deployment:**
- [Coolify env variables docs](https://coolify.io/docs/knowledge-base/environment-variables) — locking secrets (HIGH confidence)
- [Coolify deployment log leaks secrets #7019](https://github.com/coollabsio/coolify/issues/7019) — confirmed open bug (HIGH confidence)
- [Coolify secrets in debug logs #7235](https://github.com/coollabsio/coolify/issues/7235) — confirmed behavior (HIGH confidence)

**Tiptap Mentions:**
- [Tiptap Mention extension docs](https://tiptap.dev/docs/editor/extensions/nodes/mention) — items callback pattern (HIGH confidence)
- [Debouncing mention query discussion #5832](https://github.com/ueberdosis/tiptap/discussions/5832) — debounce solution (HIGH confidence)
- [Tiptap thundering herd in collaborative setting](https://github.com/ueberdosis/tiptap/issues/3686) — `isChangeOrigin` solution (MEDIUM confidence)

---

*Pitfalls research for: DevCollab — second app in existing Turborepo monorepo (Tiptap, S3, tsvector, CASL, threaded discussions, Coolify)*
*Researched: 2026-02-17*
*Confidence: HIGH — all critical pitfalls verified against official documentation, confirmed open issues, or direct codebase analysis*
