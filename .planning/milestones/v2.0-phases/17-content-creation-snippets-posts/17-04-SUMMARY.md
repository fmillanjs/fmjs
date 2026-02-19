---
phase: 17-content-creation-snippets-posts
plan: 04
subsystem: ui
tags: [react-markdown, react-syntax-highlighter, shiki, rehype, unist-util-visit, next.js, server-components, markdown]

# Dependency graph
requires:
  - phase: 17-03
    provides: lib/shiki.ts singleton with getHighlighter() exported for rehype plugin use
  - phase: 17-02
    provides: PostsController and PostsService API endpoints (CRUD, status toggle)

provides:
  - PostEditor: 'use client' split-pane component (textarea write + ReactMarkdown preview with react-syntax-highlighter)
  - MarkdownRenderer: Server Component with async rehype plugin calling lib/shiki.ts for zero-client-JS code highlighting
  - posts/page.tsx: server component listing posts with Draft/Published status badges
  - posts/new/page.tsx: client page creating post then optionally setting Published status
  - posts/[id]/page.tsx: server detail view using MarkdownRenderer for Shiki-highlighted Markdown
  - posts/[id]/edit/page.tsx: client page prefilling PostEditor with status toggle and delete

affects:
  - phase-18-comments (will need post detail context)
  - phase-20-search (Post model content fields)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component rehype plugin: async plugin calling getHighlighter() runs at request time server-side — zero WASM shipped to browser"
    - "Split-pane editor: textarea write + ReactMarkdown preview with react-syntax-highlighter for live client preview"
    - "Two-step post creation: POST creates Draft, PATCH /status sets Published if requested"
    - "Edit status toggle: PATCH /status called only when status differs from loaded post status"

key-files:
  created:
    - apps/devcollab-web/components/post/MarkdownRenderer.tsx
    - apps/devcollab-web/components/post/PostEditor.tsx
    - apps/devcollab-web/app/w/[slug]/posts/page.tsx
    - apps/devcollab-web/app/w/[slug]/posts/new/page.tsx
    - apps/devcollab-web/app/w/[slug]/posts/[id]/page.tsx
    - apps/devcollab-web/app/w/[slug]/posts/[id]/edit/page.tsx
  modified: []

key-decisions:
  - "MarkdownRenderer is a Server Component (no 'use client') — rehype plugin calling lib/shiki.ts runs server-side, satisfying the hard criterion of zero client JS for code highlighting on published post views"
  - "PostEditor uses react-syntax-highlighter (client-side) for live preview pane — acceptable as the editor preview is not the published view; hard criterion only applies to MarkdownRenderer"
  - "unist-util-visit available as hoisted monorepo transitive dependency in root node_modules — no explicit install needed"
  - "New post creation uses two API calls: POST to create Draft, then PATCH /status to Published if user clicked Publish button"
  - "Edit page PATCH /status only called when selected status differs from loaded post.status — avoids redundant API calls"

patterns-established:
  - "Async rehype plugin pattern: plugin factory returns async tree transformer that awaits getHighlighter() then visits all code nodes"
  - "Server/client highlighter split: MarkdownRenderer (server, Shiki) vs PostEditor preview (client, react-syntax-highlighter)"

requirements-completed: [POST-01, POST-02, POST-03]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 04: PostEditor split-pane component and MarkdownRenderer with server-side Shiki code highlighting via custom rehype plugin

**Textarea write + ReactMarkdown preview editor for authoring, Server Component MarkdownRenderer calling lib/shiki.ts via async rehype plugin for zero-client-JS code highlighting on published post detail pages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T04:28:43Z
- **Completed:** 2026-02-18T04:30:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- PostEditor client component with textarea write pane and ReactMarkdown live preview with react-syntax-highlighter for client-side code fence highlighting during authoring
- MarkdownRenderer server component with custom async rehype plugin that calls getHighlighter() from lib/shiki.ts singleton — code fences are Shiki-highlighted at request time with zero WASM shipped to browser
- Four post UI pages: list (server, status badges), new (client PostEditor + two-step Draft/Publish API calls), detail (server MarkdownRenderer), edit (client PostEditor with status toggle and delete)
- TypeScript clean — zero errors across all 6 new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PostEditor and MarkdownRenderer components** - `fa4f56a` (feat)
2. **Task 2: Build post pages (list, new, detail, edit)** - `de3585c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/devcollab-web/components/post/MarkdownRenderer.tsx` - Server Component, async rehype plugin calls lib/shiki.ts getHighlighter() for Shiki-highlighted code fences; no 'use client'
- `apps/devcollab-web/components/post/PostEditor.tsx` - 'use client' split-pane editor: textarea write + ReactMarkdown preview with react-syntax-highlighter; Draft and Publish buttons
- `apps/devcollab-web/app/w/[slug]/posts/page.tsx` - Server Component listing posts with Draft (gray) / Published (green) badges; await params (Next.js 15)
- `apps/devcollab-web/app/w/[slug]/posts/new/page.tsx` - Client page with PostEditor; POST creates Draft then PATCH /status if Publish clicked
- `apps/devcollab-web/app/w/[slug]/posts/[id]/page.tsx` - Server Component detail view using MarkdownRenderer; shows edit link and back link
- `apps/devcollab-web/app/w/[slug]/posts/[id]/edit/page.tsx` - Client page; fetches post on mount, prefills PostEditor; PATCH /status only when status changed; Delete Post button

## Decisions Made
- MarkdownRenderer is a Server Component (no 'use client') to ensure Shiki runs server-side via rehype plugin — this satisfies the hard criterion: zero client JS for code highlighting on published post views
- PostEditor uses react-syntax-highlighter (client) for live preview — intentional; hard criterion only applies to the published detail view, not the editor preview
- unist-util-visit was available as a hoisted transitive dependency in root node_modules — no explicit install required
- Two-step post creation (POST then PATCH /status) avoids changing the default Draft status logic in the API

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Verification step #3 grep check for 'use client' returned a false positive (grep matched the comment "no 'use client'" in MarkdownRenderer.tsx). Confirmed via `head -3` that MarkdownRenderer.tsx correctly starts with an import statement, not 'use client'.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All POST-01, POST-02, POST-03 requirements complete
- Posts are fully functional in the workspace UI: write/preview editor, draft/publish, edit/delete, server-side Shiki highlighting on published views
- Phase 17 Plan 05 (if it exists) can build on this post UI foundation
- Comments feature (Phase 18) can import PostDetail context from posts/[id]/page.tsx

---
*Phase: 17-content-creation-snippets-posts*
*Completed: 2026-02-18*
