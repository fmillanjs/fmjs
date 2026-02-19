---
phase: 17-content-creation-snippets-posts
plan: 03
subsystem: ui
tags: [shiki, next.js, react, syntax-highlighting, snippets]

# Dependency graph
requires:
  - phase: 17-02
    provides: SnippetsController CRUD API (POST/GET/PATCH/DELETE /workspaces/:slug/snippets)

provides:
  - Shiki singleton highlighter in lib/shiki.ts with getHighlighter, highlight, SNIPPET_LANGUAGES exports
  - SnippetCodeBlock async server component with server-side Shiki rendering + CopyButton
  - CopyButton client component using navigator.clipboard.writeText with Copied! 2s feedback
  - LanguageSelector client component controlled select over 20 languages
  - 4 snippet pages: list (/w/:slug/snippets), new, detail (Shiki-highlighted), edit with delete

affects:
  - 17-04 (plan 04 MarkdownRenderer rehype plugin imports getHighlighter from lib/shiki.ts)
  - 17-05 (post pages depend on snippet pattern established here)

# Tech tracking
tech-stack:
  added:
    - shiki (server-side syntax highlighting singleton)
    - react-markdown (markdown rendering for plan 17-04)
    - remark-gfm (GFM extension for react-markdown)
    - react-syntax-highlighter + @types/react-syntax-highlighter (fallback option, not used)
  patterns:
    - Shiki singleton via module-level promise — createHighlighter called once per process
    - async Server Component calling highlight() — zero Shiki JS shipped to browser
    - CopyButton is the only 'use client' in the rendering chain
    - Next.js 15 async params: `const { slug } = await params` in all server pages
    - Client pages use useParams() (no async needed)

key-files:
  created:
    - apps/devcollab-web/lib/shiki.ts
    - apps/devcollab-web/components/snippet/CopyButton.tsx
    - apps/devcollab-web/components/snippet/SnippetCodeBlock.tsx
    - apps/devcollab-web/components/snippet/LanguageSelector.tsx
    - apps/devcollab-web/app/w/[slug]/snippets/page.tsx
    - apps/devcollab-web/app/w/[slug]/snippets/new/page.tsx
    - apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx
    - apps/devcollab-web/app/w/[slug]/snippets/[id]/edit/page.tsx
  modified:
    - apps/devcollab-web/package.json (added shiki, react-markdown, remark-gfm, react-syntax-highlighter)
    - package.json (workspace dependency hoisting)
    - package-lock.json

key-decisions:
  - "shiki npm package hoisted to root node_modules via npm workspaces — accessible to devcollab-web without app-level node_modules entry"
  - "getHighlighter exported from lib/shiki.ts so plan 17-04 rehype plugin can call codeToHtml directly with custom options"
  - "LanguageSelector imports SNIPPET_LANGUAGES from lib/shiki.ts — single source of truth for supported language list"
  - "Edit page prefills data via useEffect fetch (client component) — avoids server/client hydration mismatch with form state"

patterns-established:
  - "Shiki singleton pattern: module-level promise, lazy init, reused across all requests"
  - "Server Component syntax highlighting: async component calls await highlight(), renders dangerouslySetInnerHTML"
  - "Client components in snippet chain are leaf nodes only (CopyButton, LanguageSelector) — rendering stays server-first"

requirements-completed: [SNIP-01, SNIP-02, SNIP-03, SNIP-05]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 03: Snippet UI — Shiki server-side highlighting, CopyButton, 4 CRUD pages

**Shiki singleton in lib/shiki.ts powering server-side syntax highlighting for 20 languages, with async SnippetCodeBlock server component and 4 snippet CRUD pages (list, new, detail, edit)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T04:23:15Z
- **Completed:** 2026-02-18T04:25:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Shiki singleton (lib/shiki.ts) with getHighlighter, highlight, SNIPPET_LANGUAGES — zero re-initialization across requests
- SnippetCodeBlock async Server Component renders syntax-highlighted HTML server-side, CopyButton handles clipboard on client only
- 4 snippet pages implemented: list view, create form (with LanguageSelector), detail view (Shiki-highlighted), edit form (with delete)
- All TypeScript checks pass, all Next.js 15 async params patterns applied correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and build Shiki infrastructure + snippet components** - `be534c2` (feat)
2. **Task 2: Build snippet pages (list, new, detail, edit)** - `59491ad` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/devcollab-web/lib/shiki.ts` — Shiki singleton with getHighlighter (exported for plan 17-04 rehype plugin), highlight, SNIPPET_LANGUAGES
- `apps/devcollab-web/components/snippet/CopyButton.tsx` — 'use client', navigator.clipboard.writeText, Copied! 2s feedback
- `apps/devcollab-web/components/snippet/SnippetCodeBlock.tsx` — async server component, calls highlight(), renders CopyButton
- `apps/devcollab-web/components/snippet/LanguageSelector.tsx` — 'use client', controlled select over SNIPPET_LANGUAGES
- `apps/devcollab-web/app/w/[slug]/snippets/page.tsx` — server component list view with New Snippet link
- `apps/devcollab-web/app/w/[slug]/snippets/new/page.tsx` — client form with title, language, code textarea
- `apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx` — server component detail view with SnippetCodeBlock
- `apps/devcollab-web/app/w/[slug]/snippets/[id]/edit/page.tsx` — client form prefilled via useEffect, delete button
- `apps/devcollab-web/package.json` — added shiki, react-markdown, remark-gfm, react-syntax-highlighter

## Decisions Made

- `getHighlighter` is exported (not just `highlight`) so plan 17-04's MarkdownRenderer rehype plugin can call `codeToHtml` with custom options directly, bypassing the simplified `highlight()` wrapper
- shiki hoisted to root node_modules via npm workspaces — no app-level duplication
- Edit page uses useEffect to prefill form state (client component) rather than server-rendering the form with pre-filled values, to avoid hydration mismatches on controlled inputs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- lib/shiki.ts singleton ready for plan 17-04 rehype plugin to import getHighlighter
- SnippetCodeBlock pattern established — post pages in plan 17-05 follow the same server component rendering approach
- All snippet CRUD pages connected to /workspaces/:slug/snippets API from plan 17-02

---
*Phase: 17-content-creation-snippets-posts*
*Completed: 2026-02-18*
