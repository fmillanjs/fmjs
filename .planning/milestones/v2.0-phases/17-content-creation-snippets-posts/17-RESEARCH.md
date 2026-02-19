# Phase 17: Content Creation — Snippets + Posts — Research

**Researched:** 2026-02-17
**Domain:** Shiki SSR syntax highlighting, Tiptap editor SSR, NestJS CRUD with CASL owner-scoped RBAC, Prisma schema extension
**Confidence:** HIGH (core technical findings verified via official docs and Context7)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SNIP-01 | User can create a code snippet (title, language, code body) | NestJS SnippetController + Prisma Snippet model + React form pattern |
| SNIP-02 | Snippet displays with Shiki syntax highlighting and language selector | Shiki `codeToHtml` in async Server Component; language stored on model |
| SNIP-03 | User can copy snippet code with a copy button | `'use client'` CopyButton component with `navigator.clipboard.writeText` nested inside Server Component |
| SNIP-04 | User can edit and delete own snippet | PATCH/DELETE endpoints with CASL `{ authorId: user.id }` condition guard |
| SNIP-05 | Each snippet has a shareable URL (`/w/:slug/snippets/:id`) | Next.js dynamic route `app/w/[slug]/snippets/[id]/page.tsx`, public to any workspace member |
| POST-01 | User can create a Markdown post using a write/preview split-pane editor | Tiptap with `immediatelyRender: false` in `'use client'` component + `react-markdown` preview pane |
| POST-02 | User can save post as draft or publish it | Prisma `PostStatus` enum (Draft/Published); PATCH endpoint toggles status |
| POST-03 | User can edit and delete own post | PATCH/DELETE endpoints with CASL owner condition, same pattern as snippets |
| RBAC-02 | Contributor can create and edit own snippets, posts, and comments | CASL `can('create'/'update'/'delete', 'Snippet'/'Post', { authorId: user.id })` in WorkspaceAbilityFactory |
| RBAC-03 | Viewer can read all workspace content but cannot create or edit | Already defined in WorkspaceAbilityFactory; guard enforces 403 on mutation endpoints |
</phase_requirements>

---

## Summary

Phase 17 adds two first-class content types — Snippets and Posts — to the existing workspace infrastructure from Phase 16. The critical technical challenge is the **Shiki + Tiptap SSR compatibility story**: Shiki must render zero-client-JS syntax highlighting via React Server Components, while Tiptap (which only runs on the client) must be isolated in `'use client'` components with `immediatelyRender: false` to prevent React hydration errors and the "Duplicate extension names" console warning.

The existing NestJS RBAC infrastructure (CASL `WorkspaceAbilityFactory`, `CaslAuthGuard`, `@CheckAbility` decorator) is already wired to accept `'Post'` and `'Snippet'` subjects — they are already declared in the `Subject` type union and in the Contributor/Viewer ability rules. Phase 17 must extend the ability rules to add owner-scoped conditions (`{ authorId: user.id }`) so that contributors can only edit/delete their own content while admins manage all. The Prisma schema needs two new models (`Snippet`, `Post`) with `authorId`, `workspaceId`, and for Post: a `status` enum (`Draft`/`Published`).

The Markdown post preview pane should use `react-markdown` with `rehype-pretty-code` (Shiki-powered) so that code fences in post previews also get syntax highlighted server-side. Tiptap is used only for the write pane (rich-text input), not for rendering published posts — published post content is rendered as Markdown via `react-markdown` in a Server Component.

**Primary recommendation:** Use Shiki `codeToHtml` in async Server Components for all displayed code; use Tiptap `useEditor({ immediatelyRender: false })` in a `'use client'` editor component with `StarterKit.configure({ codeBlock: false })` + separate `CodeBlockLowlight` to eliminate the duplicate extension name warning.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | ^1.x | Server-side syntax highlighting, zero client JS | Official Shiki docs recommend for Next.js App Router; `codeToHtml` is async-safe |
| @tiptap/react | ^2.x | Rich-text write pane for Markdown posts | Official Tiptap Next.js guide; only runs client-side with `immediatelyRender: false` |
| @tiptap/pm | ^2.x | ProseMirror peer dependency for Tiptap | Required by Tiptap |
| @tiptap/starter-kit | ^2.x | Tiptap batteries (Bold, Italic, Headings, etc.) | Standard Tiptap setup; configure `codeBlock: false` to avoid duplicate warning |
| @tiptap/extension-code-block-lowlight | ^2.x | Code block with lowlight syntax highlighting inside editor | Replaces built-in CodeBlock; use with `StarterKit.configure({ codeBlock: false })` |
| lowlight | ^3.x | highlight.js wrapper for Tiptap CodeBlockLowlight | Peer dependency of extension-code-block-lowlight |
| react-markdown | ^9.x | Render Markdown in post preview and published post view | Composable remark/rehype pipeline; works in Server Components |
| rehype-pretty-code | ^0.14.x | Shiki-powered rehype plugin for code fences in react-markdown | Works server-side, Shiki v1 compatible |
| remark-gfm | ^4.x | GitHub Flavored Markdown (tables, task lists, strikethrough) | Standard addition to react-markdown |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hast-util-to-jsx-runtime | ^2.x | Convert Shiki HAST to React elements with custom pre/code | When custom CopyButton wrapper around Server Component highlight needed |
| @nestjs/common (existing) | ^11.x | NestJS controllers, services, DTOs | Already installed |
| @casl/ability (existing) | ^6.8.x | CASL rules with conditions for owner-only enforcement | Already installed; extend WorkspaceAbilityFactory |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown + rehype-pretty-code | @uiw/react-md-editor | react-md-editor is all-client-side; breaks SSR requirement |
| Tiptap with `immediatelyRender: false` | Lexical (Meta) | Lexical has less Next.js SSR documentation; Tiptap has official guide |
| Tiptap `CodeBlockLowlight` | Tiptap `CodeBlock` + custom highlight | CodeBlock name collision with StarterKit causes duplicate warning |
| lowlight + CodeBlockLowlight | Shiki inside Tiptap | Shiki in Tiptap is complex; lowlight is the documented pairing |

**Installation (web app):**
```bash
npm install --workspace=apps/devcollab-web shiki react-markdown rehype-pretty-code remark-gfm @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block-lowlight lowlight
```

**Installation (no API changes needed for packages — only schema + controllers):**
```bash
# In devcollab-api directory — no new npm packages required
# Prisma schema extension + npx prisma migrate dev
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/devcollab-web/app/w/[slug]/
├── snippets/
│   ├── page.tsx                    # Server Component: list snippets for workspace
│   ├── new/
│   │   └── page.tsx                # Client form to create snippet
│   └── [id]/
│       ├── page.tsx                # Server Component: display snippet with Shiki
│       └── edit/
│           └── page.tsx            # Client form to edit snippet
└── posts/
    ├── page.tsx                    # Server Component: list posts (only Published visible to non-authors)
    ├── new/
    │   └── page.tsx                # Client editor (Tiptap write pane)
    └── [id]/
        ├── page.tsx                # Server Component: render published post with react-markdown
        └── edit/
            └── page.tsx            # Client editor (Tiptap write pane, pre-filled)

apps/devcollab-web/components/
├── snippet/
│   ├── SnippetCodeBlock.tsx        # async Server Component: Shiki highlight + renders CopyButton
│   ├── CopyButton.tsx              # 'use client': navigator.clipboard.writeText
│   └── LanguageSelector.tsx        # 'use client': controlled select for language picker
├── post/
│   ├── PostEditor.tsx              # 'use client': Tiptap write/preview split pane
│   └── MarkdownPreview.tsx         # Server Component or client: react-markdown + rehype-pretty-code

apps/devcollab-api/src/
├── snippets/
│   ├── snippets.module.ts
│   ├── snippets.controller.ts      # @Controller('workspaces/:slug/snippets')
│   ├── snippets.service.ts
│   └── dto/
│       ├── create-snippet.dto.ts
│       └── update-snippet.dto.ts
└── posts/
    ├── posts.module.ts
    ├── posts.controller.ts         # @Controller('workspaces/:slug/posts')
    ├── posts.service.ts
    └── dto/
        ├── create-post.dto.ts
        └── update-post.dto.ts

packages/devcollab-database/prisma/
└── schema.prisma                   # Add Snippet + Post models + PostStatus enum
```

### Pattern 1: Shiki Server Component with Client CopyButton

**What:** Async Server Component calls `codeToHtml()` server-side; wraps result in a relative container with a nested `CopyButton` (client component) that receives the raw code as a prop.

**When to use:** Every snippet detail page and every code fence in a published post view.

**Example:**
```typescript
// Source: https://shiki.style/packages/next (official docs)
// apps/devcollab-web/components/snippet/SnippetCodeBlock.tsx
import { codeToHtml, BundledLanguage } from 'shiki';
import CopyButton from './CopyButton';

interface Props {
  code: string;
  lang: BundledLanguage;
}

export default async function SnippetCodeBlock({ code, lang }: Props) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'github-dark', // or 'github-light' for light mode
  });

  return (
    <div style={{ position: 'relative' }}>
      <CopyButton code={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
```

```typescript
// apps/devcollab-web/components/snippet/CopyButton.tsx
'use client';
import { useState } from 'react';

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} style={{ position: 'absolute', top: 8, right: 8 }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

### Pattern 2: Tiptap Write/Preview Split Pane (Post Editor)

**What:** Client component with two panes — left is Tiptap editor (rich text input), right is a live `react-markdown` preview rendered inline on every content change. The key SSR fix is `immediatelyRender: false`.

**When to use:** Create and Edit pages for Posts.

**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/nextjs
// apps/devcollab-web/components/post/PostEditor.tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

const lowlight = createLowlight(common);

export default function PostEditor({
  initialContent = '',
  onSave,
}: {
  initialContent?: string;
  onSave: (content: string, status: 'Draft' | 'Published') => Promise<void>;
}) {
  const [preview, setPreview] = useState(initialContent);

  const editor = useEditor({
    extensions: [
      // CRITICAL: codeBlock: false prevents "Duplicate extension names" warning
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent,
    // CRITICAL: prevents React hydration error in Next.js SSR
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setPreview(editor.storage.markdown?.getMarkdown() ?? editor.getText());
    },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div>
        <h3>Write</h3>
        <EditorContent editor={editor} />
      </div>
      <div>
        <h3>Preview</h3>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {preview}
        </ReactMarkdown>
      </div>
    </div>
  );
}
```

**Note on Tiptap Markdown output:** Tiptap does not produce Markdown by default — it produces HTML. To get Markdown content from the editor for storage, install `@tiptap/extension-markdown` or store the editor HTML and render it with a server-side converter. The simpler approach for this phase: store the editor's raw text content (Markdown entered by user via typed fences) and render it with `react-markdown` for preview. Alternatively, use a plain `<textarea>` for Markdown input + `react-markdown` preview, bypassing Tiptap's rich-text for Markdown posts.

**Recommended simplification:** Since the requirement is a write/preview split pane for Markdown, a `<textarea>` for input + `react-markdown` for preview is more SSR-safe and avoids Tiptap entirely for this content type. Tiptap is for rich-text (HTML-producing) editors, not Markdown editors. See Pattern 4.

### Pattern 3: NestJS Nested Route Controller for Content Types

**What:** New NestJS modules for snippets and posts, nested under the workspace slug route, following the same `@CheckAbility` guard pattern as `WorkspacesController`.

**When to use:** All snippet and post CRUD endpoints.

**Example:**
```typescript
// Source: NestJS docs https://docs.nestjs.com/recipes/router-module
// apps/devcollab-api/src/snippets/snippets.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { SnippetsService } from './snippets.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';

@Controller('workspaces/:slug/snippets')
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @CheckAbility('create', 'Snippet')
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateSnippetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.create(slug, dto, user.sub);
  }

  @CheckAbility('read', 'Snippet')
  @Get()
  findAll(@Param('slug') slug: string) {
    return this.snippetsService.findAll(slug);
  }

  @CheckAbility('read', 'Snippet')
  @Get(':id')
  findOne(@Param('slug') slug: string, @Param('id') id: string) {
    return this.snippetsService.findOne(slug, id);
  }

  // Update/delete: service layer checks authorId === current user OR Admin role
  @CheckAbility('update', 'Snippet')
  @Patch(':id')
  update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateSnippetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.update(slug, id, dto, user.sub);
  }

  @CheckAbility('delete', 'Snippet')
  @Delete(':id')
  remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.remove(slug, id, user.sub);
  }
}
```

### Pattern 4: Markdown Write/Preview (Textarea + react-markdown, SSR-safe)

**What:** Simple `<textarea>` for user Markdown input, `react-markdown` for live preview. No Tiptap. This avoids all SSR hydration complexity for the Markdown post editor. Requirement POST-01 says "write/preview split-pane editor" — this satisfies it without the Tiptap hydration risk.

**When to use:** Post creation and editing (recommended over Tiptap for Markdown posts).

**Example:**
```typescript
// apps/devcollab-web/components/post/PostEditor.tsx
'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PostEditor({
  initialContent = '',
  onSave,
}: {
  initialContent?: string;
  onSave: (content: string, status: 'Draft' | 'Published') => Promise<void>;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '70vh' }}>
      <div>
        <h3>Write</h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ width: '100%', height: '100%', fontFamily: 'monospace', resize: 'none' }}
        />
      </div>
      <div>
        <h3>Preview</h3>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
        <button onClick={() => onSave(content, 'Draft')}>Save as Draft</button>
        <button onClick={() => onSave(content, 'Published')}>Publish</button>
      </div>
    </div>
  );
}
```

**Note:** If Tiptap is still desired, use it only for rich-text/HTML-producing posts (not Markdown). For Markdown posts: textarea + react-markdown is the production-safe choice. The success criterion says "write/preview split-pane editor" and "preview renders Shiki-highlighted code fences" — the code fence highlighting in preview is handled by `rehype-pretty-code` plugin on the `ReactMarkdown` component.

**For Shiki-highlighted code fences in react-markdown preview (client-side):** Because `rehype-pretty-code` is async/server-oriented, in a client component use `react-syntax-highlighter` or a custom rehype visitor. For server-rendered published post views, use `rehype-pretty-code` in a Server Component. For live preview in the editor, basic `react-syntax-highlighter` is the practical choice.

### Pattern 5: Prisma Schema Extension

**What:** Add `Snippet` and `Post` models to `packages/devcollab-database/prisma/schema.prisma`.

**Example:**
```prisma
// Source: Standard Prisma patterns — https://www.prisma.io/docs/orm/prisma-schema/overview
enum PostStatus {
  Draft
  Published
}

model Snippet {
  id          String   @id @default(cuid())
  title       String
  language    String   // Shiki BundledLanguage value (e.g. "typescript")
  code        String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  authorId    String
  workspaceId String

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([authorId])
}

model Post {
  id          String     @id @default(cuid())
  title       String
  content     String     @db.Text   // Markdown source
  status      PostStatus @default(Draft)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  authorId    String
  workspaceId String

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, status])
  @@index([authorId])
}
```

**After schema change:**
1. `cd packages/devcollab-database && npx prisma migrate dev --name add-snippet-post`
2. Expose new models in `PrismaService` getters (`get snippet()`, `get post()`)
3. Update `User` and `Workspace` models to add relation arrays back-references

### Pattern 6: CASL Owner-Scoped Conditions (WorkspaceAbilityFactory Extension)

**What:** The existing `WorkspaceAbilityFactory` already declares Contributor rights to create/update/delete Post and Snippet, but does NOT scope to `{ authorId: user.id }`. Phase 17 must add this condition so Contributors cannot edit others' content.

**Critical note from existing code comment:**
> NOTE: 'own content only' (authorId condition) is Phase 17 scope — requires authorId on Post/Snippet/Comment Prisma models.

The guard (`CaslAuthGuard`) does an ability check at the route level using only the subject type, not instance. Owner-scoped enforcement must happen in the **service layer** (fetch resource, check `resource.authorId === userId || role === 'Admin'`), because CASL instance conditions require loading the record first.

**Service-layer owner check pattern:**
```typescript
// In snippets.service.ts update/delete methods
async update(slug: string, id: string, dto: UpdateSnippetDto, requesterId: string) {
  const snippet = await this.prisma.snippet.findUnique({ where: { id } });
  if (!snippet) throw new NotFoundException('Snippet not found');

  // Fetch requester's role in workspace
  const workspace = await this.prisma.workspace.findUnique({ where: { slug }, select: { id: true } });
  const membership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace!.id } },
    select: { role: true },
  });

  if (snippet.authorId !== requesterId && membership?.role !== 'Admin') {
    throw new ForbiddenException('You can only edit your own snippets');
  }

  return this.prisma.snippet.update({ where: { id }, data: dto });
}
```

### Anti-Patterns to Avoid

- **Using Tiptap in a Server Component:** Tiptap uses `window` and browser APIs — it will throw during Next.js SSR. Always wrap in `'use client'` + `dynamic(() => import(...), { ssr: false })` if needed.
- **Not setting `immediatelyRender: false`:** Omitting this causes React hydration errors in production builds. The success criterion explicitly requires zero hydration errors.
- **Including `CodeBlockLowlight` alongside `StarterKit` without disabling the built-in `codeBlock`:** Causes "Duplicate extension names found: ['codeblock']" warning. Use `StarterKit.configure({ codeBlock: false })`.
- **Calling `codeToHtml` in a client component:** Shiki v1's `codeToHtml` can work client-side but ships the full grammar/WASM bundle. Always call it in a Server Component to get zero client JS.
- **Storing Tiptap HTML content as Markdown:** Tiptap outputs HTML by default, not Markdown. Either store HTML and render it with `dangerouslySetInnerHTML` (with sanitization), or use `@tiptap/extension-markdown` to get Markdown output, or use a plain textarea for Markdown input.
- **Using `@Controller('workspaces')` with nested slug routes without registering the module in AppModule:** New `SnippetsModule` and `PostsModule` must be imported into `AppModule`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom regex tokenizer | Shiki `codeToHtml` | Shiki covers 100+ languages with TextMate grammars; custom tokenizers miss edge cases |
| Markdown rendering | Custom HTML string parser | react-markdown + remark-gfm | XSS risks, table/task list edge cases, GFM extensions |
| Code fence highlighting in Markdown preview | Manual regex replace | rehype-pretty-code (server) or react-syntax-highlighter (client preview) | Language detection, theme consistency, edge cases |
| Clipboard copy | Custom execCommand | `navigator.clipboard.writeText` | execCommand is deprecated; Clipboard API is the standard |
| RBAC owner check | Custom middleware | Service-layer check after CASL route guard | CASL instance conditions need the record loaded first; service layer already has DB access |
| Rich text editor | Custom contenteditable | Tiptap + StarterKit | ProseMirror schema, undo/redo, keyboard shortcuts, accessibility — months of work |

**Key insight:** The Shiki + react-markdown + Tiptap combination covers every rendering need. Do not mix multiple syntax highlighting libraries (e.g., Prism + Shiki) — pick one (Shiki) and use it consistently.

---

## Common Pitfalls

### Pitfall 1: Tiptap "Duplicate extension names" in production build

**What goes wrong:** Browser console shows `"Duplicate extension names found: ['codeblock']"` in production. This fails the success criterion requiring zero such warnings before merge.

**Why it happens:** `StarterKit` includes a built-in `CodeBlock` extension. `CodeBlockLowlight` is also named `codeBlock` internally. When both are present, Tiptap detects the name collision.

**How to avoid:** Pass `codeBlock: false` to `StarterKit.configure()` and add `CodeBlockLowlight` separately.
```typescript
StarterKit.configure({ codeBlock: false }),
CodeBlockLowlight.configure({ lowlight }),
```

**Warning signs:** Warning appears in browser DevTools console after `next build && next start`.

---

### Pitfall 2: React hydration error from Tiptap

**What goes wrong:** `"Hydration failed because the initial UI does not match what was rendered on the server"` error in browser console.

**Why it happens:** Tiptap's `useEditor` calls `window` APIs during initialization, causing server-rendered HTML to differ from client HTML.

**How to avoid:** Always use `immediatelyRender: false` in `useEditor`. If needed, also wrap the component with `next/dynamic` and `{ ssr: false }`.

**Warning signs:** Error appears in `next build && next start` (not just `next dev`). Must be verified against production build per success criterion.

---

### Pitfall 3: Shiki `codeToHtml` called in a client component

**What goes wrong:** Shiki ships WASM bundle to the browser; bundle size balloons; initial load slow.

**Why it happens:** Developer imports `codeToHtml` in a component without `'use client'` but the component tree renders client-side.

**How to avoid:** Only call `codeToHtml` in components that are `async` and do NOT have `'use client'` directive. These must be pure Server Components.

**Warning signs:** Browser network tab shows large `.wasm` files loaded on snippet/post pages.

---

### Pitfall 4: Prisma schema relations missing back-references

**What goes wrong:** `Prisma` migrate or generate fails with "Relation field X must have an opposite relation field" error.

**Why it happens:** Adding `Snippet` and `Post` models with `User` and `Workspace` foreign keys requires updating the `User` and `Workspace` models to declare the back-relations.

**How to avoid:** When adding `Snippet`, also add `snippets Snippet[]` to `User` and `Workspace`. Same for `Post`.

**Warning signs:** `npx prisma migrate dev` fails immediately after schema edit.

---

### Pitfall 5: Guard denies edit/delete for Contributors on others' content only at CASL level

**What goes wrong:** Contributor can edit another Contributor's snippet because the route-level CASL check only verifies "can update Snippet in this workspace" (role-level), not "owns this specific Snippet".

**Why it happens:** `CaslAuthGuard` does not load the specific resource to evaluate instance conditions — it evaluates subject type only (as confirmed by reading the guard source code).

**How to avoid:** Implement the owner check in the service layer after fetching the resource. The guard handles role-level access (Viewer=403, Admin/Contributor=pass through to service). The service handles instance-level ownership.

**Warning signs:** E2E test passes when Contributor A edits Contributor B's snippet.

---

### Pitfall 6: Next.js 15 params is a Promise

**What goes wrong:** Dynamic route pages try to access `params.slug` or `params.id` directly, causing runtime errors.

**Why it happens:** Next.js 15 changed route params to be a `Promise<{ slug: string }>`.

**How to avoid:** Always `const { slug } = await params` in async server page components. Already demonstrated in existing `/w/[slug]/page.tsx`.

**Warning signs:** TypeScript type error on `params.slug`.

---

## Code Examples

### Shiki Singleton for Performance (module-level cache)

```typescript
// Source: https://shiki.style/guide/best-performance
// apps/devcollab-web/lib/shiki.ts
import { createHighlighter, BundledLanguage, BundledTheme } from 'shiki';

// Singleton: expensive to create — reuse across requests
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['typescript', 'javascript', 'python', 'go', 'rust', 'html', 'css', 'json', 'bash', 'sql', 'text'],
    });
  }
  return highlighterPromise;
}

export async function highlight(code: string, lang: BundledLanguage, theme: BundledTheme = 'github-dark') {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, { lang, theme });
}
```

**Or simpler (shorthand, for small snippet counts):**
```typescript
// apps/devcollab-web/components/snippet/SnippetCodeBlock.tsx
import { codeToHtml } from 'shiki';
// codeToHtml uses internal singleton automatically
const html = await codeToHtml(code, { lang, theme: 'github-dark' });
```

### Supported Languages for Snippet Picker (common subset)

```typescript
// Source: https://shiki.style/languages (official — 100+ supported)
// Recommended common languages for the selector UI
export const SNIPPET_LANGUAGES = [
  'bash', 'c', 'cpp', 'css', 'go', 'html', 'java',
  'javascript', 'json', 'kotlin', 'markdown', 'php',
  'python', 'ruby', 'rust', 'sql', 'swift', 'text',
  'typescript', 'yaml',
] as const;

export type SnippetLanguage = typeof SNIPPET_LANGUAGES[number];
```

### Tiptap with immediatelyRender: false (production-safe)

```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/nextjs
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export default function RichTextEditor({ content = '' }: { content?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }), // prevents duplicate extension warning
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    immediatelyRender: false, // prevents hydration mismatch in Next.js SSR
  });

  return <EditorContent editor={editor} />;
}
```

### NestJS PrismaService extension for new models

```typescript
// apps/devcollab-api/src/core/database/prisma.service.ts — additional getters to add
get snippet() {
  return this.client.snippet;
}

get post() {
  return this.client.post;
}
```

### Post status toggle endpoint

```typescript
// In posts.service.ts
async setStatus(slug: string, id: string, status: PostStatus, requesterId: string) {
  const post = await this.prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundException('Post not found');

  const workspace = await this.prisma.workspace.findUnique({ where: { slug }, select: { id: true } });
  const membership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId: workspace!.id } },
    select: { role: true },
  });

  if (post.authorId !== requesterId && membership?.role !== 'Admin') {
    throw new ForbiddenException('You can only change status of your own posts');
  }

  return this.prisma.post.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'Published' ? new Date() : null,
    },
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| highlight.js / Prism client-side | Shiki server-side (`codeToHtml`) | Shiki v1, 2024 | Zero client JS for syntax highlighting |
| Plain textarea for code input | Shiki-highlighted display (read-only) | 2024 | Better UX; highlighting separate from editing |
| Tiptap without `immediatelyRender` | `immediatelyRender: false` required | Tiptap v2.1+, 2023 | Prevents hydration errors in Next.js |
| `StarterKit` + `CodeBlock` + `CodeBlockLowlight` | `StarterKit.configure({ codeBlock: false })` + `CodeBlockLowlight` | Tiptap v2.x | Eliminates duplicate extension name warning |
| `execCommand('copy')` | `navigator.clipboard.writeText()` | 2020+ | execCommand deprecated; Clipboard API is the standard |
| next/dynamic ssr:false for all editors | `immediatelyRender: false` + `'use client'` | 2023 | Simpler; no need for dynamic import in most cases |

**Deprecated/outdated:**
- `execCommand('copy')`: Use `navigator.clipboard.writeText` instead.
- `highlight.js` / `Prism` for SSR: Shiki is now the standard for zero-JS server-side highlighting.
- Tiptap v1 SSR patterns: v2 introduced `immediatelyRender` option as the official SSR solution.

---

## Open Questions

1. **Tiptap vs plain textarea for Markdown posts**
   - What we know: Tiptap produces HTML, not Markdown, by default. The requirement says "write/preview split-pane editor." A plain textarea for Markdown input is SSR-safe and simpler.
   - What's unclear: Whether the product needs rich-text formatting (bold/italic via toolbar) OR just a Markdown code input box.
   - Recommendation: Use plain textarea + react-markdown for Phase 17. Tiptap is optional and adds SSR risk. If Tiptap is used, it must be for the write side only, with content stored as HTML (not Markdown), and the preview rendered with `dangerouslySetInnerHTML` using a sanitizer like `dompurify` (client-only) or `sanitize-html` (server-safe).

2. **Shiki language list for the snippet language selector**
   - What we know: Shiki supports 100+ languages. The selector UI needs a curated subset.
   - What's unclear: Whether the planner wants all 100+ or just the common 20.
   - Recommendation: Use the `SNIPPET_LANGUAGES` array above (20 common languages). This can be extended later.

3. **Post visibility when listing — Draft posts**
   - What we know: Draft posts are "not visible to others." Published posts visible to all workspace members.
   - What's unclear: Whether Draft posts appear to the author in the list (logically yes) or only published posts.
   - Recommendation: List endpoint returns: to the author — all their posts (Draft + Published); to others — only Published posts. Filter in service: `{ workspaceId, OR: [{ status: 'Published' }, { authorId: requesterId }] }`.

4. **Code fence highlighting in the live Markdown preview pane**
   - What we know: `rehype-pretty-code` works best server-side. In a client component (`PostEditor`), server-side processing is not available for live preview.
   - What's unclear: Whether the requirement "preview renders Shiki-highlighted code fences" refers to the live preview pane or only the published post view.
   - Recommendation: For the published post view (Server Component) — use `rehype-pretty-code` with Shiki. For the live preview in the editor (client-side) — use `react-syntax-highlighter` (lighter, client-safe) or simply rely on basic code blocks without full Shiki highlighting. The success criterion mentions "preview renders Shiki-highlighted code fences" — clarify if this means the editor preview or just the final rendered post.

---

## Sources

### Primary (HIGH confidence)
- `https://shiki.style/packages/next` — Official Shiki Next.js integration guide; `codeToHtml` async Server Component pattern verified
- `https://shiki.style/guide/best-performance` — Singleton highlighter pattern verified from official Shiki docs
- `https://tiptap.dev/docs/editor/getting-started/install/nextjs` — Official Tiptap Next.js installation; `immediatelyRender: false` confirmed as official SSR fix
- `https://tiptap.dev/docs/editor/extensions/nodes/code-block-lowlight` — CodeBlockLowlight docs; StarterKit interaction confirmed
- Existing codebase analysis — `WorkspaceAbilityFactory`, `CaslAuthGuard`, `PrismaService`, `WorkspacesController` patterns confirmed via direct file reads

### Secondary (MEDIUM confidence)
- `https://rehype-pretty.pages.dev/` — rehype-pretty-code docs; Shiki v1 compatible, ESM-only, server-side confirmed
- `https://github.com/ueberdosis/tiptap/discussions/3030` — Community confirmation of "Duplicate extension names" root cause and `StarterKit.configure({ codeBlock: false })` fix
- `https://github.com/ueberdosis/tiptap/issues/5856` — Bug report + confirmed fix for `immediatelyRender: false` in Next.js production builds
- Multiple WebSearch results cross-verified for CASL owner-condition service-layer pattern

### Tertiary (LOW confidence — validate before implementing)
- `@tiptap/extension-markdown` for Markdown output from Tiptap — not verified via Context7; confirm package exists and is compatible with Tiptap v2 before using
- `react-syntax-highlighter` for live preview client-side code fences — mentioned in community discussions, not verified via official docs for this exact use case

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official Shiki docs, official Tiptap docs, existing codebase review
- Architecture: HIGH — patterns derived from existing NestJS module structure; consistent with Phase 16 patterns
- Pitfalls: HIGH — Tiptap SSR issues verified via GitHub issues + official docs; Shiki SSR verified via official docs; CASL owner-scoping noted in existing source code comments
- Open questions: MEDIUM — business logic questions (textarea vs Tiptap, preview fidelity) cannot be resolved from docs alone

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Shiki and Tiptap are active; check release notes for breaking changes beyond this date)
