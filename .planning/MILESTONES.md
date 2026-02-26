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

## v2.5 Matrix Portfolio Overhaul (Shipped: 2026-02-19)

**Phases:** 22–26 (5 phases, 17 plans)
**Timeline:** 2026-02-18 → 2026-02-19 (~2 days)
**Files changed:** 109 files, 67 commits
**Current LOC:** ~15,726 TypeScript/TSX (apps/web)
**Git range:** `1169803` → `eb4005b`

**Key accomplishments:**
- Matrix green CSS token system (`--matrix-green: #00FF41`, `--matrix-green-dim`, `--matrix-green-ghost`) added to `:root` with `.matrix-theme` scoped to portfolio layout wrapper — dark-first `#0a0a0a` background activated without touching dashboard routes
- Hero `MatrixRainCanvas` component (30fps RAF, `aria-hidden`, `next/dynamic ssr:false`) passing Lighthouse CI ≥ 0.90 on all five portfolio URLs — memory-safe via `cancelAnimationFrame` on unmount
- Motion v12 scroll-reveal (`AnimateIn`, `StaggerContainer`, `StaggerItem`) applied across all portfolio pages with `MotionConfig reducedMotion="user"` gate — zero hydration warnings, animations fire exactly once per page visit
- Personality effects: hand-rolled `useTextScramble` RAF hook (no new dependency), Evervault card noise-decryption hover (motion/react mask-image + `useMotionTemplate`), dot-grid + mouse spotlight (`any-hover: hover` guard, CSS custom property cursor tracking)
- Awwwards-style navigation with Motion `layoutId` active indicator, sliding Matrix-green hover underline, refined Awwwards typography — Playwright 10/10 + lhci 1.0 on all 5 URLs, human SC-1–SC-5 approved

**Requirements satisfied:** 13/13 (THEME-01–04, ANIM-01–03, FX-01–04, UX-01, UX-04)

**Archive:** `.planning/milestones/v2.5-ROADMAP.md`, `.planning/milestones/v2.5-REQUIREMENTS.md`

---


## v3.0 Deployment & Tech Debt Closure (Shipped: 2026-02-21)

**Phases completed:** 11 phases, 52 plans, 50 tasks

**Key accomplishments:**
- (none recorded)

---


## v3.1 Portfolio Polish & Matrix Cohesion (Shipped: 2026-02-21)

**Phases completed:** 14 phases, 60 plans, 48 tasks

**Key accomplishments:**
- (none recorded)

---


## v4.0 Live QA & Content Polish (Shipped: 2026-02-26)

**Phases:** 34–37 (4 phases, 9 plans)
**Timeline:** 2026-02-25 → 2026-02-26 (2 days)
**Files changed:** 41 files, +4,645 / -132 lines

**Key accomplishments:**
- Fixed live auth on both apps — COOKIE_DOMAIN cross-subdomain sharing, AUTH_TRUST_HOST behind Coolify reverse proxy, PORT env var, Redis deadlock fix, CORS_ORIGIN; both demos fully functional for recruiters
- Fixed DevCollab logout redirect using `x-forwarded-host` headers so container URL resolves to public domain correctly
- Fixed TeamFlow Kanban session hydration race + Socket.IO presence join race condition (join room before async Prisma queries)
- Fixed portfolio CTA link (relative `/teams` → absolute production URL) + added Playwright regression assertions for both CTA hrefs
- Lighthouse CI gate passed — all 5 public portfolio URLs scoring 0.97–1.00 performance
- Rewrote both case studies with accurate copy — react-markdown replacing Tiptap references, real-time presented as shipped reality
- Corrected tech stack badge arrays on home + projects pages to match deployed package.json exactly
- Captured 4 live production screenshots at 1280×800 and wired into case study pages + ProjectCard component

**Requirements satisfied:** 12/12 (LIVE-01–04, QA-01–04, CONT-01–04)

**Known Tech Debt (accepted at ship):**
- QA-01, QA-02, QA-04: human walkthrough documented in SUMMARYs; static re-run not repeatable without live session
- AUTH_TRUST_HOST=true set in Coolify env only — cannot verify statically
- CONT-04: 4 PNGs present and wired; browser visit to confirm no CLS deferred

**Archive:** `.planning/milestones/v4.0-ROADMAP.md`, `.planning/milestones/v4.0-REQUIREMENTS.md`

---


## v4.1 Screenshot Story Walkthroughs (Shipped: 2026-02-26)

**Phases:** 38–40 (3 phases, 7 plans)
**Timeline:** 2026-02-26 → 2026-02-26 (~1 day)
**Files changed:** 42 files, +3,318 / -212 lines

**Key accomplishments:**
- Captured 10 production workflow screenshots (5 TeamFlow + 5 DevCollab) from live authenticated sessions via standalone Playwright chromium scripts — all exactly 1280×800px, stored in `apps/web/public/screenshots/`
- Built typed screenshots manifest (`screenshots-manifest.ts`) with `Screenshot` interface, `TEAMFLOW_SCREENSHOTS` and `DEVCOLLAB_SCREENSHOTS` arrays — alt text + label fields for next/image and walkthrough legend
- Built `WalkthroughSection` React component with Matrix styling (`#0a0a0a` background, `--matrix-green` accents, monospace labels), scroll-reveal via `AnimateIn`/`StaggerContainer`, and `prefers-reduced-motion` compliance
- Created `walkthrough-data.ts` with typed callout step definitions for both apps; Lighthouse CI accessibility gate hardened from warn to error
- Integrated `WalkthroughSection` into both case study pages (`/projects/teamflow`, `/projects/devcollab`) replacing static Screenshots sections
- Lighthouse CI passing: performance ≥ 0.90, accessibility 1.0 on all 5 portfolio pages — aria-labels on callout overlays, explicit accessible colors on nav/footer, SSR dark mode via `class="dark"` on `<html>`

**Requirements satisfied:** 12/12 (SHOT-01–03, WALK-01–04, INTG-01–02, QA-01–03)

**Archive:** `.planning/milestones/v4.1-ROADMAP.md`, `.planning/milestones/v4.1-REQUIREMENTS.md`

---

