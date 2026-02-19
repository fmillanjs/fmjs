---
phase: 18-discussions-reactions
plan: 04
subsystem: ui
tags: [nextjs, react, nestjs, prisma, comments, reactions, ssr, server-components]

# Dependency graph
requires:
  - phase: 18-03
    provides: ThreadedComments, CommentForm, CommentItem, ReactionBar client components + CommentNode type
  - phase: 18-02
    provides: CommentsModule and ReactionsModule NestJS API endpoints

provides:
  - Post detail page with SSR-fetched comments + ReactionBar wired (ThreadedComments below content)
  - Snippet detail page with SSR-fetched comments wired (ThreadedComments below code block)
  - Server-side currentUserId resolution via GET /auth/me with forwarded cookie
  - PostsService.findOne now includes reactions in select (id, emoji, userId)
  - Bug fix: CommentsService.create parent lookup uses OR [post, snippet] workspaceId check

affects:
  - 19-search
  - 20-deployment
  - phase-21

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SSR page fetches currentUser + initialComments server-side, passes as props to client components
    - Cookie forwarding pattern (devcollab_token header) used in both page-level SSR helpers
    - OR workspaceId filter on parent comment lookup for cross-entity comment support

key-files:
  created: []
  modified:
    - apps/devcollab-web/app/w/[slug]/posts/[id]/page.tsx
    - apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx
    - apps/devcollab-api/src/posts/posts.service.ts
    - apps/devcollab-api/src/comments/comments.service.ts

key-decisions:
  - "PostsService.findOne reactions include: { select: { id, emoji, userId } } added to pass SSR initial reaction data to ReactionBar without extra round-trip"
  - "CommentsService.create parent lookup uses OR: [{ post: { workspaceId } }, { snippet: { workspaceId } }] — plain post: { workspaceId } failed for snippet comments (bug fix)"
  - "currentUserId resolved server-side via GET /auth/me with forwarded cookie — never null when authenticated, consistent with Phase 17 SSR pattern"

patterns-established:
  - "SSR detail pages: call getCurrentUser(token) + getComments(slug, entityId, token) before rendering, pass results as props to client components"
  - "Client component props: currentUserId (string), initialComments (CommentNode[]), workspaceSlug (string) — canonical prop shape for ThreadedComments"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04]

# Metrics
duration: ~30min
completed: 2026-02-18
---

# Phase 18 Plan 04: Wire ThreadedComments + ReactionBar into Post/Snippet Detail Pages Summary

**Post and snippet detail pages now render full threaded discussion + emoji reactions wired to live NestJS API, with SSR-resolved currentUserId and initial data passed as props — all 11 browser acceptance criteria verified and approved**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-02-18
- **Completed:** 2026-02-18
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 4

## Accomplishments

- Post detail page: ReactionBar + ThreadedComments wired below MarkdownRenderer with SSR-fetched initial data
- Snippet detail page: ThreadedComments wired below SnippetCodeBlock with SSR-fetched initial data
- PostsService.findOne extended to include reactions (id, emoji, userId) for SSR initial prop
- Bug fix (found during verification): CommentsService.create parent comment lookup now uses OR [post, snippet] workspaceId — was broken for snippet comments
- Human verified all 11 acceptance criteria: top-level comment, reply, edit, delete, reaction toggle, snippet comments, Viewer RBAC block

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire ThreadedComments + ReactionBar into post and snippet detail pages** - `5d6259e` (feat)
2. **Bug fix: parent comment lookup OR post/snippet workspaceId** - `4f65d4b` (fix — deviation Rule 1)
3. **Task 2: Human verification checkpoint** - approved by human, no code commit

## Files Created/Modified

- `apps/devcollab-web/app/w/[slug]/posts/[id]/page.tsx` - Added getCurrentUser + getComments SSR helpers; renders ReactionBar + ThreadedComments below MarkdownRenderer
- `apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx` - Added getCurrentUser + getComments SSR helpers; renders ThreadedComments below SnippetCodeBlock
- `apps/devcollab-api/src/posts/posts.service.ts` - Extended findOne include to return reactions (id, emoji, userId)
- `apps/devcollab-api/src/comments/comments.service.ts` - Fixed parent comment workspaceId lookup to OR across post and snippet FKs

## Decisions Made

- PostsService.findOne reactions include (id, emoji, userId) enables SSR to pass real initialReactions to ReactionBar without an extra client-side fetch on mount
- currentUserId is resolved server-side via GET /auth/me with the forwarded devcollab_token cookie — identical to Phase 17 SSR auth pattern
- OR workspaceId filter on parent comment lookup required for correctness when parent comment belongs to a snippet (not a post)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CommentsService.create parent comment lookup for snippet comments**
- **Found during:** Task 2 human verification (step 9 — snippet comment posting)
- **Issue:** CommentsService.create was filtering parent comment with `post: { workspaceId }` only; this caused the lookup to return null when posting a reply on a snippet detail page, resulting in a 400 error
- **Fix:** Changed the Prisma where clause to use `OR: [{ post: { workspaceId } }, { snippet: { workspaceId } }]` so parent lookup works regardless of whether the target entity is a post or snippet
- **Files modified:** `apps/devcollab-api/src/comments/comments.service.ts`
- **Verification:** Snippet comment replies post successfully; no regression on post comments
- **Committed in:** `4f65d4b` (fix(18-04): parent comment lookup handles snippet comments — OR post/snippet workspaceId check)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Fix was necessary for correctness; snippet comment replies would have been broken without it. No scope creep.

## Issues Encountered

None beyond the bug documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 18 is fully complete: schema, NestJS API (Comments + Reactions modules), four React client components, and both detail pages wired end-to-end
- Human-verified all 11 acceptance criteria including RBAC (Viewer blocked server-side)
- Phase 19 (Search) can proceed — no blockers from this phase
- The CommentNode type export from ThreadedComments.tsx is the canonical shape for any future comment-related UI

---
*Phase: 18-discussions-reactions*
*Completed: 2026-02-18*
