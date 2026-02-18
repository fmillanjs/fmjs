---
phase: 21-seed-data-portfolio-integration
verified: 2026-02-18T22:00:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "Case study 'View Live Demo' and 'Launch Demo' buttons now link to ${DEVCOLLAB_URL}/w/devcollab-demo (fixed in commit 8c9edc7)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Log in with all three demo role accounts and verify role-appropriate content"
    expected: "Admin can manage workspace members; Contributor can create/edit content; Viewer can read but gets 403 on write actions"
    why_human: "RBAC enforcement at the API layer cannot be verified by static file analysis"
  - test: "Run docker compose up from scratch on a clean database and verify devcollab-seed runs automatically"
    expected: "devcollab-seed service starts after devcollab-migrate completes, seeds the database, then devcollab-api starts with pre-seeded data"
    why_human: "Docker service orchestration and container startup order requires a live environment"
---

# Phase 21: Seed Data + Portfolio Integration Verification Report

**Phase Goal:** The DevCollab demo workspace contains realistic content demonstrating all three roles; the portfolio site presents DevCollab with a project card, case study, and live demo link; recruiters can interact with the demo immediately on first visit
**Verified:** 2026-02-18T22:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (commit 8c9edc7)

## Re-Verification Summary

Previous verification (2026-02-18T21:30:00Z) found 1 gap:

- PORT-03 deep-link: "View Live Demo" and "Launch Demo" buttons in the case study page linked to `${DEVCOLLAB_URL}/login` instead of `${DEVCOLLAB_URL}/w/devcollab-demo`.

Commit `8c9edc7` (fix(21): redirect unauthenticated users from /w/:slug to /login + restore demo deep-links) closed this gap. The same commit also added a server-side auth redirect in `apps/devcollab-web/app/w/[slug]/layout.tsx` — unauthenticated users visiting any workspace URL are now redirected to `/login`, which means the deep-link flow works correctly: unauthenticated recruiter clicks "View Live Demo" → lands on login page with demo credentials visible → logs in → redirected to `/w/devcollab-demo`.

All 10 must-haves now pass automated checks.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running seed creates 3 users, 1 workspace (devcollab-demo), 5+ snippets in 5 languages, 3+ Published posts with @mention comments/reactions/ActivityEvents | VERIFIED | seed.ts line 6: `faker.seed(42)`, line 34: slug `devcollab-demo`, line 63: `['typescript', 'python', 'rust', 'go', 'sql']`, line 118: `status: 'Published'` x3; all MemberJoined/PostCreated/SnippetCreated events present |
| 2 | Running seed a second time exits with 'Seed already applied — skipping' and creates no new records | VERIFIED | seed.ts lines 9–14: `prisma.user.findUnique({where:{email:'admin@demo.devcollab'}})` idempotency guard; if found, logs and returns |
| 3 | docker-compose devcollab-seed service runs after devcollab-migrate and seeds on first launch | VERIFIED | docker-compose.yml line 72: `devcollab-seed:` service with `dockerfile: packages/devcollab-database/Dockerfile.seed`; line 77–78: `depends_on: devcollab-migrate: condition: service_completed_successfully` |
| 4 | Admin logs in with admin@demo.devcollab / Demo1234!, Contributor with contributor@demo.devcollab / Demo1234!, Viewer with viewer@demo.devcollab / Demo1234! | VERIFIED | seed.ts: bcrypt.hash('Demo1234!', 12) applied to all 3 users; login page shows credentials; router.push redirects to /w/devcollab-demo post-auth |
| 5 | Portfolio homepage shows two project cards side by side: TeamFlow and DevCollab | VERIFIED | apps/web/app/(portfolio)/page.tsx line 28: `grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto`; lines 74–82: DevCollab card block with `href="/projects/devcollab"` |
| 6 | A DevCollab case study exists at /projects/devcollab with technology choices, architecture decisions, and lessons learned | VERIFIED | apps/web/app/(portfolio)/projects/devcollab/page.tsx: 425 lines; CaseStudySections: Overview, Problem, Architecture, Key Technical Decisions (5-row table), Challenges & Solutions (3 items), Results |
| 7 | The case study has a 'View Live Demo' button linking to NEXT_PUBLIC_DEVCOLLAB_URL/w/devcollab-demo | VERIFIED | Line 56: `href={\`${DEVCOLLAB_URL}/w/devcollab-demo\`}`; line 413: same on "Launch Demo" button — gap closed in commit 8c9edc7 |
| 8 | The DevCollab login page shows a 'Demo credentials' hint so recruiters know what to type | VERIFIED | apps/devcollab-web/app/(auth)/login/page.tsx lines 83–87: "Demo Credentials" panel with all three accounts and Demo1234! password |
| 9 | Login page redirects to /w/devcollab-demo after successful auth | VERIFIED | apps/devcollab-web/app/(auth)/login/page.tsx line 28: `router.push('/w/devcollab-demo')` |
| 10 | No purple colors appear anywhere in new or modified files | VERIFIED | grep for 'purple' across all 6 modified/created files returned no matches |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/devcollab-database/prisma/seed.ts` | Deterministic seed with faker.seed(42) and idempotency guard | VERIFIED | 187 lines; faker.seed(42) line 6; idempotency guard lines 9–14; 3 users, slug devcollab-demo, 5 languages, 3 Published posts with comments/@mentions/reactions/notifications, all ActivityEvent types |
| `packages/devcollab-database/Dockerfile.seed` | Copies both prisma/ and src/ directories | VERIFIED | Lines 6–8: `COPY packages/devcollab-database/prisma ./packages/devcollab-database/prisma`, `COPY packages/devcollab-database/src ./packages/devcollab-database/src`, `COPY node_modules ./node_modules` |
| `packages/devcollab-database/package.json` | seed script entry using tsx | VERIFIED | Both `scripts.seed` and `prisma.seed` set to `"tsx prisma/seed.ts"` |
| `docker-compose.yml` | devcollab-seed service with migrate dependency; devcollab-api depends on seed | VERIFIED | Lines 72–82: devcollab-seed service; lines 95–96: devcollab-api depends on devcollab-seed:service_completed_successfully |
| `apps/web/app/(portfolio)/projects/devcollab/page.tsx` | DevCollab case study with NEXT_PUBLIC_DEVCOLLAB_URL and /w/devcollab-demo deep-link | VERIFIED | 425 lines; line 7: env var; lines 56 and 413: `${DEVCOLLAB_URL}/w/devcollab-demo` hrefs |
| `apps/web/app/(portfolio)/page.tsx` | Homepage with DevCollab card in two-column grid | VERIFIED | md:grid-cols-2 grid at line 28; DevCollab card at lines 74–82 with href=/projects/devcollab |
| `apps/web/app/(portfolio)/projects/page.tsx` | Projects listing with DevCollab ProjectCard | VERIFIED | Line 24: `title="DevCollab"`, line 27: `href="/projects/devcollab"` |
| `apps/devcollab-web/app/(auth)/login/page.tsx` | Login page with demo credential hint and /w/devcollab-demo redirect | VERIFIED | Demo Credentials panel lines 83–87; router.push('/w/devcollab-demo') line 28 |
| `apps/devcollab-web/app/w/[slug]/layout.tsx` | Workspace layout with auth redirect | VERIFIED | Added in commit 8c9edc7; line 16–18: if no token, redirect('/login') — ensures unauthenticated clicks on the deep-link land on the credential-hinted login page |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/devcollab-database/prisma/seed.ts` | `packages/devcollab-database/src/client.ts` | relative import `'../src/client'` | VERIFIED | seed.ts line 3: `import { prisma } from '../src/client'` |
| `docker-compose.yml devcollab-seed` | `devcollab-migrate` | depends_on service_completed_successfully | VERIFIED | docker-compose.yml line 77–78: condition confirmed |
| `apps/web/app/(portfolio)/projects/devcollab/page.tsx` | `NEXT_PUBLIC_DEVCOLLAB_URL` | process.env.NEXT_PUBLIC_DEVCOLLAB_URL | VERIFIED | Line 7: `const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL \|\| 'http://localhost:3002'` |
| `apps/web/app/(portfolio)/projects/devcollab/page.tsx` | `/w/devcollab-demo` | View Live Demo and Launch Demo button hrefs | VERIFIED | Line 56: `href={\`${DEVCOLLAB_URL}/w/devcollab-demo\`}`; line 413: same — GAP CLOSED |
| `apps/web/app/(portfolio)/page.tsx` | `/projects/devcollab` | Link href | VERIFIED | Line 76: `href="/projects/devcollab"` |
| `apps/devcollab-web/app/(auth)/login/page.tsx` | `/w/devcollab-demo` | router.push after successful login | VERIFIED | Line 28: `router.push('/w/devcollab-demo')` |
| `apps/devcollab-web/app/w/[slug]/layout.tsx` | `/login` | redirect when no devcollab_token cookie | VERIFIED | Lines 14–18: cookie check + redirect guard — unauthenticated deep-link clicks route through login |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| SEED-01 | 21-01, 21-03 | Demo workspace exists on first launch with realistic content (deterministic faker seed) | SATISFIED | seed.ts: faker.seed(42), 3 users (Admin/Contributor/Viewer), workspace slug devcollab-demo, 5 snippets in TypeScript/Python/Rust/Go/SQL, 3 Published posts with @mention comments, reactions, notifications, 11+ ActivityEvents |
| SEED-02 | 21-01, 21-03 | Demo workspace demonstrates all three roles (Admin, Contributor, Viewer accounts) | SATISFIED | seed.ts creates all 3 users with correct role assignments and Demo1234! password; login page shows credentials; post-auth redirect to /w/devcollab-demo; workspace layout redirects unauthenticated to /login |
| PORT-01 | 21-02, 21-03 | DevCollab project card on portfolio homepage alongside TeamFlow | SATISFIED | apps/web/app/(portfolio)/page.tsx: md:grid-cols-2 grid with both TeamFlow and DevCollab cards; apps/web/app/(portfolio)/projects/page.tsx: DevCollab ProjectCard with href=/projects/devcollab |
| PORT-02 | 21-02, 21-03 | DevCollab case study page exists at /projects/devcollab with technology decisions and lessons learned | SATISFIED | 425-line page with 6 CaseStudySections including 5-decision technical table (tsvector, Tiptap, migrate service, CASL guard, Shiki) and 3 challenges/solutions |
| PORT-03 | 21-02, 21-03 | Portfolio links to DevCollab live demo | SATISFIED | Both "View Live Demo" (line 56) and "Launch Demo" (line 413) buttons link to `${DEVCOLLAB_URL}/w/devcollab-demo`; workspace layout adds auth guard so unauthenticated users see credential-hinted login first |

No orphaned requirements — all 5 IDs declared across plans 21-01, 21-02, 21-03 are accounted for and SATISFIED.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No anti-patterns found in any key file. | — | — | — | — |

### Human Verification Required

#### 1. RBAC Enforcement Per Role

**Test:** Log in with contributor@demo.devcollab and attempt to manage workspace members (Admin-only action). Then log in with viewer@demo.devcollab and attempt to create a snippet or post.
**Expected:** Contributor cannot access member management. Viewer receives 403 on any create/edit action.
**Why human:** CASL guard denials are runtime behavior enforced at the NestJS API layer. Static analysis of the seed script and frontend cannot confirm role-enforcement works correctly end-to-end.

#### 2. Docker Compose First-Launch Sequence

**Test:** Bring down all devcollab services and remove volumes. Run `docker compose up` from a clean state. Watch the service startup order in logs.
**Expected:** devcollab-migrate completes first (exit 0), devcollab-seed runs next and prints "Seed complete — DevCollab demo workspace ready", then devcollab-api starts with pre-seeded data accessible.
**Why human:** Docker `service_completed_successfully` orchestration timing requires a live environment. The static configuration is correct, but actual sequencing cannot be confirmed programmatically.

### Gaps Summary

No gaps. All 10 observable truths verified. The one gap from the initial verification (PORT-03 deep-link buttons) was closed in commit `8c9edc7`. All 5 requirements (SEED-01, SEED-02, PORT-01, PORT-02, PORT-03) are satisfied by verified artifacts and wiring.

Two items remain for human verification (RBAC enforcement and docker compose startup sequence) — these are runtime behaviors that cannot be confirmed by static analysis.

---

_Verified: 2026-02-18T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
