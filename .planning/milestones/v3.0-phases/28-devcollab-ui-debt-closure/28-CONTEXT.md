# Phase 28: DevCollab UI Debt Closure - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add browser UI for workspace member management features that currently exist as API-only (members list, role management, member removal, invite link generation). Fix server-side auth redirect so unauthenticated visitors are redirected without content flash. Serve a real resume PDF from the portfolio. Fix portfolio social links and optimize text for recruiters.

</domain>

<decisions>
## Implementation Decisions

### Members table layout
- Columns: Name, Email, Role — the 3 required columns, clean and minimal
- Actions are inline in the row (role dropdown + Remove button visible in each row)
- Current logged-in user's row is labeled "You" to distinguish it
- Empty state: friendly message + "Generate Invite Link" button CTA ("No members yet. Generate an invite link to add someone.")

### Role management UX
- Inline role selector — saves immediately on selection (no confirm button)
- Silent UI update — no toast notification, just update the row visually
- Admin cannot change their own role — selector is disabled on the "You" row

### Member removal flow
- Confirmation dialog required before removal ("Are you sure you want to remove [Name]?")
- Optimistic removal — row disappears immediately, reverts if API fails
- Remove button only visible for non-Admin members (Admins cannot remove other Admins)

### Invite link presentation
- Modal/dialog with a copy button reveals the URL after clicking "Generate Invite Link"
- Modal includes a "Regenerate" option to create a new link (invalidating the old one)
- "Generate Invite Link" button is only visible to Admins

### Portfolio fixes
- Resume PDF: source from `resume.pdf` at root of the project — serve it at `/resume.pdf`
- Replace LinkedIn link with CodeSignal profile: https://codesignal.com/learn/profile/cmiqnphkm008cjs0444t3ea1t
- Fix GitHub URL to: https://github.com/fmillanjs
- Portfolio text should be optimized and enhanced for recruiters (clear value proposition, strong action verbs, quantifiable impact where possible)

### Auth redirect
- Server-side redirect — unauthenticated visits to protected routes (e.g. `/dashboard`) redirect to `/login` before any content renders (no flash)

### Claude's Discretion
- Exact modal design and copy button UX
- Loading/pending state for the role selector while API call is in flight
- Exact confirmation dialog wording
- Typography and spacing within the members table
- How recruiter-optimized copy is worded (apply best practices)

</decisions>

<specifics>
## Specific Ideas

- The resume PDF file is already at the root of the project (`resume.pdf`) — just needs to be served correctly
- CodeSignal URL: https://codesignal.com/learn/profile/cmiqnphkm008cjs0444t3ea1t
- GitHub URL: https://github.com/fmillanjs
- Portfolio text optimization: focus on recruiter-friendly framing — skills demonstrated, projects shipped, impact delivered

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 28-devcollab-ui-debt-closure*
*Context gathered: 2026-02-20*
