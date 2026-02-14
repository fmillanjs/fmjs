# Fernando Millan Portfolio & TeamFlow

## What This Is

A professional portfolio website showcasing TeamFlow—a production-quality work management SaaS application. TeamFlow demonstrates senior full-stack engineering capabilities through real-time collaboration features, role-based access control, and comprehensive audit logging. The portfolio serves as a marketing hub for job hunting, presenting TeamFlow as a complete product with live demo, case study, and source code.

## Core Value

Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] TeamFlow authentication with NextAuth
- [ ] RBAC system (Admin, Manager, Member roles)
- [ ] Team management and workspace creation
- [ ] Project creation and management
- [ ] Kanban board with drag-and-drop
- [ ] Task CRUD operations
- [ ] Real-time updates via WebSockets
- [ ] Audit log (activity tracking)
- [ ] Seeded demo workspace with sample data
- [ ] Portfolio website with professional design
- [ ] TeamFlow case study page (problem, solution, architecture, tech decisions)
- [ ] Production polish (dark mode, loading states, error handling, empty states)
- [ ] Responsive design (mobile-friendly)
- [ ] Clean GitHub repository
- [ ] API documentation
- [ ] Proper 404/500 error pages

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
*Last updated: 2026-02-14 after initialization*
