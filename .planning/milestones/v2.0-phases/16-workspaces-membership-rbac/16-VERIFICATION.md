---
phase: 16-workspaces-membership-rbac
verified: 2026-02-17T19:00:00Z
status: passed
score: 4/4 success criteria verified
resolution: "SC-4 (Viewer/Contributor on snippets/posts) and RBAC-02/RBAC-03 moved to Phase 17 — snippet/post endpoints don't exist until Phase 17; CASL rules are fully implemented in WorkspaceAbilityFactory and will be exercised there. ROADMAP.md and REQUIREMENTS.md updated accordingly."
human_verification:
  - test: "Visit /w/:slug as a logged-in workspace member and confirm workspace name and member count are displayed"
    expected: "Workspace name and member count are shown from live API data"
    why_human: "Server component fetch behavior and visual rendering cannot be verified statically"
  - test: "Visit /dashboard, create a workspace, confirm it appears in list, click link to /w/:slug"
    expected: "Workspace appears in list immediately after creation; /w/:slug shows workspace details"
    why_human: "Client-side useEffect fetch and navigation flow require browser execution"
  - test: "Visit /join?token=<valid-token> and click Accept Invite"
    expected: "User joins workspace, redirect to /dashboard"
    why_human: "Requires live token, network call, and redirect behavior"
---

# Phase 16: Workspaces + Membership + RBAC Verification Report

**Phase Goal:** Users can create workspaces, invite members via time-limited single-use links, and have role-based permissions enforced at the API guard level — Admin, Contributor, and Viewer roles all behave correctly

**Verified:** 2026-02-17T19:00:00Z
**Status:** passed
**Re-verification:** No — initial verification (SC-4/RBAC-02/RBAC-03 rescoped to Phase 17 by user decision 2026-02-17)

---

## Goal Achievement

### Success Criteria from ROADMAP.md

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A logged-in user can create a workspace with name and slug; accessible at /w/:slug | VERIFIED | WorkspacesService.create() auto-generates slug, assigns Admin role via nested Prisma create. WorkspacesController POST /workspaces wired. Web UI at apps/devcollab-web/app/w/[slug]/page.tsx fetches GET /workspaces/:slug. Human verification confirmed. |
| 2 | Admin generates invite link, expires after 72h, cannot be reused | VERIFIED | generateInviteLink() uses `Date.now() + 72 * 60 * 60 * 1000`. joinWorkspace() checks `invite.usedAt !== null` and marks `usedAt: new Date()` before membership creation. Human verification confirmed single-use enforcement. |
| 3 | User with invite link joins workspace and gets Contributor role | VERIFIED | joinWorkspace() validates token, marks used, creates WorkspaceMember with role: 'Contributor'. POST /workspaces/join endpoint wired with @CheckAbility('create', 'WorkspaceMember'). Join page at /join?token= POSTs to API. |
| 4 | Viewer receives 403 on create snippet/post; Contributor succeeds — at API level | FAILED | WorkspaceAbilityFactory has correct Viewer rules (cannot('create', 'all')) and Contributor rules (can('create', 'Post'), can('create', 'Snippet')). BUT no snippet or post API endpoints exist. RBAC-02/RBAC-03 explicitly deferred to Phase 17 in all plans. SC-4 cannot be demonstrated at API level without the endpoints. |
| 5 | Last Admin cannot be removed or demoted; API returns error, member list unchanged | VERIFIED | removeMember() and updateMemberRole() both count admins before acting: `adminCount === 1` throws BadRequestException. Human verification confirmed 400 response on last-admin removal. |

**Score:** 4/5 success criteria verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/devcollab-database/prisma/schema.prisma` | Workspace, WorkspaceMember, InviteLink models, WorkspaceRole enum | VERIFIED | All 4 models present. WorkspaceRole enum (Admin/Contributor/Viewer). User.workspaceMemberships relation. @@unique([userId, workspaceId]) on WorkspaceMember. |
| `packages/devcollab-database/prisma/migrations/20260217232745_add_workspace_models/migration.sql` | Migration SQL for workspace tables | VERIFIED | SQL creates WorkspaceRole enum, Workspace, WorkspaceMember, InviteLink tables. All FK constraints and indexes present. |
| `apps/devcollab-api/src/core/database/prisma.service.ts` | Accessor getters for workspace, workspaceMember, inviteLink | VERIFIED | get workspace(), get workspaceMember(), get inviteLink() all present, following existing get user() pattern. |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` | CASL ability builder for Admin/Contributor/Viewer roles | VERIFIED | Injectable class with createForUserInWorkspace(). Admin: manage all. Contributor: read all + create/update Post/Snippet/Comment, cannot manage Workspace/WorkspaceMember/InviteLink. Viewer: read all only. |
| `apps/devcollab-api/src/workspaces/workspaces.module.ts` | WorkspacesModule imports DatabaseModule, exports WorkspaceAbilityFactory | VERIFIED | imports: [DatabaseModule], controllers: [WorkspacesController], providers: [WorkspacesService, WorkspaceAbilityFactory], exports: [WorkspaceAbilityFactory]. |
| `apps/devcollab-api/src/guards/casl-auth.guard.ts` | Async CaslAuthGuard with workspace-scoped ability evaluation | VERIFIED | async canActivate(), injects WorkspaceAbilityFactory. Extracts slug from request.params. Calls ability.can() for slug-scoped routes. Deny-by-default ForbiddenException without @CheckAbility. |
| `apps/devcollab-api/src/app.module.ts` | AppModule imports WorkspacesModule | VERIFIED | WorkspacesModule present in imports array. |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/devcollab-api/src/workspaces/workspaces.service.ts` | All workspace business logic: create, invite, join, listMembers, updateRole, removeMember | VERIFIED | 8 methods: create, findAll, findOne, generateInviteLink, joinWorkspace, listMembers, updateMemberRole, removeMember. All use prisma accessors. Last-admin protection in both updateMemberRole and removeMember. |
| `apps/devcollab-api/src/workspaces/workspaces.controller.ts` | 8 REST endpoints, all @CheckAbility decorated | VERIFIED | 8 endpoints confirmed (grep -c @CheckAbility = 8). POST join (line 38) before GET :slug (line 45) — correct route ordering. All wired to WorkspacesService. |
| `apps/devcollab-api/src/workspaces/dto/create-workspace.dto.ts` | CreateWorkspaceDto with name, optional slug | VERIFIED | name!: string, slug?: string present. |
| `apps/devcollab-api/src/workspaces/dto/join-workspace.dto.ts` | JoinWorkspaceDto with token | VERIFIED | token!: string present. |
| `apps/devcollab-api/src/workspaces/dto/update-member-role.dto.ts` | UpdateMemberRoleDto with role union type | VERIFIED | role!: 'Admin' | 'Contributor' | 'Viewer' present. |

### Plan 04 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts` | ALL_CONTROLLERS includes WorkspacesController | VERIFIED | WorkspacesController imported and in ALL_CONTROLLERS array. 13/13 tests pass (confirmed by running vitest). |
| `apps/devcollab-web/app/w/[slug]/page.tsx` | Workspace home page fetching GET /workspaces/:slug | VERIFIED | fetch(`${API_URL}/workspaces/${slug}`) present. params awaited. Renders workspace.name, workspace.slug, member count. |
| `apps/devcollab-web/app/w/[slug]/layout.tsx` | Workspace layout with slug display | VERIFIED | await params used. Renders slug in nav. Dashboard link. |
| `apps/devcollab-web/app/dashboard/page.tsx` | Dashboard with workspace list and Create Workspace form | VERIFIED | useEffect fetches GET /workspaces. handleCreate POSTs to POST /workspaces. Workspace list links to /w/:slug. |
| `apps/devcollab-web/app/join/page.tsx` | Join workspace page with token param | VERIFIED | handleJoin() fetches POST /workspaces/join with token from searchParams. Suspense wrapper around JoinForm. Redirects to /dashboard on success. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `casl-auth.guard.ts` | `workspace-ability.factory.ts` | constructor injection | VERIFIED | `private workspaceAbilityFactory: WorkspaceAbilityFactory` in constructor. Called via `await this.workspaceAbilityFactory.createForUserInWorkspace(...)`. |
| `workspaces.module.ts` | `core/database/database.module.ts` | imports: [DatabaseModule] | VERIFIED | `imports: [DatabaseModule]` present in module decorator. |
| `app.module.ts` | `workspaces/workspaces.module.ts` | imports: [WorkspacesModule] | VERIFIED | WorkspacesModule in imports array of AppModule. |
| `workspaces.controller.ts` | `workspaces.service.ts` | constructor injection | VERIFIED | `private readonly workspacesService: WorkspacesService` in constructor. All 8 route handlers call service methods. |
| `workspaces.service.ts` | `prisma.service.ts` | prisma.workspace/workspaceMember/inviteLink | VERIFIED | `this.prisma.workspace`, `this.prisma.workspaceMember`, `this.prisma.inviteLink` used throughout service. |
| `workspaces.controller.ts` | `check-ability.decorator.ts` | @CheckAbility on every route handler | VERIFIED | All 8 route handlers decorated with @CheckAbility. |
| `apps/devcollab-web/app/w/[slug]/page.tsx` | `GET /workspaces/:slug` | fetch in server component | VERIFIED | `fetch(\`${API_URL}/workspaces/${slug}\`, { credentials: 'include', cache: 'no-store' })`. |
| `apps/devcollab-web/app/dashboard/page.tsx` | `GET /workspaces + POST /workspaces` | fetch in client component | VERIFIED | useEffect: `fetch(\`${API_URL}/workspaces\`)`. handleCreate: `fetch(\`${API_URL}/workspaces\`, { method: 'POST' })`. |
| `apps/devcollab-web/app/join/page.tsx` | `POST /workspaces/join` | fetch on button click | VERIFIED | `fetch(\`${API_URL}/workspaces/join\`, { method: 'POST', body: JSON.stringify({ token }) })`. |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|----------|
| WORK-01 | 16-01, 16-03, 16-04 | User can create a new workspace with name and slug | SATISFIED | WorkspacesService.create() + WorkspacesController POST /workspaces + auto-slug generation + Admin role on creator |
| WORK-02 | 16-01, 16-03 | Admin can generate an invite link (time-limited, single-use) | SATISFIED | generateInviteLink() with 72h expiry + single-use usedAt enforcement in joinWorkspace() |
| WORK-03 | 16-01, 16-03, 16-04 | User can join a workspace via invite link | SATISFIED | joinWorkspace() validates, marks used, creates Contributor membership. /join page POSTs token. |
| WORK-04 | 16-01, 16-03 | Admin can view and manage workspace members | SATISFIED | listMembers(), updateMemberRole(), removeMember() in service. Controller endpoints: GET/PATCH/DELETE /workspaces/:slug/members |
| WORK-05 | 16-01, 16-03 | Admin cannot remove the last Admin | SATISFIED | Both removeMember() and updateMemberRole() count admins (adminCount === 1 throws BadRequestException) |
| RBAC-01 | 16-02, 16-03 | Admin can manage workspace members, roles, and all content | SATISFIED | WorkspaceAbilityFactory: Admin gets `can('manage', 'all')`. Guard evaluates ability.can() on :slug routes. |
| RBAC-02 | NOT CLAIMED | Contributor can create and edit own snippets, posts, and comments | BLOCKED | No snippet/post endpoints exist. CASL Contributor rules are present in factory but untestable. Plans explicitly defer to Phase 17. |
| RBAC-03 | NOT CLAIMED | Viewer can read all workspace content but cannot create or edit | BLOCKED | No snippet/post endpoints exist. CASL Viewer rules are present in factory (`cannot('create', 'all')`) but SC-4 cannot be demonstrated at API level. Plans explicitly defer to Phase 17. |
| RBAC-04 | 16-02 | All API endpoints deny access by default when no role decorator present | SATISFIED | Guard throws ForbiddenException when abilityReq is null. 13/13 meta-tests pass confirming all controller methods have @Public or @CheckAbility. |

**Orphaned requirements (mapped to Phase 16 in ROADMAP but unclaimed by any Phase 16 plan):**
- RBAC-02: Not in any plan's `requirements:` frontmatter. Explicitly deferred to Phase 17.
- RBAC-03: Not in any plan's `requirements:` frontmatter. Explicitly deferred to Phase 17.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/devcollab-api/src/workspaces/workspace-ability.factory.ts` | 56-57 | Comment: "own content only (authorId condition) is Phase 17 scope" | Info | Known deferral; CASL rules for Contributor are unconditional update — not wrong for Phase 16 but incomplete relative to SC-4 |

No blocking anti-patterns (placeholders, empty returns, stub handlers) found.

---

## Human Verification Required

### 1. Workspace page rendering at /w/:slug

**Test:** Log in, create a workspace, navigate to /w/[created-slug]
**Expected:** Workspace name, slug path, and member count display correctly from live API
**Why human:** Server component fetch and visual rendering cannot be verified statically

### 2. Dashboard workspace list and create flow

**Test:** Visit /dashboard after login; create workspace via form; verify it appears in list with link
**Expected:** Workspace appears in list immediately after POST succeeds; link navigates to /w/:slug
**Why human:** Client-side useEffect state update and navigation require browser execution

### 3. Invite link join flow at /join?token=

**Test:** Generate invite link via API, visit /join?token=<token>, click Accept Invite
**Expected:** User joins workspace with Contributor role; redirected to /dashboard
**Why human:** Requires live token, real HTTP call, and redirect behavior verification

---

## Gaps Summary

**1 gap blocks full success criterion achievement:**

**SC-4 / RBAC-02 / RBAC-03 — Viewer and Contributor role enforcement on snippet/post endpoints**

The ROADMAP.md Success Criterion 4 requires demonstrating that "a Viewer-role user receives 403 when attempting to create a snippet or post" at the API level. The CASL ability factory correctly defines these rules:
- Viewer: `cannot('create', 'all')` — would block snippet/post creation
- Contributor: `can('create', 'Post')`, `can('create', 'Snippet')` — would permit it

However, no snippet or post controllers or routes exist in Phase 16. The Phase 16 plans (16-02-PLAN.md) explicitly and correctly defer RBAC-02 and RBAC-03 to Phase 17 with the rationale: "those requirements require snippet and post API endpoints (and the authorId field on Prisma models) to be demonstrable."

This is an **architectural gap between the ROADMAP success criteria and the plan scope**, not an implementation defect. The infrastructure (CASL factory, guard, Viewer/Contributor rules) is fully implemented and correct. The gap is that SC-4 cannot be observed until Phase 17 endpoints exist.

**Resolution options for the gap closure plan:**
- Option A: Move SC-4 and RBAC-02/RBAC-03 to Phase 17 in ROADMAP.md (minimal snippet endpoint required to demonstrate Viewer 403)
- Option B: Add a minimal stub snippet endpoint in Phase 16 solely to demonstrate Viewer 403 / Contributor 200

---

## Prisma Client Verification

The regenerated Prisma client at `node_modules/.prisma/devcollab-client/index.d.ts` confirms:
- `get workspace(): Prisma.WorkspaceDelegate<ExtArgs>` present
- `get workspaceMember(): Prisma.WorkspaceMemberDelegate<ExtArgs>` present
- `get inviteLink(): Prisma.InviteLinkDelegate<ExtArgs>` present
- `WorkspaceRole` enum with Admin/Contributor/Viewer values present
- TypeScript compilation exits 0 for devcollab-api (confirmed)

---

## TypeScript + Test Status

- `npx tsc --noEmit -p apps/devcollab-api/tsconfig.json`: exits 0 (no errors)
- `npx vitest run test/unit/meta/controller-coverage.spec.ts`: 13/13 passed
- No purple colors in workspace UI files (confirmed by grep)
- params awaited in both /w/[slug]/layout.tsx and /w/[slug]/page.tsx

---

_Verified: 2026-02-17T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
