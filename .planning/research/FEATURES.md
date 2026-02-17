# Feature Research: DevCollab — Developer Collaboration Platform

**Domain:** Developer collaboration platform (GitHub-style content + Discord-style workspaces)
**Researched:** 2026-02-17
**Confidence:** HIGH (workspace/RBAC/threading patterns); MEDIUM (search, file uploads, notifications)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist for the platform to feel credible. Recruiters evaluating senior skills will notice these are missing before noticing anything is present.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Workspace creation & multi-workspace support** | Every SaaS collab tool (Slack, Notion, Linear) is workspace-organized; recruiters expect this mental model | MEDIUM | One user can own/belong to multiple workspaces; each workspace is isolated |
| **Invite-based membership** | No collaboration tool lets you add someone without invitation; must include email invite with token | MEDIUM | Time-limited token, accept/decline flow, re-invite capability |
| **RBAC: Admin / Contributor / Viewer** | Permissions without roles feel unfinished; recruiters recognize RBAC as a senior engineering signal | MEDIUM | Three roles is the industry minimum for a credible RBAC story |
| **Code snippet posts with syntax highlighting** | Primary differentiator of dev platforms from generic wikis; expected like bullets are expected in docs | MEDIUM | Language selection required; auto-detect as fallback |
| **Markdown posts** | Developers write in markdown; a dev platform without markdown is missing its native language | MEDIUM | Preview mode essential; raw markdown must be toggleable |
| **Threaded discussions on posts/snippets** | Users expect to be able to reply inline on content, not in a side channel | MEDIUM | One level of nesting is sufficient; Reddit-depth is not expected |
| **Activity feed per workspace** | GitHub-style "what happened recently" is table stakes for any collaborative platform | MEDIUM | Chronological list of events; not real-time required, poll is acceptable |
| **Copy-to-clipboard on code blocks** | Every code display surface since 2020 has a copy button; missing it reads as unfinished | LOW | One-click copy; brief "Copied!" confirmation state |
| **User profile (display name, avatar)** | Collaboration requires knowing who did what; nameless faces feel broken | LOW | Initials fallback is fine; no profile customization required |
| **Basic search within workspace** | Users need to find posts/snippets by keyword; zero search = content graveyard | HIGH | Scope: workspace-scoped search of post titles + snippet titles + content body |
| **In-app mention notifications** | @mention without a notification is a broken interaction loop | MEDIUM | Must show unread badge + notification list; email not required for v1 |
| **Read/unread notification state** | Seeing a notification and then seeing it again is table stakes; must persist read state | LOW | Mark-as-read individually + mark-all-read |

### Differentiators (Competitive Advantage)

Features that elevate the portfolio demo above "another CRUD app." These signal senior thinking to recruiters.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Shiki-powered syntax highlighting (VS Code quality)** | Same engine as VS Code; token-level accuracy for 100+ languages vs regex-based alternatives | LOW | Runs at build/server time; zero client JS for highlighting. Language label displayed alongside code |
| **Language auto-detection with manual override** | Eliminates friction: paste code, get highlighting without selecting language | MEDIUM | Use `linguist-languages` heuristics or Shiki's lang inference; manual override dropdown always available |
| **Embed-friendly snippet URLs** | Shareable direct link to a snippet (like GitHub Gist) makes snippets portable and linkable | LOW | `/workspaces/:id/snippets/:id` — publicly viewable if workspace is public |
| **Diff/version view on edited posts** | Shows that content has history, not just a blob. Signals engineering maturity to recruiters | HIGH | Store previous body on every save; render diff with `diff` library. Complexity: HIGH — defer to v2+ |
| **Reactions on posts/discussions** | Lightweight engagement signal without requiring full comment. Shows UX thinking | LOW | Emoji set: thumbs up, heart, laugh, +1. Count only; no per-user lists required for MVP |
| **@mention with rich preview in editor** | Popover showing matching members as you type `@` is expected quality in 2025 collaboration tools | MEDIUM | Requires user search API; Tiptap or similar editor with mention extension |
| **Markdown with code fence syntax highlighting in posts** | Fenced code blocks inside prose content are standard; missing = posts feel degraded vs snippets | MEDIUM | Consistent with snippet rendering; reuse Shiki integration |
| **File upload with in-line preview** | Images embedded in posts rather than attached links feel polished | MEDIUM | Image preview inline; other files as download links with type icon |
| **Activity feed event granularity** | Showing "Fernando posted 'Rust ownership patterns'" vs "Content created" signals UX care | LOW | Rich event objects with actor, target, and action string |
| **Workspace-scoped full-text search with result highlighting** | Highlighting the matched term in search results is standard quality signal | HIGH | Postgres tsvector covers this for a portfolio scale; match highlighting via `ts_headline()` |
| **Own auth system (separate from TeamFlow)** | Shows Fernando can build auth from scratch twice with different requirements | MEDIUM | JWT + refresh tokens; no NextAuth dependency here — raw NestJS guards |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look impressive on a list but create disproportionate complexity, technical debt, or time sink for a solo portfolio project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time presence indicators ("X is typing")** | Feels polished and live | Requires persistent WebSocket connections, heartbeats, Redis pub/sub; complexity far exceeds demo value for a collab content platform | Activity feed updates on a short poll (30s) conveys "live" without WebSocket overhead |
| **Rich WYSIWYG editor (TipTap + all extensions)** | Looks impressive; familiar to Notion users | TipTap's collaboration (Yjs/CRDT) adds significant bundle weight and sync complexity. Tables, embeds, and slash commands each add 2-4 days of edge case handling | Split-pane markdown editor with live preview (like GitHub's PR editor). Developers prefer raw markdown; WYSIWYG is for non-technical users |
| **Email notification delivery** | Expected in production SaaS | Requires SMTP/SendGrid integration, deliverability management, unsubscribe flows, bounce handling | In-app notifications only. State this explicitly in case study as a known v1 tradeoff — recruiters understand MVP scoping |
| **Infinite scroll activity feed** | Feels modern; social media pattern | Breaks browser back/forward, accessibility issues (role=feed aria complexity), "lost my place" UX | Cursor-based pagination with a "Load more" button; 20 items per page. Clear, predictable, accessible |
| **Version history with full diff for all content** | Shows engineering maturity | Storing body snapshots on every save grows DB fast. Diffing markdown is non-trivial (ambiguous whitespace, inline code) | Store `updated_at` and current body only. Note in case study: "v2 roadmap includes content versioning" |
| **Elasticsearch or dedicated search service** | Used at Google/Slack scale | Adds operational infrastructure (Docker service, index management, sync) for a portfolio demo with seed data | Postgres `tsvector` + `ts_headline()` handles this scale perfectly. Simple, zero extra infra, still qualifies as "full-text search" |
| **Real-time notification push (WebSocket)** | Immediate delivery feels professional | Second WebSocket surface adds complexity; push notifications require service workers | Poll `/notifications/unread-count` every 60 seconds. Instant-feeling for a demo; complexity-appropriate |
| **File CDN with transformations (Cloudinary-style)** | Automatic resizing, WebP conversion | Over-engineered for a portfolio. Cloudflare R2 + direct presigned upload is already impressive | Cloudflare R2 with presigned URLs for upload, direct URL for display. Images display at natural size with CSS max-width |
| **Workspace public/private toggle with discovery** | Makes platform feel like GitHub | Requires workspace discovery UI, search indexing across workspaces, public SEO considerations | All workspaces are invite-only for v1. State as intentional security-first design |

---

## Feature Dependencies

```
[Auth System (DevCollab-specific)]
    └──required by──> [All authenticated features]

[Workspace Creation]
    └──required by──> [Membership & Invites]
                          └──required by──> [RBAC enforcement]
                                                └──required by──> [Posts, Snippets, Files, Discussions]

[User Profile (display name + avatar)]
    └──required by──> [Activity Feed]
    └──required by──> [Mention Notifications]
    └──required by──> [Threaded Discussions (author display)]

[Posts or Snippets (content creation)]
    └──required by──> [Threaded Discussions]
    └──required by──> [Activity Feed events]
    └──required by──> [Full-text Search (content to index)]
    └──required by──> [Mention Notifications (mentions inside content)]

[Mention Notifications]
    └──requires──> [User Search API] (to resolve @name → user_id)
    └──requires──> [Notification Store] (to persist + retrieve)
    └──requires──> [Read/Unread State]

[File Uploads]
    └──requires──> [R2/S3 Storage Integration]
    └──requires──> [Presigned URL API endpoint]
    └──enhances──> [Posts] (inline images in markdown)

[Full-text Search]
    └──requires──> [Posts + Snippets exist with content]
    └──enhances──> [Workspace content discovery]

[Syntax Highlighting (Shiki)]
    └──required by──> [Code Snippets display]
    └──required by──> [Markdown code fences in Posts]
    └──is independent of──> [backend] (runs server-side in Next.js)

[Reactions]
    └──requires──> [Posts and Discussions exist]
    └──enhances──> [Engagement without comments]
```

### Dependency Notes

- **Auth is the foundation:** Everything else requires authenticated workspace membership. Auth must be Phase 1.
- **Workspace + Membership gates all content:** Cannot build posts/snippets without first having a workspace + member context.
- **Mentions require User Search API:** The `@mention` editor extension needs to query `GET /workspaces/:id/members?search=query` to resolve names to user IDs before a post is saved.
- **Activity Feed requires Posts/Snippets to exist:** The feed is meaningless without content events; wire it in the same phase as content creation.
- **Syntax highlighting is frontend-only:** Shiki runs in Next.js Server Components; no backend dependency. Can be implemented in the same phase as snippet display.
- **File uploads require R2 credentials before development begins:** This is an infrastructure gate, not a code gate. Set up R2 in Phase 1 environment setup.
- **Search can be deferred:** Postgres tsvector can be added as a GIN index migration after content tables exist. Does not block any other feature.

---

## Feature Deep Dives

### 1. Workspace Model

**Industry pattern (Slack, Linear, Notion, GitHub Orgs):**
- One workspace per "team/project context"; users can belong to multiple workspaces
- Workspace has a name, slug (URL-safe identifier), optional description, optional avatar
- Membership is per-workspace; a user has one role per workspace
- Owner (= Admin in DevCollab's model) cannot be demoted without transferring ownership first

**Invite flow pattern:**
- Admin generates invite link with a time-limited token (e.g., 72h expiry) or sends by email (v2)
- Token encodes: workspace_id, invited_by_user_id, role_to_assign, expiry
- Recipient accepts → gets added as WorkspaceMember with the pre-assigned role
- Invite tokens are single-use; consumed on accept

**Edge cases that matter for RBAC credibility:**
- Last Admin protection: cannot remove or demote the last admin in a workspace (would orphan it)
- Self-demotion: Admin can demote themselves only if another admin exists
- Viewer → Contributor promotion requires Admin to do it (Contributor cannot self-promote)
- Workspace deletion requires Admin + confirmation modal (not just a click)

### 2. RBAC: Admin / Contributor / Viewer

| Action | Admin | Contributor | Viewer |
|--------|-------|-------------|--------|
| Create post / snippet | YES | YES | NO |
| Edit own post / snippet | YES | YES | NO |
| Edit others' post / snippet | YES | NO | NO |
| Delete own post / snippet | YES | YES | NO |
| Delete others' post / snippet | YES | NO | NO |
| Upload files | YES | YES | NO |
| Comment / reply in discussions | YES | YES | NO |
| React to posts | YES | YES | YES |
| View all content | YES | YES | YES |
| Invite new members | YES | NO | NO |
| Change member roles | YES | NO | NO |
| Remove members | YES | NO | NO |
| Edit workspace settings (name, avatar) | YES | NO | NO |
| Delete workspace | YES (owner only) | NO | NO |
| View member list | YES | YES | YES |

**Implementation note:** Enforce at NestJS guard level via `WorkspaceMemberGuard` that reads role from `WorkspaceMember` table join. Do not trust frontend-passed role claims.

### 3. Code Snippet Sharing

**Table stakes UX:**
- Language selector (dropdown with 20 most common + search for more)
- Syntax highlighting rendered server-side via Shiki (VS Code quality, zero client JS)
- Language label shown in top-right of code block
- Copy button with "Copied!" feedback (1.5s, then resets)
- Line numbers (optional toggle, off by default)

**Language detection:** Shiki does not auto-detect by default. Recommended approach: require explicit selection, default to `plaintext`. Auto-detection is MEDIUM complexity and LOW payoff for a demo.

**Embed/share:** Direct URL to snippet (`/w/:slug/snippets/:id`) that non-members can view if workspace is set to "link sharing on" (simple boolean toggle). This is the GitHub Gist "shareable" pattern.

**Recommended library:** `shiki` (server-side, Next.js RSC compatible). Do not use `highlight.js` (regex-based, lower quality) or `Prism` (older ecosystem).

### 4. Markdown Posts

**Expected editor UX for developers:**
- Split-pane: raw markdown left, rendered preview right (GitHub PR editor model)
- Alternatively: toggle between "Write" and "Preview" tabs (simpler, less JS)
- Toolbar optional — experienced developers prefer typing; toolbar for discovery
- Fenced code blocks inside markdown must render with Shiki highlighting
- Image drag-and-drop into editor uploads to R2 and inserts markdown image syntax

**Publish flow:**
- Draft state (visible only to author) vs Published (visible to all workspace members)
- "Publish" button, not "Save" — makes the flow feel intentional not accidental
- Editing published post shows "Update" button, not "Publish" again
- `updated_at` timestamp displayed ("Last edited 2 hours ago")

**Recommended library:** `@uiw/react-md-editor` or `react-simplemde-editor` for the editor surface. `react-markdown` + `remark-gfm` + Shiki integration for the renderer. Avoid TipTap for markdown posts — WYSIWYG adds complexity without matching developer expectations.

### 5. Threaded Discussions

**Flat vs Nested — the research verdict:**
- phpBB and vBulletin (the most-used forums ever) default to flat
- Discourse (the modern dev forum standard) is flat-chronological with expandable reply context
- GitHub PR reviews use flat threads anchored to specific content locations
- Nested (Reddit-style) is for voting/ranking; inappropriate for a collaboration platform

**Recommendation: One level of nesting, maximum.** Top-level comments + replies to top-level comments. No reply-to-reply. This maps to GitHub's PR conversation model and avoids the UX complexity of collapsed trees.

**Edit/delete rules (industry standard):**
- Author can edit their own comment (show "edited" timestamp)
- Author can delete their own comment (replace content with "[deleted]", keep thread structure)
- Admin can delete any comment (full removal or redaction)
- Editing is time-unlimited (not the Twitter "15 minute window" — this is a docs platform, not microblogging)

**Reactions on comments:** Optional for MVP; LOW complexity if added (reuse post reaction system).

### 6. Activity Feed

**Events to track (ranked by demo value):**
1. `post.created` — "{user} published '{title}'"
2. `snippet.created` — "{user} shared a {language} snippet: '{title}'"
3. `member.joined` — "{user} joined the workspace"
4. `member.role_changed` — "{admin} changed {user}'s role to {role}"
5. `comment.created` — "{user} replied to '{post_title}'"
6. `file.uploaded` — "{user} uploaded '{filename}'"

**What NOT to track:** Every edit, every reaction, every view. This floods the feed with noise.

**Presentation:**
- Reverse chronological (newest first)
- Actor avatar + display name + event description + relative timestamp ("3 hours ago")
- Clickable event links (click on post title → navigate to post)
- Pagination: "Load more" button, 20 events per page (cursor-based)

**Polling vs real-time:** Poll every 30 seconds from the frontend. No WebSocket needed. Feed is not a chat system; latency of 30s is entirely appropriate.

### 7. Mention Notifications

**@mention detection in editor:**
- As user types `@`, open a popover querying `GET /workspaces/:id/members?q={typed}`
- Popover shows avatar + display name; click to insert mention
- Mention stored as structured data in post body (not just plain text)
- On post save/publish, backend parses mentions, creates `Notification` records for each mentioned user

**Notification delivery:**
- In-app only (no email for v1)
- Bell icon in nav with unread count badge
- Click bell → dropdown showing last 10 notifications (type, actor, target, timestamp)
- Mark individual as read; "Mark all read" button
- Poll `/notifications/unread-count` every 60 seconds for badge update

**Read/unread state:**
- `Notification` table: `id`, `recipient_user_id`, `actor_user_id`, `type`, `target_type`, `target_id`, `message`, `read_at`, `created_at`
- `read_at` = null → unread; timestamp = read
- Count: `WHERE read_at IS NULL AND recipient_user_id = :id`

**Mention types to support:** Post body mentions, snippet description mentions, discussion comment mentions. Start with post + comment mentions; snippet description mentions can be added later.

### 8. Full-Text Search

**What users expect to search:**
1. Post titles and body content (highest value)
2. Snippet titles and language (medium value)
3. Snippet code content (low value — searching inside code is rarely useful)
4. Member names (needed for invite/mention flows, not general search)

**Scope for MVP:** Posts + Snippets within a workspace. Cross-workspace search is an anti-feature (requires security boundary enforcement that adds complexity).

**Implementation: Postgres tsvector (not Elasticsearch, not Meilisearch)**

Rationale: This is a portfolio project with seed data. Postgres FTS via `tsvector` + `tsquery` handles this perfectly. Adding a dedicated search engine (Meilisearch, Typesense) introduces operational overhead (additional Docker service, index sync) with zero recruiter-visible benefit. The query quality is comparable for single-language English content at this scale.

Implementation steps:
1. Add `search_vector tsvector` column to `Post` and `Snippet` tables
2. Create GIN index on `search_vector`
3. Trigger or application-layer update of `search_vector` on save (combine title + body)
4. Query: `WHERE search_vector @@ plainto_tsquery('english', :q)`
5. Ranking: `ORDER BY ts_rank(search_vector, query) DESC`
6. Result highlighting: `ts_headline('english', body, query)` for matched term context

**Result ranking:**
- Title match ranks above body match (weighted tsvector: title weight 'A', body weight 'C')
- Recency as tiebreaker (`created_at DESC`)

**Search UI:**
- Global search bar in workspace header (keyboard shortcut: `Cmd+K` / `Ctrl+K`)
- Results grouped by type (Posts / Snippets)
- Matched text highlighted (yellow background on matched terms)
- Click result → navigate to that post/snippet

### 9. File Uploads

**Accepted types for a dev collaboration platform:**
- Images: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml`
- Documents: `application/pdf`
- Code: `text/plain`, plus common source extensions if stored as text
- Do NOT accept: executables, `.zip` archives (security risk surface without malware scanning)

**Size limits:**
- Images: 10MB per file (generous; Slack allows 100MB but 10MB covers all real use)
- PDF: 20MB
- Total per workspace: Track but do not enforce in v1 (seed data won't hit limits)

**Storage: Cloudflare R2**
- Presigned PUT URL from backend → browser uploads directly to R2 (no API server byte-streaming)
- Backend stores only the R2 URL, not the file bytes
- Organize by: `{workspace_id}/{user_id}/{timestamp}-{random}-{filename}`
- No CDN transforms in v1; images display via direct R2 public URL

**Preview behavior:**
- Images: inline `<img>` with max-width constraint
- PDF: link to open in new tab (no inline PDF viewer — browser handles this)
- Other files: icon + filename + file size + download link

**UX pattern:**
- Drag-and-drop to markdown editor → uploads immediately → inserts markdown image syntax
- Explicit file attachment section per post/snippet (below content)
- Progress bar during upload (XHR with progress event)
- Error states: file too large, type not allowed, upload failed (retry button)

---

## MVP Definition

### Launch With (DevCollab v1 — Recruiter Demo)

Minimum to make the platform feel like a real product a recruiter can explore:

- [x] **Own auth system** — required gate; nothing works without it
- [x] **Workspace creation + invite-based membership** — core collaboration model
- [x] **RBAC: Admin / Contributor / Viewer** — enforced at API level; demonstrated by seed data showing different roles
- [x] **Code snippet posts with Shiki syntax highlighting** — primary dev-specific differentiator
- [x] **Markdown posts with preview** — content creation foundation
- [x] **Threaded discussions (1-level nesting)** — makes content interactive
- [x] **Copy button on code blocks** — table stakes; non-negotiable
- [x] **Activity feed** — makes workspace feel alive with the seed data
- [x] **In-app mention notifications** — closes the interaction loop
- [x] **Basic full-text search (Postgres tsvector)** — makes seed content navigable
- [x] **File uploads to R2** — demonstrates cloud storage integration
- [x] **Seed data: demo workspace with realistic content** — required for recruiter-friendly demo

### Add After Validation (v1.x)

- [ ] **Reactions on posts/comments** — engagement signal; LOW complexity
- [ ] **Snippet embed/share URL** — linkable snippets; LOW complexity
- [ ] **Language auto-detection** — reduces friction; MEDIUM complexity
- [ ] **`Cmd+K` search modal** — UX polish; MEDIUM complexity

### Future Consideration (v2+)

- [ ] **Content version history + diff view** — HIGH complexity, HIGH engineering signal
- [ ] **Email notification delivery** — requires SMTP/deliverability setup
- [ ] **Real-time feed updates (WebSocket)** — currently covered by polling
- [ ] **Workspace public/private toggle + discovery** — security boundary complexity
- [ ] **Rich WYSIWYG editor (TipTap)** — non-developer use case

---

## Feature Prioritization Matrix

| Feature | Recruiter Value | Implementation Cost | Priority |
|---------|----------------|---------------------|----------|
| Own auth system | HIGH (shows auth depth) | MEDIUM | P1 |
| Workspace + Membership | HIGH (core model) | MEDIUM | P1 |
| RBAC enforcement | HIGH (senior signal) | MEDIUM | P1 |
| Code snippets + Shiki | HIGH (dev differentiator) | LOW | P1 |
| Markdown posts + preview | HIGH (content foundation) | MEDIUM | P1 |
| Threaded discussions | HIGH (makes it interactive) | MEDIUM | P1 |
| Copy button on code | HIGH (table stakes; absence noticed) | LOW | P1 |
| Activity feed | HIGH (makes demo feel alive) | MEDIUM | P1 |
| Mention notifications | HIGH (closes interaction loop) | MEDIUM | P1 |
| Full-text search | MEDIUM (navigability) | MEDIUM | P1 |
| File uploads to R2 | MEDIUM (cloud integration) | MEDIUM | P1 |
| Seed data | HIGH (demo-required) | MEDIUM | P1 |
| Reactions | MEDIUM | LOW | P2 |
| Snippet embed URL | LOW | LOW | P2 |
| Cmd+K search modal | MEDIUM | MEDIUM | P2 |
| Language auto-detect | LOW | MEDIUM | P2 |
| Content version history | HIGH (if built) | HIGH | P3 |
| Email notifications | LOW | HIGH | P3 |
| WYSIWYG editor (TipTap) | LOW (devs prefer MD) | HIGH | P3 |

**Priority key:**
- P1: Required for recruiter demo to feel like a real product
- P2: Polish pass after all P1 features work end-to-end
- P3: Future milestone; mention in case study as roadmap item

---

## Competitor Feature Analysis

| Feature | GitHub Gist | Slack/Discord | Notion | Our Approach |
|---------|-------------|---------------|--------|--------------|
| Syntax highlighting | Token-level (CodeMirror) | None | None | Shiki (VS Code quality) |
| Workspace model | Org-based | Channel-based | Team-based | Workspace with invite tokens |
| RBAC | Owner/Member/Outside Collaborator | Admin/Member/Guest | Admin/Member/Viewer | Admin/Contributor/Viewer |
| Markdown posts | No (Gist is snippets only) | No | Full WYSIWYG | Split-pane markdown editor |
| Threaded discussions | Issues/PRs (separate) | Threads on messages | Comments | 1-level nested on content |
| Activity feed | Dashboard/Explore | Activity sidebar | Not available | Per-workspace reverse-chron |
| Search | Across all Gists | Channel search | Workspace search | Workspace-scoped FTS |
| File uploads | Attachments limited | Files channel | Inline images | R2 presigned upload |
| Mentions | @user in issues | @user in messages | @user in pages | @user parsed from body |

---

## Sources

- [Workspace roles: Bitrise docs](https://docs.bitrise.io/en/bitrise-platform/workspaces/collaboration-and-permissions-in-workspaces/workspace-collaboration.html)
- [RBAC examples and patterns: OSO](https://www.osohq.com/learn/rbac-examples)
- [Developer's guide to RBAC: WorkOS](https://workos.com/guide/the-developers-guide-to-rbac)
- [Shiki syntax highlighter: Official](https://shiki.style/guide/)
- [Shiki + React Server Components: Lucky Media](https://www.luckymedia.dev/blog/syntax-highlighting-with-shiki-react-server-components-and-next-js)
- [react-shiki library: GitHub](https://github.com/AVGVSTVS96/react-shiki)
- [Web discussions: flat by design: Coding Horror](https://blog.codinghorror.com/web-discussions-flat-by-design/)
- [Discourse flat threading rationale: LSST Community](https://community.lsst.org/t/understanding-and-using-discourses-flat-threading/150)
- [Pagination vs infinite scroll UX: UX Patterns for Devs](https://uxpatterns.dev/pattern-guide/pagination-vs-infinite-scroll)
- [Notification design guidelines: Smashing Magazine](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/)
- [Postgres FTS vs Meilisearch vs Typesense: Nomadz](https://nomadz.pl/en/blog/postgres-full-text-search-or-meilisearch-vs-typesense)
- [Postgres FTS at portfolio scale: Supabase](https://supabase.com/blog/postgres-full-text-search-vs-the-rest)
- [WYSIWYG vs markdown for developer docs: Froala](https://froala.com/blog/general/wysiwyg-vs-markdown-developer-docs/)
- [File upload system best practices 2025: Porto Theme](https://www.portotheme.com/10-file-upload-system-features-every-developer-should-know-in-2025/)
- [Code snippet sharing best practices: CoderFile](https://www.coderfile.io/blog/code-snippet-sharing-best-practices)
- [Full stack portfolio projects 2026: Nucamp](https://www.nucamp.co/blog/top-10-full-stack-portfolio-projects-for-2026-that-actually-get-you-hired)
- [Credential injection via invitation flow (security): Medium](https://medium.com/@raia39499/credential-injection-via-invitation-flow-a-silent-account-takeover-risk-042a37702520)

---
*Feature research for: DevCollab — Developer Collaboration Platform (Fernando Millan portfolio v2.0)*
*Researched: 2026-02-17*
