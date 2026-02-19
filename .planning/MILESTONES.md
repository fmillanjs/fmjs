# Milestones

## v2.0 DevCollab (Shipped: 2026-02-18)

**Phases:** 14–21 (8 phases, 32 plans)
**Timeline:** 2026-02-17 → 2026-02-18 (~2 days)
**Files changed:** 200 files, +37,125 / -6,132 lines
**DevCollab LOC:** ~8,288 TypeScript/TSX
**Git range:** `feat(14-01)` → `feat(21-02)`

**Key accomplishments:**
- Built DevCollab monorepo (devcollab-web port 3002 + devcollab-api port 3003) in existing Turborepo with isolated Postgres database, isolated Prisma client, and deny-by-default CASL guard active before any feature controllers
- Shipped standalone JWT authentication system (DEVCOLLAB_JWT_SECRET completely separate from TeamFlow), httpOnly cookie sessions, signup/login/logout/me flow with Next.js 15 App Router server components
- Workspaces with RBAC (Admin / Contributor / Viewer), invite-link flow (time-limited, single-use), slug routing, last-admin protection, and meta-test TDD invariant ensuring 100% endpoint coverage
- Code snippets with Shiki server-side syntax highlighting (zero client JS), Markdown posts with Tiptap v3 write/preview editor (SSR-validated with `next build && next start`)
- Threaded discussions (1-level deep, flat model + in-memory tree assembly, <5 Prisma queries), emoji reactions with toggle idempotency, @mention notifications with bell icon and unread badge, workspace activity feed with 30s polling
- Full-text search via Postgres tsvector trigger pattern + GIN index (Cmd+K modal, grouped results with ts_headline() highlighting, prefix matching, zero migration drift)
- Seed data with deterministic `faker.seed(42)` script demonstrating all three roles, plus portfolio update: DevCollab project card + case study at `/projects/devcollab` + live demo deep-link

**Requirements satisfied:** 41/41

**Known Tech Debt (accepted at ship):**
- WORK-02: Invite link generation has no web UI — API exists, seed data provides pre-created users as workaround
- WORK-04: Member management (view/promote/demote) is API-only — no frontend pages
- AUTH-03: `/dashboard` page missing server-side auth guard (workspace pages are protected via layout.tsx)
- INFRA-02: `reactions.service.ts` imports `PrismaClientKnownRequestError` from TeamFlow's `@prisma/client` path — functionally identical but violates isolation boundary
- Docker prod: `NEXT_PUBLIC_API_URL` not set in `docker-compose.yml` — client-side calls fall back to `localhost:3003` (correct for local dev; Coolify deployment deferred to v3.0)

**Archive:** `.planning/milestones/v2.0-ROADMAP.md`, `.planning/milestones/v2.0-REQUIREMENTS.md`

---

## v1.1 UI/Design System Overhaul (Shipped: 2026-02-17)

**Phases:** 8–13 (6 phases, 26 plans, 57 tasks)
**Timeline:** 2026-02-16 → 2026-02-17 (~2 days)
**Files changed:** 192 files, +21,806 / -3,205 lines
**Git range:** `9db2ddb` → `9ff29dc` (123 commits)

**Key accomplishments:**
- Validated Tailwind v4 setup (233-263ms HMR) and audited all 24 color token pairs for WCAG AA — 10 violations identified with specific OKLCH remediation plan
- Replaced OKLCH hand-rolled tokens with Radix Colors 14-scale system (2-layer token pattern) — all 10 WCAG violations resolved, 0 axe violations across 12 portfolio pages and 5 dashboard routes
- Installed Shadcn UI CLI with 8+ primitive components, ESLint governance blocking deprecated imports in CI
- Migrated all 12 application forms to Shadcn Form/Select with automatic aria-invalid/aria-describedby wiring and mode:onBlur validation
- Migrated all team, task, project, and portfolio UI to Shadcn — AlertDialog/Tabs/Popover/Card/Badge replacing custom patterns; old code deleted, MIG-03 grep clean
- Added Lighthouse CI (performance >=90 on 5 public routes), 18 visual regression PNG baselines, and hardened ESLint governance with zero deprecated imports

**Requirements satisfied:** 16/16 (FOUND-01–03, COLOR-01–04, COMP-01–05, MIG-01–04)

---
