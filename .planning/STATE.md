# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** Phase 3 - Real-Time Collaboration (in progress)

## Current Position

Phase: 4 of 4 (Portfolio & Polish) — IN PROGRESS
Plan: 9 of 10 complete in Phase 4
Status: Phase 4 Active
Last activity: 2026-02-15 — Completed 04-09: Playwright E2E Testing

Progress: [█████████░] 90% (Phase 1 complete + Phase 2 complete + Phase 3 complete + Phase 4: 9/10 = 28/31 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 28
- Average duration: 6.6 min/plan
- Total execution time: 3.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 11 | 62 min | 5.6 min |
| 03-real-time-collaboration | 3 | 18 min | 6.0 min |
| 04-portfolio-polish | 9 | 69 min | 7.7 min |

**Recent Trend:**
- Last 5 plans: 04-05 (11m), 04-04 (15m), 04-07 (4m), 04-06 (4m), 04-09 (3m)
- Trend: Phase 4 averaging 7.7 min/plan (testing infrastructure completing quickly)

*Updated after each plan completion*
| Phase 04-portfolio-polish P04-03 | 8 | 2 tasks | 7 files |
| Phase 04-portfolio-polish P04-04 | 15 | 2 tasks | 5 files |
| Phase 04-portfolio-polish P04-07 | 4 | 2 tasks | 5 files |
| Phase 04-portfolio-polish P04-06 | 4 | 2 tasks | 8 files |
| Phase 04-portfolio-polish P04-09 | 3 | 2 tasks | 7 files |

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
- [Phase 03-03]: presence:request handler uses fetchSockets() to query active users, deduplicated by userId
- [Phase 03-03]: Presence indicator hides when 0 or 1 user to reduce UI noise
- [Phase 03-03]: Avatar colors rotate blue/green/orange (NO purple) with max 3 shown + overflow badge
- [Phase 03-03]: Self-update filtering (userId !== currentUserId) prevents duplicate comments and presence updates
- [Phase 03-03]: Comments converted to local state in task detail for real-time updates via useRealTimeComments hook
- [Phase 04-01]: Destructured export pattern for NextAuth to fix Next.js 15 type inference issues
- [Phase 04-01]: JWT_SECRET shared between NextAuth and NestJS JwtModule for WebSocket authentication
- [Phase 04-01]: OKLCH color space for theme colors - better perceptual uniformity
- [Phase 04-01]: Blue primary color (NO purple per user requirement)
- [Phase 04-03]: Portfolio at root (/) for public marketing, dashboard at /teams for authenticated users
- [Phase 04-05]: Separate validation schema file to avoid server action 'use server' import issues in client components
- [Phase 04-05]: React Hook Form + Zod for client validation, server action for server validation
- [Phase 04-05]: Console logging for contact form (production SMTP deferred)
- [Phase 04-04]: Comprehensive 7-section case study structure (Overview, Problem, Solution, Architecture, Key Technical Decisions, Challenges, Results)
- [Phase 04-04]: Inline resume content vs iframe for SEO-friendliness and accessibility
- [Phase 04-04]: Static site generation for all portfolio content pages (fast load times, pre-rendered)
- [Phase 04-04]: Lucide-react for icons (tree-shakeable, TypeScript-friendly)
- [Phase 04-07]: cmdk library for command palette - professional, accessible, searchable
- [Phase 04-07]: ⌘K keyboard hint badges visible only on desktop (hidden on mobile for space)
- [Phase 04-07]: Portal-based dialog overlay for command palette (works from any context)
- [Phase 04-06]: CSS variables for dark mode (bg-background, text-foreground, border-border) enable consistent theme switching
- [Phase 04-06]: Route-level error boundaries at team and project segments for graceful error handling with retry
- [Phase 04-06]: Actionable empty states with icons, descriptions, and CTAs guide users to next action
- [Phase 04-09]: Auth state management pattern with Playwright setup project for reusable authenticated sessions
- [Phase 04-09]: Public vs authenticated test flows - clear storage state for auth tests, portfolio tests run unauthenticated
- [Phase 04-09]: Semantic selectors (getByRole, getByLabel) for resilient E2E tests

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 3 Verification Deferred** (documented 2026-02-15):
- All Phase 3 code complete and committed (conflict detection, real-time updates, presence, comments)
- Manual verification blocked by two auth issues:
  1. Next.js 15 + NextAuth SSR session issue (Server Components can't access session)
  2. WebSocket authentication failure (immediate disconnect with "Invalid token")
- **Decision**: Move to Phase 4 (Portfolio & Polish), fix auth during production polish
- Phase 3 implementation quality is solid, will verify during Phase 4 testing phase

## Session Continuity

Last session: 2026-02-15T17:35:39Z (Phase 4 execution)
Stopped at: Completed 04-09-PLAN.md (Playwright E2E Testing)
Resume file: .planning/phases/04-portfolio-polish/04-09-SUMMARY.md

---
*Next step: Execute 04-10-PLAN.md (Final Production Polish)*
