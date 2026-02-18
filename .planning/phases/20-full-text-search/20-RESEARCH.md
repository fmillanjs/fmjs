# Phase 20: Full-Text Search - Research

**Researched:** 2026-02-18
**Domain:** PostgreSQL tsvector / GIN index / Prisma raw SQL / Next.js keyboard shortcut modal
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can search posts and snippets by text (full-text, workspace-scoped) | tsvector trigger pattern on Post.title+content and Snippet.title+code; $queryRaw search endpoint at GET /workspaces/:slug/search; prefix matching via to_tsquery(':*') |
| SRCH-02 | Search results are grouped (Posts / Snippets) with match highlighting | Backend returns `{ posts: [...], snippets: [...] }`; ts_headline() wraps matches in `<mark>` tags; frontend renders two sections |
| SRCH-03 | User can open global search with Cmd+K shortcut | 'use client' SearchModal component with useEffect keydown listener; metaKey/ctrlKey + 'k' toggle; Escape or outside-click closes |
</phase_requirements>

---

## Summary

Phase 20 adds Postgres full-text search across Posts and Snippets using the **trigger-based tsvector pattern** — the only approach that eliminates Prisma migration drift while keeping GIN indexes active. Prisma 5.x cannot represent `tsvector` columns natively; using `@db.Unsupported("tsvector")` with a trigger (not a `GENERATED ALWAYS AS` computed column) is the only way to get zero spurious migrations on consecutive `prisma migrate dev` runs.

The backend adds a `SearchModule` with a single GET endpoint (`/workspaces/:slug/search?q=...`). The endpoint issues two `$queryRaw` queries (one for Posts, one for Snippets) against a GIN-indexed `searchVector` column, uses `to_tsquery('english', $term:*)` for prefix matching, and calls `ts_headline()` for highlighting. Results are returned as `{ posts, snippets }`.

The frontend adds a `SearchModal` client component that mounts a `keydown` event listener for `Cmd+K` / `Ctrl+K`. The modal is rendered inside the `WorkspaceNav` bar (which already renders in the workspace layout for all pages), and is injected into `WorkspaceNav.tsx`. It calls the API with `credentials: 'include'` and renders two grouped sections with highlighted HTML from `ts_headline`.

**Primary recommendation:** Use the trigger-based tsvector column pattern (NOT `GENERATED ALWAYS AS`) with `@db.Unsupported("tsvector")?` in the Prisma schema. Add `$queryRaw` and `$executeRaw` delegation to `PrismaService`. Build no external library — plain `useEffect` + inline modal styling matches the existing codebase.

---

## Standard Stack

### Core

| Library / Feature | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| PostgreSQL tsvector | Built into Postgres 16 (project uses pg16) | Tokenized text index column | Native; no extra service needed |
| GIN index | Built into Postgres 16 | Fast inverted-index lookup on tsvector | Preferred over GiST for FTS; official docs recommend GIN |
| `tsvector_update_trigger` / custom trigger | Built into Postgres | Keep tsvector column in sync | Avoids GENERATED ALWAYS AS Prisma drift problem |
| Prisma `$queryRaw` | Prisma 5.22.0 (already installed) | Execute raw SQL from NestJS service | Only way to use tsvector queries; Prisma has no native FTS API |
| `to_tsquery` with `:*` prefix operator | PostgreSQL | Prefix matching for partial-word search | Requirement SRCH-01 explicitly requires prefix matching |
| `ts_headline()` | PostgreSQL | Wrap matching terms in HTML tags | Requirement SRCH-02; no extra library needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `plainto_tsquery` | PostgreSQL | Simple user input → tsquery with AND | Use when user input may contain punctuation; safe fallback if `to_tsquery` fails on malformed input |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Trigger-based tsvector | `GENERATED ALWAYS AS ... STORED` (computed column) | Computed columns cause Prisma migration drift on every subsequent run — Prisma tries to DROP DEFAULT; trigger pattern avoids this entirely |
| `to_tsquery` with `:*` | `websearch_to_tsquery` | `websearch_to_tsquery` never raises errors and handles OR/phrase syntax, but does NOT support prefix matching (the `:*` operator is specific to `to_tsquery`); required for SRCH-01 |
| Plain `useEffect` keydown | `cmdk` npm package | `cmdk` adds 47kB; project uses no UI library; inline pattern is 20 lines and matches existing BellIcon/NotificationList pattern |
| Inline `<mark>` HTML | `dangerouslySetInnerHTML` with sanitization | `ts_headline` output is not user-generated HTML; it only wraps our own stored text in `<b>` tags, which we override to `<mark>`; XSS risk is minimal when `StartSel` is a known safe tag |

**Installation:** No new npm packages required. All capabilities are built into Postgres 16 and Prisma 5.22.0.

---

## Architecture Patterns

### Recommended Project Structure

New files to create:

```
apps/devcollab-api/src/
└── search/
    ├── search.module.ts
    ├── search.controller.ts
    ├── search.service.ts
    └── dto/
        └── search-query.dto.ts

apps/devcollab-web/components/
└── search/
    ├── SearchModal.tsx          # 'use client' — Cmd+K modal
    └── SearchResults.tsx        # renders posts + snippets sections

packages/devcollab-database/prisma/
└── migrations/
    └── 20260218_add_fts_tsvector/
        └── migration.sql        # manually written; NOT auto-generated
```

### Pattern 1: Trigger-Based tsvector (Migration Drift Elimination)

**What:** Add a bare `tsvector` column (no DEFAULT, no GENERATED), then create a PL/pgSQL trigger that populates it before INSERT/UPDATE. Prisma sees only an `@db.Unsupported("tsvector")?` column — it does not try to generate or destroy it.

**When to use:** Always, when using Prisma with PostgreSQL tsvector. The `GENERATED ALWAYS AS` pattern causes Prisma to emit spurious `DROP DEFAULT` migrations on every subsequent `migrate dev` run.

**Migration SQL (manually written — NOT auto-generated):**

```sql
-- Step 1: Add bare tsvector column to Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Step 2: Add bare tsvector column to Snippet
ALTER TABLE "Snippet" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Step 3: Trigger function for Post
-- Indexes: title (weight A) + content (weight B)
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Step 4: Trigger for Post
DROP TRIGGER IF EXISTS post_search_vector_trigger ON "Post";
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Post"
  FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();

-- Step 5: Trigger function for Snippet
-- Indexes: title (weight A) + code (weight B)
CREATE OR REPLACE FUNCTION snippet_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.code, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Step 6: Trigger for Snippet
DROP TRIGGER IF EXISTS snippet_search_vector_trigger ON "Snippet";
CREATE TRIGGER snippet_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Snippet"
  FOR EACH ROW EXECUTE FUNCTION snippet_search_vector_update();

-- Step 7: Backfill existing rows
UPDATE "Post" SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B');

UPDATE "Snippet" SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(code, '')), 'B');

-- Step 8: GIN indexes
CREATE INDEX IF NOT EXISTS "Post_searchVector_idx" ON "Post" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Snippet_searchVector_idx" ON "Snippet" USING GIN ("searchVector");
```

**Why this eliminates drift:** Triggers and functions are not in Prisma schema — they live outside its diff scope. The `searchVector` column is declared as `@db.Unsupported("tsvector")?` in the Prisma schema, making it opaque to Prisma's migration engine. GIN indexes created with `CREATE INDEX` (not `@@index([searchVector], type: Gin)`) are also outside Prisma's schema diff. Subsequent `prisma migrate dev` runs see no schema changes, generating zero new migration files.

**Prisma Schema addition (append to Post and Snippet models):**

```prisma
model Post {
  // ... existing fields ...
  searchVector Unsupported("tsvector")?
}

model Snippet {
  // ... existing fields ...
  searchVector Unsupported("tsvector")?
}
```

**CRITICAL: Do NOT add `@@index([searchVector], type: Gin)` to the schema.** If you do, Prisma will try to manage that GIN index and will regenerate it on every `migrate dev`. The GIN index must exist ONLY in the manually-written migration SQL.

### Pattern 2: Raw SQL Search Query

**What:** `PrismaService.$queryRaw` with tagged template literals. Prisma sanitizes interpolated values automatically to prevent SQL injection.

**When to use:** Any FTS query that uses `@@`, `to_tsquery`, or `ts_headline` — none are expressible in Prisma's type-safe query API.

**CRITICAL: PrismaService must expose `$queryRaw` and `$executeRaw`.**

The current `PrismaService` (in `apps/devcollab-api/src/core/database/prisma.service.ts`) only exposes model getters. It does NOT expose `$queryRaw`. Adding these two getters is required:

```typescript
// In PrismaService, add alongside other getters:
get $queryRaw() {
  return this.client.$queryRaw.bind(this.client);
}

get $executeRaw() {
  return this.client.$executeRaw.bind(this.client);
}
```

**Search query (Posts, workspace-scoped, prefix matching, with highlighting):**

```typescript
// Source: PostgreSQL docs + Prisma $queryRaw docs
// In SearchService.search():
import { Prisma } from '@devcollab/database';

const term = query.trim().split(/\s+/).map(w => `${w}:*`).join(' & ');

const posts = await this.prisma.$queryRaw<SearchPostResult[]>(Prisma.sql`
  SELECT
    p.id,
    p.title,
    p.status,
    p."createdAt",
    p."authorId",
    p."workspaceId",
    ts_headline(
      'english',
      p.title || ' ' || p.content,
      to_tsquery('english', ${term}),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5, MaxFragments=2'
    ) AS headline
  FROM "Post" p
  WHERE p."workspaceId" = ${workspaceId}
    AND p."searchVector" @@ to_tsquery('english', ${term})
  ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${term})) DESC
  LIMIT 10
`);

const snippets = await this.prisma.$queryRaw<SearchSnippetResult[]>(Prisma.sql`
  SELECT
    s.id,
    s.title,
    s.language,
    s."createdAt",
    s."authorId",
    s."workspaceId",
    ts_headline(
      'english',
      s.title || ' ' || s.code,
      to_tsquery('english', ${term}),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5, MaxFragments=2'
    ) AS headline
  FROM "Snippet" s
  WHERE s."workspaceId" = ${workspaceId}
    AND s."searchVector" @@ to_tsquery('english', ${term})
  ORDER BY ts_rank(s."searchVector", to_tsquery('english', ${term})) DESC
  LIMIT 10
`);
```

**Prefix term construction:** Split the user's query on whitespace, append `:*` to each token, join with ` & `. This produces `to_tsquery('english', 'reac:* hook:*')` which matches "React", "reacting", "hooks", etc.

**IMPORTANT: The `term` variable must be sanitized before building the tsquery string.** Strip characters that `to_tsquery` would reject (parentheses, `|`, `&`, `!`, `<`, `>`). Use: `query.trim().replace(/[|&!<>()]/g, ' ').replace(/\s+/g, ' ').split(' ').filter(Boolean).map(w => \`${w}:*\`).join(' & ')`.

**Empty query guard:** If `term` is empty (user typed only special chars), return `{ posts: [], snippets: [] }` immediately — do not call `to_tsquery('')` which throws.

### Pattern 3: Cmd+K Global Search Modal

**What:** A `'use client'` React component listening for `keydown` events on `document`, rendered inside `WorkspaceNav` (which is already in the workspace layout used by all workspace pages).

**When to use:** Always — global keyboard shortcuts in Next.js App Router must live in a client component with `useEffect`.

**Component pattern:**

```tsx
// Source: React/Next.js event listener best practices
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function SearchModal({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/workspaces/${slug}/search?q=${encodeURIComponent(query)}`,
          { credentials: 'include' }
        );
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(t);
  }, [query, slug]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 100,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '560px', maxWidth: '90vw',
          background: 'white', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 101, overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search posts and snippets..."
          style={{
            width: '100%', padding: '1rem 1.25rem',
            border: 'none', outline: 'none',
            fontSize: '15px', borderBottom: '1px solid #e5e7eb',
            boxSizing: 'border-box',
          }}
        />
        <SearchResults results={results} loading={loading} slug={slug} />
      </div>
    </>
  );
}
```

**Integration in WorkspaceNav:** `WorkspaceNav.tsx` already receives `slug` as a prop. Add `<SearchModal slug={slug} />` inside the nav's JSX (it renders conditionally, hidden until triggered).

**Backdrop click-to-close:** A fixed `<div>` overlay behind the modal captures clicks and calls `setOpen(false)`.

### Anti-Patterns to Avoid

- **Using `GENERATED ALWAYS AS` computed column in Prisma:** Causes `DROP DEFAULT` spurious migration on every subsequent `migrate dev`. Use trigger instead.
- **Adding `@@index([searchVector], type: Gin)` to Prisma schema:** Causes Prisma to regenerate the GIN index on every migration run. Keep the GIN index in the manually-written SQL migration only.
- **Calling `to_tsquery` with unsanitized user input:** Characters like `(`, `)`, `|`, `&` cause Postgres to throw `syntax error in tsquery`. Strip them before building the term string.
- **Calling `to_tsquery('')`:** Empty string throws a Postgres error. Guard with `if (!term) return { posts: [], snippets: [] }`.
- **Using `websearch_to_tsquery` for prefix matching:** This function does not support the `:*` operator. SRCH-01 requires prefix matching; use `to_tsquery` with manually appended `:*`.
- **Attaching keydown listener in a Server Component:** Next.js 15 Server Components cannot use `useEffect`. The `SearchModal` must be `'use client'`.
- **Not binding `$queryRaw` to `this.client`:** Without `.bind(this.client)`, the tagged template literal loses the `this` context and throws.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text tokenization + stemming | Custom tokenizer | `to_tsvector('english', ...)` | Handles stop words, stemming, position weighting; battle-tested |
| Result highlighting | String search + substring replace | `ts_headline()` | Handles overlapping matches, multiple fragments, option configuration |
| GIN index maintenance | Application-level index update | PostgreSQL trigger | Triggers fire inside the transaction, atomically, even on bulk imports |
| SQL injection prevention | Manual escaping | `Prisma.sql` tagged template | Prisma automatically parameterizes all interpolated values |

**Key insight:** All FTS primitives (tokenize, index, search, rank, highlight) are built into Postgres. The only "custom" code is the trigger function and the $queryRaw service method.

---

## Common Pitfalls

### Pitfall 1: Migration Drift from GIN Index in Prisma Schema

**What goes wrong:** Developer adds `@@index([searchVector], type: Gin)` to the Prisma schema. Every subsequent `prisma migrate dev` generates a new migration that drops and recreates the GIN index, even with no schema changes. This violates the success criterion "three consecutive runs generate zero new migration files."

**Why it happens:** Prisma's schema diff reads the GIN index with an `ops: raw("")` annotation. Its diffing engine cannot reconcile this with the stored representation and always marks it as changed. (GitHub issue #16275, open since 2022.)

**How to avoid:** Create the GIN index ONLY in the manually-written migration SQL using `CREATE INDEX IF NOT EXISTS`. Do NOT add it to the Prisma schema at all. Declare the column as `searchVector Unsupported("tsvector")?` — this makes Prisma treat it as opaque.

**Warning signs:** Run `prisma migrate dev` twice in a row. If a new migration file is generated with `DROP INDEX` + `CREATE INDEX` statements, you have this problem.

### Pitfall 2: Empty / Malformed tsquery from User Input

**What goes wrong:** User types `react (hooks)` or `auth||jwt`. `to_tsquery('english', 'react:* (hooks):*')` throws `ERROR: syntax error in tsquery: "(hooks)"`. The API returns 500 instead of empty results.

**Why it happens:** `to_tsquery` is strict about syntax. Parentheses, `|`, `&`, `!` have special meaning and must be used correctly. Raw user input will not satisfy this.

**How to avoid:** Sanitize before building the term string:
```typescript
const clean = query.trim()
  .replace(/[|&!<>()'":]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
if (!clean) return { posts: [], snippets: [] };
const term = clean.split(' ').map(w => `${w}:*`).join(' & ');
```

**Warning signs:** Any search input containing `(`, `)`, `|`, `&`, `!` results in 500 error from the API.

### Pitfall 3: Backfill Missed for Existing Rows

**What goes wrong:** Migration adds the column and trigger but forgets the `UPDATE ... SET searchVector = ...` backfill. All rows created before the migration have `searchVector = NULL`. The GIN index skips NULL values. Searches against existing content return zero results.

**Why it happens:** The trigger only fires on INSERT/UPDATE. Existing rows are untouched by the trigger.

**How to avoid:** The migration SQL MUST include `UPDATE "Post" SET "searchVector" = ...` and `UPDATE "Snippet" SET "searchVector" = ...` after the trigger is created.

**Warning signs:** Search returns zero results for a query that should match existing content. Creating a new post/snippet and searching for it returns a result, but searching for old content does not.

### Pitfall 4: PrismaService Missing $queryRaw Delegation

**What goes wrong:** `SearchService` calls `this.prisma.$queryRaw\`...\`` but `PrismaService` does not expose this method. TypeScript compile error or runtime `TypeError: this.prisma.$queryRaw is not a function`.

**Why it happens:** The existing `PrismaService` implementation uses property getters for each model. It does not inherit from `PrismaClient` and does not delegate `$queryRaw`. (Confirmed by inspection of `apps/devcollab-api/src/core/database/prisma.service.ts`.)

**How to avoid:** Add `$queryRaw` and `$executeRaw` delegation getters to `PrismaService` before writing `SearchService`.

**Warning signs:** TypeScript error `Property '$queryRaw' does not exist on type 'PrismaService'` during compile.

### Pitfall 5: Browser Default Behavior for Ctrl+K

**What goes wrong:** On Firefox/Chrome, `Ctrl+K` focuses the browser's address bar/search bar. The modal opens but focus immediately moves away from the search input, and users cannot type.

**Why it happens:** Some browsers intercept `Ctrl+K` before the `keydown` event reaches JavaScript. `e.preventDefault()` in the handler prevents the default only if the browser allows it.

**How to avoid:** Call `e.preventDefault()` in the keydown handler. This works in most browsers for `Ctrl+K` (the browser address bar shortcut is typically `Ctrl+L`, not `Ctrl+K`). After the modal opens, `setTimeout(() => inputRef.current?.focus(), 0)` ensures focus lands in the search input even if the event bubbles oddly.

**Warning signs:** Modal opens but user cannot type into the search field. Address bar steals focus.

### Pitfall 6: Search Endpoint Needs @CheckAbility

**What goes wrong:** NestJS app uses deny-by-default `CaslAuthGuard` globally. Any endpoint without `@CheckAbility(...)` throws `ForbiddenException: Endpoint must declare @CheckAbility`. A search controller missing this decorator will always return 403.

**Why it happens:** Global guard at APP_GUARD level (confirmed in `app.module.ts`).

**How to avoid:** Add `@CheckAbility('read', 'Post')` to the search controller's GET handler (reading posts/snippets in a workspace requires `read` on Post/Snippet; `read` on Post is sufficient as the query also reads Snippets with the same intent).

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### PrismaService $queryRaw Delegation

```typescript
// Source: apps/devcollab-api/src/core/database/prisma.service.ts — add these getters
// Binds are required: tagged template literals use 'this' context of the client

get $queryRaw() {
  return this.client.$queryRaw.bind(this.client);
}

get $executeRaw() {
  return this.client.$executeRaw.bind(this.client);
}
```

### Search Service Skeleton

```typescript
// Source: NestJS module pattern from existing services (posts.service.ts, notifications.service.ts)
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@devcollab/database';
import { PrismaService } from '../core/database/prisma.service';

type PostSearchResult = {
  id: string; title: string; status: string; createdAt: Date;
  authorId: string; workspaceId: string; headline: string;
};
type SnippetSearchResult = {
  id: string; title: string; language: string; createdAt: Date;
  authorId: string; workspaceId: string; headline: string;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(slug: string, rawQuery: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug }, select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const clean = rawQuery.trim()
      .replace(/[|&!<>()'":]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return { posts: [], snippets: [] };

    const term = clean.split(' ')
      .filter(Boolean)
      .map(w => `${w}:*`)
      .join(' & ');

    const workspaceId = workspace.id;

    const [posts, snippets] = await Promise.all([
      this.prisma.$queryRaw<PostSearchResult[]>(Prisma.sql`
        SELECT p.id, p.title, p.status, p."createdAt", p."authorId", p."workspaceId",
          ts_headline('english', p.title || ' ' || p.content,
            to_tsquery('english', ${term}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5, MaxFragments=2'
          ) AS headline
        FROM "Post" p
        WHERE p."workspaceId" = ${workspaceId}
          AND p."searchVector" @@ to_tsquery('english', ${term})
        ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${term})) DESC
        LIMIT 10
      `),
      this.prisma.$queryRaw<SnippetSearchResult[]>(Prisma.sql`
        SELECT s.id, s.title, s.language, s."createdAt", s."authorId", s."workspaceId",
          ts_headline('english', s.title || ' ' || s.code,
            to_tsquery('english', ${term}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5, MaxFragments=2'
          ) AS headline
        FROM "Snippet" s
        WHERE s."workspaceId" = ${workspaceId}
          AND s."searchVector" @@ to_tsquery('english', ${term})
        ORDER BY ts_rank(s."searchVector", to_tsquery('english', ${term})) DESC
        LIMIT 10
      `),
    ]);

    return { posts, snippets };
  }
}
```

### Search Controller Skeleton

```typescript
// Source: NestJS controller pattern from posts.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('workspaces/:slug/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @CheckAbility('read', 'Post')
  @Get()
  search(
    @Param('slug') slug: string,
    @Query('q') q: string = '',
  ) {
    return this.searchService.search(slug, q);
  }
}
```

### ts_headline Result Rendering (Frontend)

```tsx
// Source: React dangerouslySetInnerHTML pattern; ts_headline output is safe
// (only wraps our own stored text in known <mark> tags)
function HighlightedText({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontSize: '13px', color: '#374151' }}
    />
  );
}
```

**Note on XSS:** `ts_headline` output wraps tokens from our own stored text (not user-supplied HTML). The `StartSel`/`StopSel` are `<mark>` and `</mark>` which are safe. This is low-risk, but if users could store arbitrary HTML in post content, the content should be stripped before being passed to `ts_headline`. Current posts use `content TEXT` (plain text/markdown), so the risk is acceptable.

### Keyboard Shortcut — Key Detection

```typescript
// Source: MDN KeyboardEvent documentation
const handler = (e: KeyboardEvent) => {
  // metaKey = Cmd on Mac; ctrlKey = Ctrl on Windows/Linux
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();  // Prevents browser address bar focus (Ctrl+K in some browsers)
    setOpen(prev => !prev);
  }
  if (e.key === 'Escape') {
    setOpen(false);
  }
};
document.addEventListener('keydown', handler);
return () => document.removeEventListener('keydown', handler);  // Cleanup on unmount
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tsvector` as `GENERATED ALWAYS AS ... STORED` | Trigger-based `tsvector` column | Prisma issue #16275 (2022) and #24180 (2024) confirmed no fix | Generated column causes perpetual migration drift; trigger avoids it |
| External search service (Elasticsearch, Meilisearch) | Postgres tsvector for portfolio-scale apps | Ongoing; "right-size" tooling principle | No extra Docker service; Postgres handles ~100K rows at sub-10ms |
| `@@index([searchVector], type: Gin)` in schema | GIN index in manual migration SQL only | Prisma issue #16275 | Schema-managed GIN index drifts; manual SQL GIN is stable |
| `cmdk` library for search modals | Plain `useEffect` + keydown listener | This project uses no UI framework | Matches existing component patterns; zero dependencies added |

**Deprecated/outdated:**
- `pg_trgm` trigram indexes: Still valid for fuzzy/ILIKE search, but not needed here; tsvector prefix matching covers the SRCH-01 requirement.
- Prisma native `fullTextSearch` preview feature: Only usable with `@@index([field])` type Gin which drifts; still in preview as of Prisma 5.22.0; not reliable for production.

---

## Open Questions

1. **ts_headline on large `code` fields in Snippets**
   - What we know: `Snippet.code` can be large (multi-KB); `ts_headline` with `HighlightAll=true` would return the entire code body
   - What's unclear: Is a 20-word fragment from code meaningful to users, or would showing the title headline be sufficient for snippets?
   - Recommendation: Use `MaxFragments=2, MaxWords=30` for snippets and render only the headline (not full code) in search results. Full code is shown on the snippet detail page.

2. **Post status filtering in search**
   - What we know: Posts have Draft/Published status; `posts.service.ts` shows authors see their own drafts, others see only Published
   - What's unclear: Should search respect this access rule (Authors see own Drafts in search)?
   - Recommendation: Mirror the existing rule: `AND (p.status = 'Published' OR p."authorId" = ${userId})`. Pass `userId` from `@CurrentUser()` to `SearchService.search()`.

3. **Search results link to post/snippet pages**
   - What we know: Frontend search results need href links; post URL pattern is `/w/${slug}/posts/${id}`, snippet is `/w/${slug}/snippets/${id}`
   - What's unclear: No ambiguity here, but needs to be confirmed in SearchResults component
   - Recommendation: Construct links from `slug` (passed as prop to SearchModal) + `result.id`.

---

## Sources

### Primary (HIGH confidence)
- PostgreSQL 18 Docs — Text Search Controls (to_tsquery, websearch_to_tsquery, ts_headline): https://www.postgresql.org/docs/current/textsearch-controls.html
- PostgreSQL 18 Docs — Text Search Tables and Indexes: https://www.postgresql.org/docs/current/textsearch-tables.html
- PostgreSQL 18 Docs — Preferred Index Types for Text Search (GIN recommendation): https://www.postgresql.org/docs/current/textsearch-indexes.html
- PostgreSQL 18 Docs — Text Search Types (tsvector, tsquery, :* prefix operator): https://www.postgresql.org/docs/current/datatype-textsearch.html
- Prisma Docs — Customizing Migrations (--create-only, manual SQL): https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations
- Prisma Docs — Unsupported Database Features: https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features
- Codebase inspection: `apps/devcollab-api/src/core/database/prisma.service.ts` — no $queryRaw exposed
- Codebase inspection: `apps/devcollab-api/src/app.module.ts` — CaslAuthGuard global, deny-by-default
- Codebase inspection: `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` — ability Subject types
- Codebase inspection: `packages/devcollab-database/prisma/schema.prisma` — Post/Snippet column names
- Codebase inspection: `packages/devcollab-database/package.json` — Prisma 5.22.0

### Secondary (MEDIUM confidence)
- GitHub Prisma issue #16275 — GIN index drop-and-recreate on every migration (confirmed behavior): https://github.com/prisma/prisma/issues/16275
- GitHub Prisma issue #24180 — Custom migration SQL removed on next migrate dev run: https://github.com/prisma/prisma/issues/24180
- Pedro Alonso blog — PostgreSQL FTS with Prisma, $queryRaw + ts_headline pattern: https://www.pedroalonso.net/blog/postgres-full-text-search/
- Michael Svanstrom blog — tsvector + Unsupported() + $queryRaw in Prisma (2024): https://www.svanstrom.nu/2024/03/05/postgresql-full-text-search-with-prisma/
- Thoughtbot blog — tsvector column + trigger pattern: https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers

### Tertiary (LOW confidence)
- Medium article on "Bulletproof FTS in Prisma without migration drift" (paywalled, only summary available): https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — PostgreSQL, Prisma 5.22.0 confirmed; all functions are native to Postgres 16
- Architecture (trigger pattern): HIGH — confirmed by two Prisma GitHub issues + official Prisma "unsupported features" docs
- Architecture (search query): HIGH — $queryRaw pattern confirmed; Prisma.sql sanitization confirmed
- Architecture (frontend Cmd+K): HIGH — standard React useEffect keydown pattern; no library needed
- Pitfalls: HIGH — GIN drift confirmed by GitHub issue; others derived from official Postgres docs + codebase inspection
- PrismaService $queryRaw gap: HIGH — confirmed by reading the actual source file

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (Prisma 5.x stable; PostgreSQL FTS API is stable)
