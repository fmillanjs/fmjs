# Fernando Millan Portfolio & TeamFlow

## What This Is

A professional portfolio website showcasing TeamFlow—a production-quality work management SaaS application. TeamFlow demonstrates senior full-stack engineering capabilities through real-time collaboration features, role-based access control, and comprehensive audit logging. The portfolio serves as a marketing hub for job hunting, presenting TeamFlow as a complete product with live demo, case study, and source code.

## Core Value

Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

## Current Milestone: v1.1 - UI/Design System Overhaul

**Goal:** Establish a production-ready design system foundation with WCAG AA compliance and accessibility-first components.

**Target features:**
- WCAG AA color compliance (4.5:1 text contrast, 3:1 UI element contrast)
- Fix Tailwind v4 configuration (CSS pipeline working correctly)
- Shadcn UI integration (adopt as design system foundation)
- Semantic design tokens (CSS variables for consistent theming)
- Accessibility-first component library (forms, buttons, modals, all core UI)

**Context:** Addresses critical blocker from Phase 07.1-03 where spot fixes failed due to systemic design issues. Establishes proper foundations that make WCAG compliance built-in rather than retrofitted.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**v1.1 Requirements (UI/Design System Overhaul):**
- [ ] WCAG AA color palette implementation
- [ ] Semantic design token system (CSS variables)
- [ ] Shadcn UI integration and configuration
- [ ] Tailwind v4 configuration fixes (CSS pipeline)
- [ ] Accessibility-first form components (inputs, selects, textareas)
- [ ] Accessibility-first button components with focus states
- [ ] Accessibility-first modal/dialog components
- [ ] Comprehensive dark mode implementation
- [ ] Component library documentation
- [ ] Regression testing suite (ensure no feature breakage)

### Deferred (Post-v1.1)

**v1.0 Incomplete Requirements** (deferred until design system complete):
- Real-time collaboration UI fixes (conflict indicators, presence avatars with proper contrast)
- WCAG compliance retrofitting (superseded by v1.1 design system)
- Additional v1.0 polish items requiring design system foundation

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

**Timeline pressure**: 3-4 weeks to complete both TeamFlow and portfolio site.

**Target audience**: Technical recruiters and hiring managers who will evaluate code quality, architecture decisions, and production readiness.

**Strategy**: Treat TeamFlow as a real product with marketing site (portfolio), live demo environment, and comprehensive case study. Show product thinking, not just coding ability.

## Constraints

- **Timeline**: 3-4 weeks — Must be ruthless about scope to hit deadline
- **Tech Stack**: Next.js + NestJS + Prisma + Postgres + NextAuth + WebSockets — Stack is decided, no experimentation
- **Infrastructure**: Docker for development, Coolify deployment after completion
- **Solo builder**: Fernando building this himself, needs clear priorities and sequencing
- **Job hunt deadline**: This is blocking active job search

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate Next.js + NestJS apps | Shows backend architecture skills, not just Next.js API routes | — Pending |
| WebSockets over Pusher | More impressive technically, demonstrates real-time implementation skills | — Pending |
| NextAuth over Clerk | More control and shows auth implementation, not just integration | — Pending |
| Monorepo structure | Professional org-level architecture, easier to showcase | — Pending |
| Demo workspace seeding | Recruiters can immediately interact without setup friction | — Pending |

---
*Last updated: 2026-02-16 after milestone v1.1 started*
