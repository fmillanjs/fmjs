# Fernando Millan Portfolio & DevCollab

## What This Is

A professional portfolio showcasing two production-quality SaaS applications built by Fernando Millan: **TeamFlow** (work management with real-time collaboration, RBAC, and audit logging) and **DevCollab** (a developer collaboration platform with GitHub-style code snippets, Markdown posts, threaded discussions, notifications, full-text search, and workspace RBAC). Both applications live in a Turborepo monorepo with separate databases, separate auth systems, and shared CI/CD infrastructure. The portfolio presents both apps with live demos, case studies, and source code — wrapped in a Matrix-inspired dark aesthetic with scroll-reveal animations, canvas digital rain, mouse spotlight effects, and Awwwards-quality navigation — targeting senior full-stack developer hiring managers.

## Core Value

Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## Current State: v3.0 Shipped 2026-02-20

Both SaaS applications are live at HTTPS custom domains. All milestones complete. Portfolio is production-ready for recruiter evaluation.

## Requirements

### Validated

**v1.0 (TeamFlow Foundation):**
- ✓ Real-time task collaboration (WebSockets) — v1.0
- ✓ Role-based access control (Admin / Manager / Member) — v1.0
- ✓ Audit logging for all team actions — v1.0
- ✓ Portfolio site with TeamFlow live demo link and case study — v1.0
- ✓ NextAuth JWT authentication with NestJS integration — v1.0
- ✓ Task management (create, assign, drag-and-drop prioritization) — v1.0

**v1.1 (Design System):**
- ✓ WCAG AA color palette implementation — v1.1 (Radix Colors, 0 axe violations)
- ✓ Semantic design token system (CSS variables) — v1.1 (Radix 2-layer pattern, @theme inline)
- ✓ Shadcn UI integration and configuration — v1.1 (components.json, new-york style)
- ✓ Tailwind v4 configuration fixes (CSS pipeline) — v1.1 (233-263ms HMR confirmed)
- ✓ Accessibility-first form components (inputs, selects, textareas) — v1.1 (all 12 forms migrated)
- ✓ Accessibility-first button components with focus states — v1.1 (Radix Button, 6 variants)
- ✓ Accessibility-first modal/dialog components — v1.1 (Radix Dialog/AlertDialog, focus trap)
- ✓ Comprehensive dark mode implementation — v1.1 (Radix dark scales, next-themes)
- ✓ Component library documentation — v1.1 (DESIGN-SYSTEM.md, /design-system route)
- ✓ Regression testing suite (ensure no feature breakage) — v1.1 (Lighthouse CI + visual regression + axe)

**v2.0 (DevCollab):**
- ✓ DevCollab monorepo setup: devcollab-web + devcollab-api apps in existing Turborepo — v2.0
- ✓ Own auth system for DevCollab (separate from TeamFlow accounts) — v2.0
- ✓ Workspace creation, invite-based membership management — v2.0
- ✓ RBAC: Admin / Contributor / Viewer roles with enforced permissions — v2.0
- ✓ Code snippet posts with Shiki syntax highlighting (server-side, zero client JS) — v2.0
- ✓ Markdown-based posts with Tiptap v3 write/preview editor (SSR-validated) — v2.0
- ✓ Threaded discussions on posts and snippets (1-level deep, <5 queries) — v2.0
- ✓ Workspace activity feed (30s poll, cursor pagination) — v2.0
- ✓ Mention notifications (in-app, @name, bell icon, unread badge) — v2.0
- ✓ Full-text search across workspace content (Postgres tsvector, Cmd+K modal) — v2.0
- ✓ Seed data (demo workspace with all three roles, deterministic faker.seed(42)) — v2.0
- ✓ Portfolio site: DevCollab project card, case study at /projects/devcollab, live demo link — v2.0

**v2.5 (Matrix Portfolio Overhaul):**
- ✓ Dark-first Matrix theme scoped to portfolio routes via `.matrix-theme` class — v2.5 (THEME-01, THEME-02)
- ✓ Animation packages (motion v12, gsap, @gsap/react, lenis) installed workspace-scoped — v2.5 (THEME-03)
- ✓ Full reduced-motion gate: CSS global rule + RAF check + MotionConfig — v2.5 (THEME-04)
- ✓ Hero Matrix digital rain canvas (30fps, aria-hidden, memory-safe, SSR-safe) — v2.5 (ANIM-02)
- ✓ Lighthouse CI ≥ 0.90 on all five portfolio URLs after canvas added — v2.5 (ANIM-03)
- ✓ Scroll-reveal animations across all portfolio pages (fade + slide-up, stagger on cards) — v2.5 (ANIM-01)
- ✓ Hero text scramble effect (fires once on load, hand-rolled RAF hook) — v2.5 (FX-01)
- ✓ Blinking terminal cursor after hero tagline via pure CSS ::after — v2.5 (FX-02)
- ✓ Evervault-style noise decryption on project card hover — v2.5 (FX-03)
- ✓ Dot-grid background + mouse spotlight (any-hover guard, no touch artifacts) — v2.5 (FX-04)
- ✓ Matrix green border glow on project card hover — v2.5 (UX-01)
- ✓ Awwwards-style nav with Motion layoutId active indicator + sliding hover underline — v2.5 (UX-04)

**v3.0 (Deployment & Tech Debt Closure):**
- ✓ DevCollab deployed to Coolify at `devcollab.fernandomillan.me` (HTTPS, custom domain) — v3.0
- ✓ TeamFlow deployed to Coolify at `teamflow.fernandomillan.me` (HTTPS, custom domain) — v3.0
- ✓ NEXT_PUBLIC_API_URL baked into devcollab-web Docker image at build time via GitHub Actions `--build-arg` — v3.0
- ✓ Real resume PDF served at `/resume.pdf` on portfolio — v3.0
- ✓ Admin invite link UI: generate shareable join URLs with modal + Copy + Regenerate — v3.0
- ✓ Member management UI: view/promote/demote/remove workspace members — v3.0
- ✓ Dashboard server-side auth guard: zero content flash redirect to `/login` — v3.0
- ✓ Prisma import isolation: `reactions.service.ts` uses `.prisma/devcollab-client` runtime — v3.0

## Current Milestone: v3.1 Portfolio Polish & Matrix Cohesion

**Goal:** Apply the Matrix aesthetic consistently across the entire portfolio and ship the remaining deferred animation features for an Awwwards-quality, cohesive final product.

**Target features:**
- Lenis smooth scroll throughout portfolio
- GSAP parallax depth effects on scroll
- Magnetic buttons on CTAs
- Matrix color harmony: project cards/case studies, skills/about, contact/CTA, typography
- Footer redesign with Matrix animation effect

### Active

- [ ] Lenis smooth scroll integrated across all portfolio pages
- [ ] GSAP parallax effects on scroll
- [ ] Magnetic button component on CTA elements
- [ ] Matrix color harmony applied to project cards and case study pages
- [ ] Matrix color harmony applied to skills/about section
- [ ] Matrix color harmony applied to contact/CTA sections and typography
- [ ] Footer redesigned with Matrix animation

### Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, mobile later |
| Email notifications | In-app only; SMTP + deliverability overhead not worth it for portfolio demo |
| Real billing integration | Fake pricing page acceptable |
| Real-time activity feed (WebSocket) | 30s polling appropriate for content platform; WebSocket adds complexity with no recruiter-visible benefit |
| Content version history + diff view | HIGH complexity; deferred to v3+ |
| OAuth login for DevCollab | Email/password sufficient for portfolio demo |
| Voice/video channels | Out of DevCollab scope |
| Meilisearch | Postgres tsvector sufficient at portfolio scale; no extra Docker service needed |
| Multi-tenant billing | Not applicable to portfolio demo |
| Full-screen Matrix rain at readable opacity | Content becomes unreadable; vestibular accessibility violation |
| Looping typewriter cycling role titles | Overused since 2019; hiring managers flagged as junior red flag |
| Loading screen or splash animation | Mandatory wait causes tab closes from recruiters |
| p5.js or three.js for rain effect | 9MB / 600KB — destroys Lighthouse score |
| Purple in any design element | User requirement, all milestones |
| ANIM-04/05/06 entrance animations + GSAP parallax + Lenis | Deferred to v3.0+ after v2.5 shipped without them |
| UX-02/03 magnetic buttons + stat counters | Deferred to v3.0+ |

## Context

**Purpose:** Job hunting for senior full-stack developer roles. Need an impressive, interactive demo showcasing production-level thinking and execution.

**Current state:** v3.0 shipped 2026-02-20. Both apps are live in production. Total: ~27,942 TypeScript/TSX LOC across the monorepo.

**Deployed apps:**
- `https://devcollab.fernandomillan.me` — DevCollab web (Next.js 15, NestJS 11 API, Postgres)
- `https://devcollab-api.fernandomillan.me` — DevCollab API
- `https://teamflow.fernandomillan.me` — TeamFlow web (Next.js 15, NestJS 11 API, Postgres, Redis)
- `https://fernandomillan.me` — Portfolio site

**Tech stack (TeamFlow):** Next.js 15 + NestJS 11 + Prisma + Postgres + NextAuth v5 + Socket.io + Radix UI + Shadcn UI + Tailwind v4 + dnd-kit + TanStack Table + Playwright + Vitest

**Tech stack (DevCollab):** Next.js 15 + NestJS 11 + Prisma + Postgres (separate DB, port 5435) + CASL + Shiki + Tiptap v3 + Vitest

**Tech stack (Portfolio UI):** motion v12, gsap + @gsap/react, lenis, @lhci/cli

**CI/CD:** GitHub Actions builds 4 GHCR images (devcollab-web, devcollab-api, devcollab-migrate, teamflow images) and triggers Coolify deploys via GET + Bearer token webhooks on push to main.

**Target audience:** Technical recruiters and hiring managers evaluating code quality, architecture decisions, and production readiness.

## Constraints

- **Tech Stack:** Next.js + NestJS + Prisma + Postgres — Stack is decided, no experimentation
- **Infrastructure:** Docker for development, Coolify deployment
- **Solo builder:** Fernando building this himself, needs clear priorities and sequencing
- **No purple:** Never use purple in any design (user requirement)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate Next.js + NestJS apps | Shows backend architecture skills, not just Next.js API routes | ✓ Good — demonstrates full-stack depth |
| WebSockets over Pusher (TeamFlow) | More impressive technically, demonstrates real-time implementation skills | ✓ Good — real-time features work after Phase 7.1 |
| NextAuth over Clerk (TeamFlow) | More control and shows auth implementation, not just integration | ✓ Good — JWT strategy with NestJS verified working |
| Monorepo structure (Turborepo) | Professional org-level architecture, easier to showcase | ✓ Good — both apps sharing CI/CD infrastructure cleanly |
| Radix Colors over OKLCH hand-rolled | APCA-validated scale steps eliminate WCAG guesswork | ✓ Good — 0 axe violations vs 10 violations before |
| Shadcn UI for component library | Owned source files, not a runtime dependency | ✓ Good — allows full customization |
| Tailwind v4 CSS-first approach | Future-proof; CSS @theme instead of JS config | ✓ Good — HMR confirmed at 233-263ms |
| ESLint governance in CI | Prevents deprecated component imports from re-appearing | ✓ Good — zero violations |
| Lighthouse CI scoped to public routes | Dashboard requires auth, lhci cannot authenticate | ✓ Good — public routes performance-gated |
| v1.1 design system before deployment | Needed for professionalism before production launch | ✓ Good — application now WCAG AA compliant |
| Separate Prisma client for DevCollab | Isolates DevCollab schema from TeamFlow's @prisma/client | ✓ Good — output to `.prisma/devcollab-client`, globalThis key `devcollabPrisma` avoids collision |
| Deny-by-default CASL guard installed in Phase 14 | Security invariant active before any feature code | ✓ Good — meta-test TDD invariant catches uncovered endpoints in CI |
| DEVCOLLAB_JWT_SECRET completely separate from TeamFlow | No shared auth surface between the two apps | ✓ Good — full isolation demonstrated |
| Postgres tsvector over Meilisearch | Adequate at portfolio scale, no extra Docker service | ✓ Good — tsvector trigger pattern eliminates migration drift |
| Tiptap v3 with immediatelyRender: false | Prevents hydration errors in Next.js 15 App Router SSR | ✓ Good — validated with next build && next start before merge |
| 30s polling over WebSockets (DevCollab activity feed) | Lower complexity, appropriate latency for content platform | ✓ Good — no visible recruiter difference |
| Flat comment model + in-memory tree assembly | <5 Prisma queries per thread fetch, no N+1 | ✓ Good — scalable at demo scale |
| faker.seed(42) deterministic seed | Identical content on every seed run, no duplicates on re-run | ✓ Good — idempotency verified in Phase 21-03 |
| Login redirect to /w/devcollab-demo post-auth | Recruiter lands directly in seeded workspace without navigation | ✓ Good — zero friction demo experience |
| Matrix tokens in :root (not @theme) | Raw CSS vars consumed as var(--matrix-green), not Tailwind utility tokens | ✓ Good — additive, no Tailwind cascade conflict |
| .matrix-theme CSS class on portfolio layout div | Scoped dark-first theming without touching html/body or dashboard routes | ✓ Good — clean cascade, zero dashboard side effects |
| motion (NOT framer-motion) import from motion/react | Required for React 19 + Next.js 15 compatibility | ✓ Good — no peer dep issues |
| Hero canvas loaded via next/dynamic(ssr:false) from 'use client' wrapper | Next.js 15 regression #72236 blocks dynamic(ssr:false) from Server Components | ✓ Good — SSR-safe, hydration-clean |
| CSS opacity 0.05 on canvas element (not ctx.globalAlpha) | Composites entire frame at 5% so trail effect works correctly | ✓ Good — visual correctness preserved |
| THEME-04 three-layer reduced-motion implementation | CSS rule (Phase 22) + RAF check (Phase 23) + MotionConfig (Phase 24) | ✓ Good — comprehensive, no animation leaks |
| Hand-rolled useTextScramble RAF hook (not use-scramble package) | Avoids React 19 peer dep uncertainty; ~50 lines, zero risk | ✓ Good — no dependency issues |
| EvervaultCard noise overlay uses pointer-events-none | Prevents click interception on project card links | ✓ Good — card links still work |
| any-hover: hover CSS guard for spotlight (not pointer: fine) | Correctly enables spotlight on hybrid laptop+touch devices | ✓ Good — no touch artifacts |
| No LayoutGroup wrapper for nav active indicator | Only one nav in DOM, layoutId resolves within same tree | ✓ Good — simpler, correct |
| lhci startServerCommand uses node .next/standalone/apps/web/server.js | next start returns 500 on output:standalone builds | ✓ Good — lhci runs correctly on production build |
| Coolify deployment deferred to v3.0 | DevCollab feature-complete locally; Coolify per-service webhook behavior for second app needs hands-on iteration | ✓ Good — deployed successfully after CI iteration |
| Coolify deploy API: GET + Bearer token | Coolify webhook uses GET request with Authorization: Bearer, not POST — discovered during CI iteration | ✓ Good — fixed in commit b71f065 |
| Separate webhook calls per Coolify service | Each service (web, api) in a Coolify stack needs its own webhook trigger | ✓ Good — added in commit c576019 |
| devcollab-migrate restart: "no" in coolify-compose | prisma migrate deploy exits 0 — without this Coolify infinitely restarts the migrate container | ✓ Good — prevents restart loop in production |
| VPS GHCR auth must be done as root | Coolify reads Docker credentials from /root/.docker/config.json — must `sudo su -` before docker login | ✓ Good — documented in 27-03-SUMMARY |
| Domain TLD is .me not .dev | Registrar uses fernandomillan.me — planned .dev never existed | ✓ Good — DNS confirmed for all subdomains |
| Server-side dashboard auth guard using cookies() + redirect() | Eliminates client-side auth flash; pattern from w/[slug]/layout.tsx | ✓ Good — zero flash confirmed in browser verification |
| window.location.origin for invite join URL | API_URL points to backend; join URL must use web app's own origin | ✓ Good — correct URL generated in production |

---
*Last updated: 2026-02-20 after v3.1 milestone started — Portfolio Polish & Matrix Cohesion*
