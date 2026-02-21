# Phase 28: DevCollab UI Debt Closure - Research

**Researched:** 2026-02-20
**Domain:** Next.js 15 App Router UI, server-side auth, inline admin tables, static file serving
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Members table layout:**
- Columns: Name, Email, Role — the 3 required columns, clean and minimal
- Actions are inline in the row (role dropdown + Remove button visible in each row)
- Current logged-in user's row is labeled "You" to distinguish it
- Empty state: friendly message + "Generate Invite Link" button CTA ("No members yet. Generate an invite link to add someone.")

**Role management UX:**
- Inline role selector — saves immediately on selection (no confirm button)
- Silent UI update — no toast notification, just update the row visually
- Admin cannot change their own role — selector is disabled on the "You" row

**Member removal flow:**
- Confirmation dialog required before removal ("Are you sure you want to remove [Name]?")
- Optimistic removal — row disappears immediately, reverts if API fails
- Remove button only visible for non-Admin members (Admins cannot remove other Admins)

**Invite link presentation:**
- Modal/dialog with a copy button reveals the URL after clicking "Generate Invite Link"
- Modal includes a "Regenerate" option to create a new link (invalidating the old one)
- "Generate Invite Link" button is only visible to Admins

**Portfolio fixes:**
- Resume PDF: source from `resume.pdf` at root of the project — serve it at `/resume.pdf`
- Replace LinkedIn link with CodeSignal profile: https://codesignal.com/learn/profile/cmiqnphkm008cjs0444t3ea1t
- Fix GitHub URL to: https://github.com/fmillanjs
- Portfolio text should be optimized and enhanced for recruiters (clear value proposition, strong action verbs, quantifiable impact where possible)

**Auth redirect:**
- Server-side redirect — unauthenticated visits to protected routes (e.g. `/dashboard`) redirect to `/login` before any content renders (no flash)

### Claude's Discretion
- Exact modal design and copy button UX
- Loading/pending state for the role selector while API call is in flight
- Exact confirmation dialog wording
- Typography and spacing within the members table
- How recruiter-optimized copy is worded (apply best practices)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-02 | Real resume PDF is served at `/resume.pdf` on the portfolio site | Copy `resume.pdf` from project root to `apps/web/public/resume.pdf`; Next.js standalone mode copies `public/` via Dockerfile — pattern confirmed in apps/web/Dockerfile line 71 |
| UI-01 | Unauthenticated users visiting `/dashboard` are redirected server-side to `/login` | Convert `dashboard/page.tsx` from `'use client'` to async Server Component; use `await cookies()` + `redirect('/login')` — exact pattern from `app/w/[slug]/layout.tsx` |
| UI-02 | Workspace members page at `/w/[slug]/members` shows a list of all workspace members with their roles | Create `app/w/[slug]/members/page.tsx`; call `GET /workspaces/:slug/members` from Server Component; forward cookie header |
| UI-03 | Admin can change a member's role via an inline role selector on the members page | Client component with `<select>` onChange; `PATCH /workspaces/:slug/members/:userId/role`; roles: Admin/Contributor/Viewer |
| UI-04 | Admin can remove a member from the workspace via a Remove button on the members page | Client component with confirmation dialog (native `window.confirm` or inline state); `DELETE /workspaces/:slug/members/:userId`; optimistic removal with revert on error |
| UI-05 | Admin can generate an invite link via a button on the members page and see the full shareable URL | `POST /workspaces/:slug/invite-links` returns `{ token }` — construct full URL: `${DEVCOLLAB_URL}/join?token=${token}`; show in modal with copy button |
| UI-06 | Workspace navigation includes a Members link so the members page is discoverable | Add `<a href={'/w/${slug}/members'}>Members</a>` link to `WorkspaceNav.tsx` alongside existing nav links |

</phase_requirements>

---

## Summary

Phase 28 closes a well-defined set of UI gaps in devcollab-web and makes two focused portfolio fixes. The technical domain is entirely within existing patterns used in the project — no new libraries are needed, and no API changes are required because all backend endpoints for member management already exist and are tested.

The devcollab-web stack is intentionally minimal: Next.js 15 App Router, React 19, plain inline styles — no Tailwind, no Shadcn, no Radix. Every new UI component must follow this constraint. The existing codebase has established, clear patterns for server components (async function + `await cookies()` + server-side fetch with Cookie header), client components (`'use client'` + `useState` + `fetch` with `credentials: 'include'`), and navigation (`WorkspaceNav.tsx`). All new work copies these exact patterns.

The portfolio fix (FIX-02) is a file copy operation: `resume.pdf` already exists at the project root, it just needs to be copied into `apps/web/public/` so Next.js standalone mode includes it. The Dockerfile already copies `apps/web/public/` to the runner stage — no Dockerfile changes needed. Social link fixes are string replacements in `footer.tsx` and `hero-section.tsx`. Portfolio text optimizations affect `apps/web/app/(portfolio)/about/page.tsx`, `apps/web/app/(portfolio)/resume/page.tsx`, and potentially `hero-section.tsx`.

**Primary recommendation:** Build a single `MembersPage` server component that fetches members and the current user's ID on the server, passes both as props to a `MembersTable` client component that handles all interactive state (role changes, removal, invite modal). Use the exact `WorkspaceLayout` auth pattern for the dashboard fix.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.0.0 | App Router, Server Components, cookies(), redirect() | Already installed in devcollab-web |
| react | ^19.0.0 | Client components, useState, optimistic updates | Already installed |

### No New Libraries Required

All member management UI can be built with:
- Native HTML `<select>`, `<button>`, `<table>` elements
- `useState` for optimistic state management
- `fetch` with `credentials: 'include'` for client-side API calls
- Inline styles matching existing component patterns

The CONTEXT.md locks in NO Shadcn, NO Tailwind, NO Radix for devcollab-web. Dialogs must be implemented as controlled state overlays with inline styles.

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/devcollab-web/
├── app/
│   ├── dashboard/
│   │   └── page.tsx           # CHANGE: convert to server component with auth guard
│   └── w/[slug]/
│       ├── layout.tsx          # UNCHANGED: auth guard pattern reference
│       └── members/
│           └── page.tsx        # NEW: server component, fetches members + current user
├── components/
│   └── members/
│       └── MembersTable.tsx    # NEW: client component, all interactive state
└── (WorkspaceNav.tsx)          # CHANGE: add Members nav link
```

```
apps/web/
└── public/
    └── resume.pdf              # ADD: copy from project root resume.pdf
```

### Pattern 1: Dashboard Auth Guard (Server Component Conversion)

The dashboard/page.tsx currently uses `'use client'` with no auth guard. This is a client component — there is NO server-side redirect, producing a flash of content before any client-side redirect can occur.

**Fix pattern** — copy exactly from `app/w/[slug]/layout.tsx`:

```typescript
// apps/devcollab-web/app/dashboard/page.tsx
// REMOVE 'use client' directive
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// CRITICAL: params is a Promise in Next.js 15
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) {
    redirect('/login');
  }

  // Fetch workspaces server-side using the token
  // ...rest of existing page logic, now as server component
}
```

**Key point:** The dashboard page currently contains interactive state (`useState`, `useEffect`, form with `handleCreate`). Converting it entirely to a Server Component requires splitting: the auth guard + data fetch become server-side, while the "Create Workspace" form must remain a client component (child component with `'use client'`).

**Practical approach:** Extract a `CreateWorkspaceForm` client component. The page becomes a server component that (1) guards auth, (2) fetches workspaces server-side, (3) renders the list + the `<CreateWorkspaceForm />` child.

### Pattern 2: Members Page Server Component

```typescript
// apps/devcollab-web/app/w/[slug]/members/page.tsx
import { cookies } from 'next/headers';
import MembersTable from '../../../../components/members/MembersTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getMembers(slug: string, token: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/members`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as { sub: string; email: string };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value ?? '';

  const [members, currentUser] = await Promise.all([
    getMembers(slug, token),
    getCurrentUser(token),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
        Members
      </h1>
      <MembersTable
        slug={slug}
        initialMembers={members}
        currentUserId={currentUser?.sub ?? ''}
      />
    </div>
  );
}
```

### Pattern 3: MembersTable Client Component

**API response shape** (confirmed from `workspaces.service.ts` `listMembers`):
```typescript
// GET /workspaces/:slug/members returns:
interface Member {
  id: string;
  userId: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}
```

**Key behaviors to implement:**
1. Identify current user: `member.userId === currentUserId`
2. Identify if current user is Admin: look for current user's member record where `role === 'Admin'`
3. Role selector: disabled when `member.userId === currentUserId` (Admin cannot change own role)
4. Remove button: only shown when `member.role !== 'Admin'` (Admins cannot remove Admins)
5. Optimistic removal: `setMembers(prev => prev.filter(m => m.id !== member.id))` then revert on error

```typescript
'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Member {
  id: string;
  userId: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  user: { id: string; name: string | null; email: string };
}

interface MembersTableProps {
  slug: string;
  initialMembers: Member[];
  currentUserId: string;
}

export default function MembersTable({ slug, initialMembers, currentUserId }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [roleChanging, setRoleChanging] = useState<string | null>(null); // memberId

  const currentMember = members.find(m => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'Admin';

  async function handleRoleChange(member: Member, newRole: string) {
    setRoleChanging(member.id);
    // optimistic update
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole as Member['role'] } : m));
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/members/${member.userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        // revert
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: member.role } : m));
      }
    } catch {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: member.role } : m));
    } finally {
      setRoleChanging(null);
    }
  }

  async function handleRemove(member: Member) {
    if (!confirm(`Are you sure you want to remove ${member.user.name ?? member.user.email}?`)) return;
    // optimistic
    setMembers(prev => prev.filter(m => m.id !== member.id));
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/members/${member.userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        setMembers(prev => [...prev, member]); // revert
      }
    } catch {
      setMembers(prev => [...prev, member]); // revert
    }
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/invite-links`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // API returns { token, ... } — construct full join URL
        const joinUrl = `${window.location.origin}/join?token=${data.token}`;
        setInviteUrl(joinUrl);
        setShowInviteModal(true);
      }
    } catch {
      // handle error
    } finally {
      setGeneratingInvite(false);
    }
  }

  // ... render table + modal
}
```

### Pattern 4: WorkspaceNav Members Link

Add to `WorkspaceNav.tsx` alongside existing nav links:

```typescript
<a
  href={`/w/${slug}/members`}
  style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}
>
  Members
</a>
```

### Pattern 5: Resume PDF — Static File in Next.js Standalone

Next.js serves files from `apps/web/public/` at the root URL path. For standalone output:
- The Dockerfile already copies: `COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public`
- Placing `resume.pdf` in `apps/web/public/` makes it available at `https://fernandomillan.dev/resume.pdf`
- The resume page already has `<a href="/resume.pdf" download>Download PDF</a>` — it just needs the file to exist

**Action:** `cp resume.pdf apps/web/public/resume.pdf` — no code changes needed.

### Pattern 6: Social Link Updates

Files to update:

| File | Change |
|------|--------|
| `apps/web/components/portfolio/footer.tsx` | Replace LinkedIn href + icon with CodeSignal link (use external link icon or text link); fix GitHub href to `https://github.com/fmillanjs` |
| `apps/web/components/portfolio/hero-section.tsx` | Fix GitHub href to `https://github.com/fmillanjs` |
| `apps/web/app/(portfolio)/projects/devcollab/page.tsx` | Fix GitHub href to `https://github.com/fmillanjs` |
| `apps/web/app/(portfolio)/projects/teamflow/page.tsx` | Fix GitHub href if present |

**Note:** Lucide does not have a `CodeSignal` icon. Use a simple external link icon (`ExternalLink` from lucide-react) or render as a text link in the footer's Connect section. The `Linkedin` icon import from lucide-react can be replaced with an ExternalLink icon for CodeSignal.

### Anti-Patterns to Avoid

- **Client-side redirect for auth guard:** `useEffect(() => { if (!token) router.push('/login') })` in a client component produces a flash of empty page content. Auth guard MUST be a server component with `redirect()`.
- **Passing raw JWT token to client:** Do not expose the raw JWT token value to client-side code. Identify the current user via `GET /auth/me` on the server and pass only the `userId` (sub) to the client.
- **Removing admin members:** The Remove button must be hidden (not just disabled) for Admin members. The API already enforces this with a 400 error, but the UI should not even offer the option.
- **Using Shadcn Dialog for modals:** devcollab-web has NO Shadcn. Build modals as simple fixed-position overlay divs with inline styles.
- **Forgetting `await params`:** Next.js 15 params is a Promise. Always `const { slug } = await params`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copy-to-clipboard | Custom clipboard API wrapper | `navigator.clipboard.writeText(url)` | Already a browser standard, no library needed |
| Confirmation dialog | Custom modal component for removal | `window.confirm()` or inline `showConfirm` state with a simple overlay | The locked decision says "confirmation dialog" — either native or a minimal inline implementation is sufficient |
| Role validation | Client-side role enum | Pass `['Admin', 'Contributor', 'Viewer']` as a literal array | No library needed for 3 values |
| Auth token parsing | JWT decode library | `GET /auth/me` endpoint already exists — call it | Don't parse the JWT on the client |

**Key insight:** This entire phase is plumbing existing API endpoints to UI. Every complex problem (auth, role enforcement, invite token generation) is already solved in the API layer. The UI only needs to call the correct endpoint and manage local display state.

---

## Common Pitfalls

### Pitfall 1: Dashboard Client Component Flash
**What goes wrong:** `dashboard/page.tsx` currently has `'use client'` — when an unauthenticated user visits `/dashboard`, the server renders HTML without any redirect. The page renders briefly before any client-side logic can redirect.
**Why it happens:** Client components run on the server but cannot call `redirect()` from `next/navigation` at server time in a meaningful way — the redirect must happen server-side before any HTML is sent.
**How to avoid:** Remove `'use client'`. Convert to async Server Component. Extract interactive parts (the Create Workspace form) into a child `'use client'` component. The server component runs the auth check and calls `redirect('/login')` before any rendering occurs.
**Warning signs:** If you see `'use client'` at the top of `dashboard/page.tsx` after your change, the fix is incomplete.

### Pitfall 2: Missing currentUser on Members Page
**What goes wrong:** Without knowing the current user's ID, the members table cannot label the "You" row or disable the role selector for the current user.
**Why it happens:** The API `GET /workspaces/:slug/members` returns all members but does not flag which one is "me."
**How to avoid:** Fetch `GET /auth/me` on the server (pattern already used in `app/w/[slug]/snippets/[id]/page.tsx` line 18-26). Pass `currentUserId` as a prop to the client component. Compare `member.userId === currentUserId` to identify the current user's row.
**Warning signs:** If the MembersTable client component makes a fetch to `/auth/me`, it's fetching unnecessarily on the client — move this to the server.

### Pitfall 3: Invite URL Construction
**What goes wrong:** `POST /workspaces/:slug/invite-links` returns `{ id, token, expiresAt, workspaceId }` — it does NOT return a full URL.
**Why it happens:** The API returns a raw token; the frontend must construct the join URL.
**How to avoid:** In the invite modal, construct the URL as: `${window.location.origin}/join?token=${data.token}`. The existing `/join` page at `app/join/page.tsx` already accepts this `?token=` query parameter.
**Warning signs:** If you see a URL like `http://localhost:3003/join?token=...`, the URL construction used API_URL instead of `window.location.origin`.

### Pitfall 4: Resume PDF Not Included in Docker Image
**What goes wrong:** If the PDF is only copied locally but not committed to git, the GitHub Actions Docker build will not include it.
**Why it happens:** `turbo prune web --docker` copies source from git — uncommitted files are excluded.
**How to avoid:** Commit `apps/web/public/resume.pdf` to git. The Dockerfile will then include it automatically when building. Verify: after commit, `git show HEAD:apps/web/public/resume.pdf` should succeed.
**Warning signs:** PDF file is present locally but 404 in production.

### Pitfall 5: Optimistic Removal Revert Order
**What goes wrong:** After an optimistic removal, the revert appends the member at the end of the list instead of the original position.
**Why it happens:** `setMembers(prev => [...prev, member])` appends rather than inserting at the original index.
**How to avoid:** Either (a) accept the reorder on failure (acceptable UX for an error case), or (b) capture the index before removal and splice the member back in. For this phase, option (a) is acceptable.

### Pitfall 6: Footer CodeSignal Link — No Lucide Icon
**What goes wrong:** Trying to use a `CodeSignal` icon from lucide-react — no such icon exists.
**Why it happens:** CodeSignal is not a major platform in lucide's icon set.
**How to avoid:** Use `ExternalLink` from lucide-react with an `aria-label="CodeSignal"`, or render the link as plain text in the Connect section. Do not invent an icon import that doesn't exist.

---

## Code Examples

### Auth Guard Pattern (from existing codebase)
```typescript
// Source: apps/devcollab-web/app/w/[slug]/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: params is a Promise in Next.js 15
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) {
    redirect('/login');
  }
  // ...
}
```

### Server-Side Fetch with Cookie Header (established pattern)
```typescript
// Source: apps/devcollab-web/app/w/[slug]/activity/page.tsx
const cookieStore = await cookies();
const token = cookieStore.get('devcollab_token')?.value ?? '';
const res = await fetch(`${API_URL}/workspaces/${slug}/members`, {
  headers: { Cookie: `devcollab_token=${token}` },
  cache: 'no-store',
});
```

### getCurrentUser Pattern (from snippets/[id]/page.tsx)
```typescript
// Source: apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx lines 18-26
async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as { sub: string; email: string };
}
```

### Client-Side PATCH with credentials (established pattern)
```typescript
// Pattern from existing client components (e.g. ReactionBar.tsx)
const res = await fetch(`${API_URL}/workspaces/${slug}/members/${userId}/role`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ role: newRole }),
});
```

### Inline Style Modal (pattern for devcollab-web)
```typescript
// No Radix/Shadcn — use controlled state overlay
{showInviteModal && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}
    onClick={() => setShowInviteModal(false)}
  >
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
        position: 'relative',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* modal content */}
    </div>
  </div>
)}
```

---

## API Endpoint Reference

All endpoints confirmed in `apps/devcollab-api/src/workspaces/workspaces.controller.ts`:

| Operation | Method | Endpoint | Auth Required | CASL Subject |
|-----------|--------|----------|---------------|--------------|
| List members | GET | `/workspaces/:slug/members` | Any member | read WorkspaceMember |
| Update member role | PATCH | `/workspaces/:slug/members/:userId/role` | Admin only | update WorkspaceMember |
| Remove member | DELETE | `/workspaces/:slug/members/:userId` | Admin only | delete WorkspaceMember |
| Generate invite link | POST | `/workspaces/:slug/invite-links` | Admin only | create InviteLink |
| Get current user | GET | `/auth/me` | Any authenticated | (existing endpoint) |

**Role values:** `'Admin' | 'Contributor' | 'Viewer'` (from `update-member-role.dto.ts`)

**Members response shape** (from `workspaces.service.ts` `listMembers`):
```typescript
// Each item in the array:
{
  id: string;
  userId: string;
  workspaceId: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}
```

**Invite link response** (from `workspaces.service.ts` `generateInviteLink`):
```typescript
{
  id: string;
  token: string;       // UUID — use this to build join URL
  expiresAt: string;   // ISO datetime (72 hours from creation)
  workspaceId: string;
  usedAt: null;
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `params.slug` (sync) | `(await params).slug` | Next.js 15 changed params to Promise — existing codebase already correct |
| Client-side auth guard with `useRouter` | Server component `redirect()` | Dashboard currently uses old pattern — needs fix |
| LinkedIn social link | CodeSignal profile link | User decision — simple string replacement |

**Deprecated/outdated in this project's context:**
- Client-component auth guard in `dashboard/page.tsx` — produces content flash, must be converted

---

## Open Questions

1. **Does `/auth/me` endpoint exist in devcollab-api?**
   - What we know: Used in `apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx` lines 18-26 — confirmed in codebase
   - What's unclear: The endpoint is not in the source files I read (auth.controller.ts not examined in detail)
   - Recommendation: Before implementing, verify `GET /auth/me` exists — run `grep -r "auth/me" apps/devcollab-api/src` to confirm. If absent, the current user check must be done differently (e.g., decode the JWT on the server without a library call, or determine Admin status from the members list by matching the userId extracted from the JWT cookie payload).

2. **How does the members page determine if current user is Admin for conditional UI?**
   - What we know: The server fetches all members; the API returns each member's userId and role; `GET /auth/me` returns `{ user: { sub, email } }`
   - What's unclear: If `/auth/me` is missing, alternative is to decode the JWT token (base64 the payload section) to extract `sub` on the server
   - Recommendation: Check `/auth/me` first. The `sub` field in the JWT payload is the userId — matching it against members list to find the current user's role is the correct approach.

3. **Does the `'Regenerate'` invite option need to call a different endpoint?**
   - What we know: The API `generateInviteLink` creates a NEW invite link each call. Old tokens are not explicitly invalidated but `usedAt` prevents reuse.
   - What's unclear: The "Regenerate" option in the modal can simply call the same `POST /workspaces/:slug/invite-links` endpoint again — it generates a new token. The old token remains valid until it expires (72h) or is used.
   - Recommendation: "Regenerate" = call `POST /workspaces/:slug/invite-links` again, replace `inviteUrl` state with new result. The user decision says "invalidating the old one" — the API doesn't explicitly invalidate old tokens, but this is acceptable for a portfolio demo.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `apps/devcollab-web/app/w/[slug]/layout.tsx` (auth guard pattern)
- Direct codebase inspection — `apps/devcollab-api/src/workspaces/workspaces.controller.ts` (all member API endpoints)
- Direct codebase inspection — `apps/devcollab-api/src/workspaces/workspaces.service.ts` (response shapes)
- Direct codebase inspection — `apps/devcollab-web/Dockerfile` (public/ copy in standalone)
- Direct codebase inspection — `apps/web/Dockerfile` (public/ copy in standalone, line 71)
- Direct codebase inspection — `apps/devcollab-web/app/w/[slug]/snippets/[id]/page.tsx` (getCurrentUser pattern)
- Direct codebase inspection — `apps/devcollab-web/components/WorkspaceNav.tsx` (nav pattern)

### Secondary (MEDIUM confidence)
- Next.js 15 App Router docs: `cookies()` from `next/headers` and `redirect()` from `next/navigation` work in Server Components — established pattern in this codebase
- Next.js standalone output static file serving: `public/` directory is served at root URL — confirmed by Dockerfile pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all patterns confirmed in codebase
- Architecture: HIGH — direct codebase inspection of all relevant files
- API endpoints: HIGH — controller and service read directly
- Pitfalls: HIGH — identified from existing code structure and Next.js 15 known constraints

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable patterns, 30 days)
