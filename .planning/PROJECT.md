# Fernando Millan Portfolio & TeamFlow

## What This Is

A professional portfolio website showcasing TeamFlow—a production-quality work management SaaS application. TeamFlow demonstrates senior full-stack engineering capabilities through real-time collaboration features, role-based access control, comprehensive audit logging, and a production-ready accessibility-first design system. The portfolio serves as a marketing hub for job hunting, presenting TeamFlow as a complete product with live demo, case study, and source code.

## Core Value

Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

## Current Milestone: v2.0 DevCollab

**Goal:** Build and deploy DevCollab — a developer collaboration platform combining GitHub-style technical content with Discord-style workspace organization, added to the portfolio alongside TeamFlow.

**Target features:**
- New monorepo apps: devcollab-web (Next.js 15) + devcollab-api (NestJS 11) with own auth
- Workspaces with invite-based membership and RBAC (Admin / Contributor / Viewer)
- Code snippets with syntax highlighting, Markdown posts, file uploads (S3/R2)
- Threaded discussions, activity feed, mention notifications
- Full-text search across workspace content
- Deployed to Coolify with seed data, live demo accessible to recruiters
- Portfolio site updated: new project card, case study, live demo link

## Requirements

### Validated

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

### Active

**v2.0 Requirements (DevCollab):**
- [ ] DevCollab monorepo setup: devcollab-web + devcollab-api apps in existing Turborepo
- [ ] Own auth system for DevCollab (separate from TeamFlow accounts)
- [ ] Workspace creation, invite-based membership management
- [ ] RBAC: Admin / Contributor / Viewer roles with enforced permissions
- [ ] Code snippet posts with syntax highlighting
- [ ] Markdown-based posts (documentation, proposals)
- [ ] File uploads with S3/R2 storage integration
- [ ] Threaded discussions on posts and snippets
- [ ] Workspace activity feed (track member changes)
- [ ] Mention notifications (in-app)
- [ ] Full-text search across workspace content
- [ ] Seed data (demo workspace with realistic content)
- [ ] Deployed to Coolify with live demo
- [ ] Portfolio site: DevCollab project card, case study, live demo link

### Deferred (Post-v2.0)

- TeamFlow deployment to Coolify (deferred from v1.2)
- Real resume PDF at /resume.pdf (deferred from v1.2)
- TypeScript error cleanup in test files (deferred from v1.2)
- Real-time collaboration UI fixes (conflict indicators, presence avatars)
- Team invitation via email for TeamFlow
- File attachments on TeamFlow tasks
- Comment threads on TeamFlow tasks
- Storybook / component playground
- Mobile native app

### Out of Scope

- Mobile native app — Web-first, mobile later
- Email notifications — In-app only for v1
- Real billing integration — Fake pricing page acceptable
- Advanced analytics — Basic metrics only
- File attachments — Defer to future version
- Team invites via email — Manual team setup for v1
- Comment threads on tasks — Keep tasks simple initially

## Context

**Purpose**: Job hunting for senior full-stack developer roles. Need an impressive, interactive demo that showcases production-level thinking and execution.

**Current state:** v1.1 shipped 2026-02-17. Design system complete. ~14,714 LOC in web app (TypeScript/TSX). Application is functionally complete and accessible. Not yet deployed to production.

**Tech stack:** Next.js 15 + NestJS 11 + Prisma + Postgres + NextAuth v5 + Socket.io + Radix UI + Shadcn UI + Tailwind v4 + dnd-kit + TanStack Table + Playwright + Vitest

**Deployment status:** Docker infrastructure ready (dev + production Dockerfiles), CI/CD pipeline with GitHub Actions → GHCR → Coolify. Not yet triggered for live deployment.

**Target audience**: Technical recruiters and hiring managers who will evaluate code quality, architecture decisions, and production readiness.

## Constraints

- **Tech Stack**: Next.js + NestJS + Prisma + Postgres + NextAuth + WebSockets — Stack is decided, no experimentation
- **Infrastructure**: Docker for development, Coolify deployment
- **Solo builder**: Fernando building this himself, needs clear priorities and sequencing
- **No purple**: Never use purple in any design (user requirement)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate Next.js + NestJS apps | Shows backend architecture skills, not just Next.js API routes | ✓ Good — demonstrates full-stack depth |
| WebSockets over Pusher | More impressive technically, demonstrates real-time implementation skills | ✓ Good — real-time features work after Phase 7.1 |
| NextAuth over Clerk | More control and shows auth implementation, not just integration | ✓ Good — JWT strategy with NestJS verified working |
| Monorepo structure | Professional org-level architecture, easier to showcase | ✓ Good — Turborepo working well |
| Demo workspace seeding | Recruiters can immediately interact without setup friction | — Pending (seeding not yet implemented) |
| Radix Colors over OKLCH hand-rolled | APCA-validated scale steps eliminate WCAG guesswork | ✓ Good — 0 axe violations vs 10 violations before |
| Shadcn UI for component library | Owned source files, not a runtime dependency | ✓ Good — allows full customization |
| Tailwind v4 CSS-first approach | Future-proof; CSS @theme instead of JS config | ✓ Good — HMR confirmed at 233-263ms |
| ESLint governance in CI | Prevents deprecated component imports from re-appearing | ✓ Good — zero violations, catches violations immediately |
| Lighthouse CI scoped to public routes | Dashboard requires auth, lhci cannot authenticate | ✓ Good — public routes performance-gated |
| v1.1 before deployment | Design system needed before production launch for professionalism | ✓ Good — application now WCAG AA compliant |

---
*Last updated: 2026-02-17 after v2.0 milestone started — DevCollab*
