# Roadmap: Fernando Millan Portfolio & TeamFlow

## Overview

This roadmap transforms Fernando's portfolio website into a compelling technical showcase by building TeamFlow—a production-quality work management SaaS application that demonstrates senior full-stack engineering capabilities. The journey progresses from foundational authentication and authorization patterns through core task management features, then adds the most technically impressive showcase element (real-time collaboration), and concludes with portfolio integration and production polish. Each phase builds on validated patterns from the previous phase, avoiding critical security pitfalls while delivering incrementally working software within the 3-4 week timeline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Establish security foundation with auth, RBAC, audit logging, and infrastructure (completed 2026-02-14)
- [x] **Phase 2: Core Work Management** - Build teams, projects, tasks, and views with proper data modeling (completed 2026-02-14)
- [x] **Phase 3: Real-Time Collaboration** - Add live updates, presence indicators, and conflict resolution (completed 2026-02-15)
- [x] **Phase 4: Portfolio & Polish** - Integrate portfolio website, polish UX, testing, and deploy to production (completed 2026-02-15)
- [x] **Phase 5.1: Authentication Investigation** - Debug WebSocket and SSR authentication issues blocking real-time features (completed 2026-02-15)
- [ ] **Phase 6: Authentication Fixes** - Fix JWT_SECRET configuration to unblock Phase 3 real-time features (in planning)

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Establish security foundation enabling all protected features with proper authentication, multi-layer authorization, audit logging, and technical infrastructure

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, RBAC-01, RBAC-02, RBAC-03, RBAC-04, RBAC-05, RBAC-06, AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-07, TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, TECH-06, TECH-08, DEPLOY-01, DEPLOY-03

**Success Criteria** (what must be TRUE):
  1. User can create account with email and password and have session persist across browser restarts
  2. User can log in, log out, and reset password via email link
  3. User can view and edit their profile information
  4. System enforces three-role RBAC (Admin, Manager, Member) at multiple layers with clear permission denied errors for unauthorized actions
  5. System logs all authentication events, authorization failures, and RBAC changes with user context, IP address, and user agent
  6. WebSocket connections authenticate via JWT and reject unauthenticated clients
  7. Monorepo structure shares types and validation schemas between frontend and backend with API documentation available

**Plans:** 7 plans (7/7 complete)

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold (Turborepo) + Docker infrastructure (Postgres, Redis)
- [x] 01-02-PLAN.md — Database schema (Prisma) + Shared Zod validators and TypeScript types
- [x] 01-03-PLAN.md — NestJS backend core (Swagger, health checks, validation, exception handling)
- [x] 01-04-PLAN.md — Next.js frontend + NextAuth v5 (login, signup, session, route protection)
- [x] 01-05-PLAN.md — Auth flows completion (password reset, profile view/edit, password change)
- [x] 01-06-PLAN.md — NestJS auth module + CASL RBAC (JWT strategy, three-role permissions)
- [x] 01-07-PLAN.md — Audit logging (event-driven) + WebSocket auth + Phase verification

### Phase 2: Core Work Management
**Goal**: Deliver complete task management capability with teams, projects, tasks, views, filtering, and activity tracking using optimized data models

**Depends on**: Phase 1

**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, AUDIT-05, AUDIT-06

**Success Criteria** (what must be TRUE):
  1. User can create teams, invite members, view member roles, and manage team membership with role-based restrictions
  2. User can create projects within teams, edit project details, archive projects, and delete projects (Admin only)
  3. User can create tasks with all fields (title, description, due date, priority, status, labels, assignee)
  4. User can edit, delete, comment on tasks, and view task history showing all changes
  5. User can view tasks in both list and Kanban board formats with drag-and-drop between status columns
  6. User can filter tasks by status, priority, assignee, and labels, plus search by title and description
  7. User can view activity feed for a project and searchable audit log (Admin only) showing who did what and when
  8. Demo workspace exists with seeded sample data ready for immediate recruiter interaction

**Plans:** 11 plans

Plans:
- [ ] 02-01-PLAN.md — Database schema (Organization, Membership, Project, Task, Label, Comment) + Shared types/validators
- [ ] 02-02-PLAN.md — Teams API (NestJS module with org-scoped RBAC, membership management)
- [ ] 02-03-PLAN.md — Projects API + Labels API (CRUD with org scoping, archive, admin-only delete)
- [ ] 02-04-PLAN.md — Tasks API + Comments API (full CRUD, filtering, search, audit events, activity/audit endpoints)
- [ ] 02-05-PLAN.md — Dashboard layout (sidebar, header) + Teams frontend (list, create, members, settings)
- [ ] 02-06-PLAN.md — Projects frontend (list, create, edit, archive, delete, project detail page)
- [ ] 02-07-PLAN.md — Task views: Kanban board (dnd-kit drag-drop) + List view (TanStack Table) + Task form
- [ ] 02-08-PLAN.md — Task filters (status, priority, assignee, labels) + Search + Sort (nuqs URL state)
- [ ] 02-09-PLAN.md — Task detail page (inline editing) + Comment thread + Task history timeline
- [ ] 02-10-PLAN.md — Activity feed (infinite scroll) + Admin audit log (searchable, filterable)
- [ ] 02-11-PLAN.md — Demo seed data (Faker) + Phase 2 end-to-end verification

### Phase 3: Real-Time Collaboration
**Goal**: Transform task management into live collaborative experience with WebSocket-based real-time updates, presence indicators, and conflict resolution

**Depends on**: Phase 2

**Requirements**: REAL-01, REAL-02, REAL-03, REAL-04, REAL-05, REAL-06, REAL-07, TECH-09

**Success Criteria** (what must be TRUE):
  1. User sees live updates when other users create tasks, move tasks between columns, or change task details without page refresh
  2. User sees live updates when comments are added to tasks they are viewing
  3. User sees presence indicators showing how many users are viewing the same project
  4. User experiences optimistic UI updates with automatic rollback on server failure
  5. System detects concurrent edits and shows clear conflict resolution UI to user
  6. WebSocket events use Redis pub/sub enabling horizontal scaling across multiple server instances

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Backend WebSocket infrastructure (Redis adapter, project rooms, task/comment event listeners, version field)
- [x] 03-02-PLAN.md — Frontend real-time task updates (WebSocket provider, hooks, Kanban/list integration)
- [x] 03-03-PLAN.md — Presence tracking + Real-time comments (presence indicator, live comment updates)
- [x] 03-04-PLAN.md — Conflict detection + End-to-end verification (version-based 409, conflict warning UI, full test)

### Phase 4: Portfolio & Polish
**Goal**: Complete professional portfolio website showcasing TeamFlow, polish UX for production quality, implement testing, and deploy with CI/CD

**Depends on**: Phase 3

**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07, PORT-08, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, TECH-07, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, DEPLOY-02, DEPLOY-04, DEPLOY-05

**Success Criteria** (what must be TRUE):
  1. Portfolio website has professional home page with hero section, About page with bio and stack, Resume page with download, and Contact form
  2. Portfolio showcases TeamFlow as featured project with comprehensive case study page explaining problem, solution, architecture, and tech decisions
  3. Portfolio and TeamFlow are both responsive and mobile-friendly with dark mode support
  4. Application shows loading skeletons during data fetch, proper error messages with recovery actions, and empty states when no data exists
  5. Application has proper 404 and 500 error pages with keyboard shortcuts for common actions
  6. Critical paths have integration tests, authentication has E2E tests, RBAC enforcement has unit tests, and API endpoints have validation tests
  7. Application deploys to Coolify with CI/CD pipeline, custom domains, and proper environment variable configuration

**Plans:** 10 plans

Plans:
- [x] 04-01-PLAN.md -- Auth fix (SSR session + WebSocket) + Dark mode theming infrastructure
- [x] 04-02-PLAN.md -- Global error pages (404, 500) + Loading skeletons + Empty state component
- [x] 04-03-PLAN.md -- Portfolio layout, navigation, footer + Home page hero + About page
- [x] 04-04-PLAN.md -- Projects showcase + TeamFlow case study + Resume page
- [x] 04-05-PLAN.md -- Contact form with server action + Portfolio loading states + Responsiveness
- [x] 04-06-PLAN.md -- Dashboard responsive mobile + Dark mode polish + Empty states + Error boundaries
- [x] 04-07-PLAN.md -- Command palette (Ctrl+K) with keyboard shortcuts
- [x] 04-08-PLAN.md -- Vitest setup + Unit tests (RBAC, contact, components) + API validation tests
- [x] 04-09-PLAN.md -- Playwright E2E tests (auth flows, portfolio navigation)
- [x] 04-10-PLAN.md -- Production Dockerfiles + GitHub Actions CI/CD + Coolify deployment prep

### Phase 5.1: Authentication Investigation
**Goal**: Understand the exact token format mismatch and SSR session access patterns

**Depends on**: Nothing (starts immediately)

**Requirements**: REAL-01 through REAL-07 prerequisites

**Success Criteria**:
1. WebSocket handshake token extraction logged and debugged
2. NextAuth JWT signing algorithm identified
3. NestJS JWT validation algorithm identified
4. SSR session access pattern documented for Next.js 15 + NextAuth v5
5. Clear understanding of what needs to change where

**Plans:** 2 plans (2/2 complete)

Plans:
- [x] 05.1-01-PLAN.md — WebSocket authentication debugging (comprehensive logging, explicit algorithm config, findings documentation)
- [x] 05.1-02-PLAN.md — SSR session access verification (audit Server Components, test SSR patterns, document findings)

### Phase 6: Authentication Fixes

**Goal**: Fix JWT_SECRET configuration mismatch to unblock all Phase 3 real-time collaboration features

**Depends on**: Phase 5.1

**Requirements**: REAL-01, REAL-02, REAL-03, REAL-04, REAL-05, REAL-06, REAL-07 (unblock all Phase 3 real-time features)

**Success Criteria** (what must be TRUE):
1. Frontend and backend load identical JWT_SECRET from environment variables
2. Application fails fast with clear errors if JWT_SECRET is missing or too short
3. JWT_SECRET is cryptographically secure (512-bit minimum)
4. WebSocket authentication succeeds without "Invalid token" errors
5. All Phase 3 real-time features work: presence indicators, live task updates, real-time comments, conflict detection
6. E2E test verifies WebSocket authentication flow automatically

**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md — JWT configuration fix (add to .env.local, remove fallback, validation, rotate secret)
- [ ] 06-02-PLAN.md — End-to-end verification (manual WebSocket test + Phase 3 features validation + E2E test)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5.1 → 6 (decimal phases like 2.1 would execute between 2 and 3)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 7/7 | ✓ Complete | 2026-02-14 |
| 2. Core Work Management | 11/11 | ✓ Complete | 2026-02-14 |
| 3. Real-Time Collaboration | 4/4 | ✓ Complete | 2026-02-15 |
| 4. Portfolio & Polish | 10/10 | ✓ Complete | 2026-02-15 |
| 5.1. Authentication Investigation | 2/2 | ✓ Complete | 2026-02-15 |
| 6. Authentication Fixes | 0/2 | Planning | - |

### Phase 6.1: User Flow & Architecture Audit (INSERTED)

**Goal**: Audit and fix the complete user journey from portfolio through TeamFlow, ensuring consistent navigation, data integrity between API and database, proper authentication at all boundaries, and comprehensive edge case handling

**Depends on**: Phase 6

**Requirements**: None (cross-cutting fixes across existing requirements)

**Success Criteria** (what must be TRUE):
  1. User can navigate entire portfolio (home, about, resume, contact, projects) without broken links or auth errors
  2. User can view project showcase and access TeamFlow project detail page from portfolio
  3. User can log in from portfolio project page and land in TeamFlow dashboard with proper session
  4. First-time authenticated user (admin) can create team → project → tasks through complete flow
  5. User can navigate to project board and interact with Kanban (drag-drop, filters, task details)
  6. API responses match database schema (no field mismatches, type errors, or missing data)
  7. Navigation structure is consistent: breadcrumbs, back buttons, sidebar state preserved
  8. All edge cases handled: empty states, loading states, error states, invalid routes, missing permissions
  9. No data inconsistencies: orphaned records, stale cache, API-DB mismatches resolved
  10. Authentication works seamlessly across portfolio ↔ TeamFlow boundaries

**Plans:** 6/6 plans complete

Plans:
- [x] 06.1-01-PLAN.md — E2E user journey tests (complete flow, auth boundaries, navigation state)
- [x] 06.1-02-PLAN.md — API response validation (Zod schemas, runtime validation, integration tests)
- [x] 06.1-03-PLAN.md — Edge case audit (loading/error/empty states, permission errors, checklist)
- [ ] 06.1-04-PLAN.md — Fix permission test redirect URLs (Gap 1 - BLOCKER)
- [ ] 06.1-05-PLAN.md — Investigate and fix task creation error UX (Gap 2 - WARNING)
- [ ] 06.1-06-PLAN.md — Integrate validation infrastructure (Gap 3 - WARNING)
