# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** Phase 2 - Core Work Management (ready to plan)

## Current Position

Phase: 2 of 4 (Core Work Management) — IN PROGRESS
Plan: 6 of 11 complete in Phase 2
Status: Executing Phase 2 plans
Last activity: 2026-02-15 — Completed 02-06: Projects Frontend (List + Detail + Settings)

Progress: [████░░░░░░] 41% (Phase 1 complete + 6/11 of Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 7.2 min/plan
- Total execution time: 1.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 6 | 40 min | 6.7 min |

**Recent Trend:**
- Last 5 plans: 02-02 (12m), 02-03 (4m), 02-04 (7m), 02-05 (6m), 02-06 (8m)
- Trend: UI plans averaging ~6-8 min, API plans ~7-12 min, schema plans ~3 min

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Separate Next.js + NestJS apps: Shows backend architecture skills, not just Next.js API routes
- WebSockets over Pusher: More impressive technically, demonstrates real-time implementation skills
- NextAuth over Clerk: More control and shows auth implementation, not just integration
- Monorepo structure: Professional org-level architecture, easier to showcase
- Demo workspace seeding: Recruiters can immediately interact without setup friction
- Raw TypeScript source imports: Prevents type drift between apps (01-01)
- Redis port 6380: Avoids conflict with existing container (01-01)
- Turborepo tasks field: Using 2.x syntax instead of pipeline (01-01)
- Postgres port 5434: Avoids conflict with system Postgres (01-02)
- Prisma db push for development: Faster iteration than migrations (01-02)
- z.infer types from Zod schemas: Single source of truth for validation + types (01-02)
- NestJS 11 with Swagger: Upgraded to v11 for compatibility with latest Swagger (01-03)
- Webpack bundler for API: Resolves TypeScript path mappings in monorepo (01-03)
- Load .env from monorepo root: Workspace runs from apps/api but env is at root (01-03)
- Logging interceptor deferred: Duplicate rxjs dependency issue, will revisit after deduplication (01-03)
- JWT session strategy with Redis verification: Credentials provider requires JWT, but Redis stores session data server-side (01-04)
- Tailwind CSS v4 migration: API changes require @tailwindcss/postcss plugin (01-04)
- Email normalization to lowercase: Prevents case-sensitivity login issues (01-04)
- Console logging for dev email: Portfolio-acceptable approach for password reset emails (01-05)
- Email enumeration prevention: Same response for existing/non-existing emails (01-05)
- IDOR prevention pattern: All mutations use session.user.id instead of form data (01-05)
- Re-enabled webpack with bcrypt externalized: Solves native module bundling (01-06)
- JWT strategy re-fetches user from DB: Ensures latest role permissions (01-06)
- Multi-layer security: Guard + Service + Database (accessibleBy) (01-06)
- Slug-based organization URLs: Use slug for friendly URLs instead of CUIDs (02-01)
- Composite unique constraints: Prevent duplicate memberships and project names (02-01)
- Task position field: Enables drag-drop reordering in Kanban (02-01)
- Cascade delete behavior: Organization/Project/Task deletions cascade to children (02-01)
- Implicit m2m for labels: Prisma auto-creates _LabelToTask join table (02-01)
- Task creator vs assignee: Separate createdBy and assignee for audit and responsibility (02-01)
- CASL organization subjects: Added Organization and Membership to RBAC (02-02)
- Manager can invite members: ADMIN and MANAGER can invite, only ADMIN can remove (02-02)
- Slug auto-generation: Lowercase, hyphens, no special chars from org name (02-02)
- Membership verification pattern: All org ops verify membership via composite key (02-02)
- Last admin protection: Prevent removing last admin to maintain ownership (02-02)
- PrismaService Phase 2 getters: Added getters for all Phase 2 models (02-02)
- Admin-only project deletion: Only ADMIN can delete projects, managers can archive (02-03)
- Project audit events: Full audit trail for create/update/archive/delete (02-03)
- Label color palette: 10 predefined colors excluding purple, random assignment (02-03)
- Task/comment audit events: Added 7 audit actions for task and comment lifecycle tracking (02-04)
- Kanban status endpoint: Separate endpoint for status-only updates optimized for drag-drop (02-04)
- Author-only comment editing: Comments editable/deletable only by author or ADMIN (02-04)
- Admin-only audit log: Organization-wide audit log accessible only to ADMIN role (02-04)
- Project activity feed: Project-scoped activity feed for focused task/project history (02-04)
- Label organization verification: Labels must belong to same org as project (security) (02-04)
- API client pattern: Separate client (api) and server (serverApi) utilities for frontend-backend calls (02-05)
- Sidebar team list: Teams fetched in layout Server Component and passed as props to client Sidebar (02-05)
- Role badge colors: Admin=red, Manager=blue, Member=green (NO purple per user requirement) (02-05)
- Form validation: React Hook Form + Zod resolver using shared schemas from @repo/shared (02-05)
- Role-based UI: Admin sees remove buttons, Admin/Manager see invite form, settings admin-only (02-05)
- Next.js 15 async params: All dynamic route params are Promise<T> requiring await (02-06)
- date-fns for relative time: Using formatDistanceToNow for user-friendly "2 days ago" display (02-06)
- Archive vs delete UI: Archive=yellow (reversible), delete=red with name confirmation (permanent) (02-06)
- Webpack fallbacks for Node modules: Added fs/net/tls/dns fallbacks to prevent ioredis/bcrypt breaking client builds (02-06)
- Server Component data fetching: Project pages use Server Components with direct API fetch (02-06)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-15 (Phase 2 execution - Plan 6)
Stopped at: Completed 02-06-PLAN.md (Projects Frontend)
Resume file: None

---
*Next step: Execute next plan in wave sequence*
