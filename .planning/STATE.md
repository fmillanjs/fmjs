# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** Phase 3 - Real-Time Collaboration (in progress)

## Current Position

Phase: 3 of 4 (Real-Time Collaboration) — IN PROGRESS
Plan: 1 of 5 complete in Phase 3
Status: Phase 3 Active
Last activity: 2026-02-15 — Completed 03-01: WebSocket Broadcasting Infrastructure

Progress: [█████████░] 61% (Phase 1 complete + Phase 2 complete + Phase 3: 1/5 = 19/31 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 19
- Average duration: 6.5 min/plan
- Total execution time: 2.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 11 | 62 min | 5.6 min |
| 03-real-time-collaboration | 1 | 6 min | 6.3 min |

**Recent Trend:**
- Last 5 plans: 02-08 (5m), 02-09 (6m), 02-10 (4m), 02-11 (2m), 03-01 (6m)
- Trend: Seed/demo plans ~2 min, UI plans ~4-6 min, API plans ~7-12 min

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
- Kanban drag-drop with dnd-kit: Using @dnd-kit/core for modern drag-drop with accessibility and collision detection (02-07)
- React 19 useOptimistic: Instant UI updates on drag with automatic revert on API error (02-07)
- TanStack Table for list view: Sortable columns with headless table utilities and full styling control (02-07)
- Priority color scheme: URGENT=red, HIGH=orange, MEDIUM=yellow, LOW=slate matching design requirements (02-07)
- [Phase 02]: nuqs for URL-based filter state: Type-safe search param management with Next.js App Router (02-08)
- [Phase 02]: Server-side filtering via query params: All filtering happens on server for fresh data and shareable URLs (02-08)
- [Phase 02-core-work-management]: Inline editing patterns: click-to-edit for title/description, immediate save for dropdowns (02-09)
- [Phase 02-core-work-management]: Tab navigation for Comments/History instead of both visible (reduces scroll) (02-09)
- [Phase 02-core-work-management]: Idempotent seed with upsert: Safe to run multiple times, uses unique keys for all entities (02-11)
- [Phase 02-core-work-management]: Weighted random distribution: Realistic task status (30% TODO, 25% IN_PROGRESS, 30% DONE, 15% BLOCKED) and priority (20% LOW, 35% MEDIUM, 30% HIGH, 15% URGENT) (02-11)
- [Phase 02-core-work-management]: Demo workspace identification: slug='demo-workspace' with green DEMO badge in sidebar (02-11)
- [Phase 02-core-work-management]: 14-day timeline for demo data: Comments and audit logs spread over 2 weeks for realistic history (02-11)
- [Phase 03-01]: Redis adapter with pub/sub clients for WebSocket horizontal scaling
- [Phase 03-01]: Project-level room isolation with membership verification for WebSocket security
- [Phase 03-01]: Task version field for optimistic concurrency control in real-time updates
- [Phase 03-01]: Dual listener pattern: EventEmitter2 events caught by both audit listener and WebSocket listeners

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-15 (Phase 3 execution - Plan 01)
Stopped at: Completed 03-01-PLAN.md (WebSocket Broadcasting Infrastructure)
Resume file: None

---
*Next step: Execute next plan in wave sequence*
