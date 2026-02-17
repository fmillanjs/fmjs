# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

**Current focus:** v1.1 - UI/Design System Overhaul

## Current Position

Milestone: v1.1 - UI/Design System Overhaul — COMPLETE
Phase: 13 - Automation & Optimization — COMPLETE
Plan: 13-03 complete — lighthouserc.json created, Lighthouse CI job added to deploy.yml, full Phase 13 automation layer human-verified. MIG-04 satisfied.
Status: Phase 13 complete — 3/3 plans done. v1.1 milestone complete.
Last activity: 2026-02-17 — 13-03: lighthouserc.json asserting performance >=0.9 on 5 public routes; Lighthouse CI job added; build-and-push now needs [test, lighthouse]; human verified all 7 automation checks

Progress: [██████████] v1.0: 79% (55/67 requirements) | v1.1: 100% (16/16 requirements)

## Performance Metrics

**Velocity:**
- Total plans completed: 44
- Average duration: 9.5 min/plan
- Total execution time: ~7.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 7 | 61 min | 8.7 min |
| 02-core-work-management | 11 | 62 min | 5.6 min |
| 03-real-time-collaboration | 3 | 18 min | 6.0 min |
| 04-portfolio-polish | 10 | 77 min | 7.7 min |
| 05.1-authentication-investigation | 2 | 11 min | 5.5 min |
| 06-authentication-fixes | 1 | 3 min | 3.0 min |
| 06.1-user-flow-architecture-audit | 6 | 158 min | 26.3 min |
| 07-phase-3-verification | 1 | 36 min | 36.0 min |
| 07.1-phase-3-gap-closure-real-time-collaboration-fixes | 2 | 50 min | 25.0 min |
| 08-foundation-validation | 1 | 4 min | 4.0 min |

**Recent Trend:**
- Last 5 plans: 06.1-05 (35m), 07-01 (36m), 07.1-01 (25m), 07.1-02 (25m), 08-02 (4m)
- Trend: Foundation validation plans: 4m, gap closure with checkpoints: 25-40m

*Updated after each plan completion*
| Phase 08 P02 | 4 | 3 tasks | 2 files |
| Phase 04-portfolio-polish P04-03 | 8 | 2 tasks | 7 files |
| Phase 04-portfolio-polish P04-04 | 15 | 2 tasks | 5 files |
| Phase 04-portfolio-polish P04-07 | 4 | 2 tasks | 5 files |
| Phase 04-portfolio-polish P04-06 | 4 | 2 tasks | 8 files |
| Phase 04-portfolio-polish P04-09 | 3 | 2 tasks | 7 files |
| Phase 04-portfolio-polish P04-08 | 4 | 2 tasks | 12 files |
| Phase 04-portfolio-polish P04-10 | 8 | 3 tasks | 6 files |
| Phase 05.1 P01 | 5 | 3 tasks | 5 files |
| Phase 05.1 P02 | 6 | 3 tasks | 2 files |
| Phase 06 P01 | 3 | 3 tasks | 3 files |
| Phase 06.1 P02 | 5 | 3 tasks | 4 files |
| Phase 06.1 P01 | 20 | 3 tasks | 4 files |
| Phase 06.1 P02 | 5 | 3 tasks | 4 files |
| Phase 06.1 P03 | 90 | 3 tasks | 5 files |
| Phase 06.1 P04 | 5 | 1 task | 1 file |
| Phase 06.1 P06 | 3 | 3 tasks | 4 files |
| Phase 06.1 P05 | 35 | 2 tasks | 4 files |
| Phase 07 P01 | 36 | 2 tasks | 1 file |
| Phase 07.1 P01 | 25 | 3 tasks | 4 files |
| Phase 07.1 P02 | 25 | 4 tasks | 5 files |
| Phase 08 P02 | 4 | 3 tasks | 2 files |
| Phase 08 P01 | 5 | 2 tasks | 2 files |
| Phase 09-design-system-foundation P01 | 5 | 2 tasks | 6 files |
| Phase 09-design-system-foundation P02 | 3 | 1 task | 1 file |
| Phase 09-design-system-foundation P03 | 2 | 2 tasks | 2 files |
| Phase 09-design-system-foundation P04 | 10 | 3 tasks | 9 files |
| Phase 10-component-migration-portfolio P01 | 2 | 2 tasks | 7 files |
| Phase 10-component-migration-portfolio P02 | 8 | 2 tasks | 4 files |
| Phase 10-component-migration-portfolio P03 | 3 | 2 tasks | 6 files |
| Phase 10-component-migration-portfolio P04 | 75 | 2 tasks | 70+ files |
| Phase 11-form-components-validation P01 | 5 | 1 task | 4 files |
| Phase 11-form-components-validation P02 | 2 | 2 tasks | 6 files |
| Phase 11-form-components-validation P03 | 2 | 2 tasks | 5 files |
| Phase 11-form-components-validation P04 | 35 | 3 tasks | 9 files |
| Phase 12 P01 | 2 | 1 tasks | 5 files |
| Phase 12 P02 | 4 | 2 tasks | 4 files |
| Phase 12 P03 | 2 | 2 tasks | 1 file |
| Phase 12 P04 | 2 | 2 tasks | 2 files |
| Phase 12 P05 | 1 | 2 tasks | 2 files |
| Phase 12 P06 | 1 | 1 task | 1 file |
| Phase 12 P07 | 2 | 2 tasks | 3 files |
| Phase 12 P08 | 2 | 2 tasks | 3 files |
| Phase 12 P09 | 20 | 2 tasks | 9 files |
| Phase 13 P01 | 4 | 2 tasks | 8 files |
| Phase 13-automation-optimization P02 | 25 | 2 tasks | 8 files |
| Phase 13-automation-optimization P03 | 10 | 2 tasks | 2 files |

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
- [Phase 04-08]: Vitest over Jest for consistency and modern ESM support
- [Phase 04-08]: Comprehensive RBAC tests (20 test cases) covering ADMIN, MANAGER, MEMBER roles proving security model
- [Phase 04-10]: Multi-stage Docker builds with turbo prune for optimized image sizes
- [Phase 04-10]: GitHub Container Registry over DockerHub for seamless GitHub Actions integration
- [Phase 04-10]: Standalone Next.js output for Docker deployment efficiency
- [Phase 04-10]: Three-stage CI/CD pipeline (test → build-and-push → deploy) with concurrency controls
- [Phase 05.1-01]: Explicit JWT algorithm configuration (HS256) prevents algorithm confusion attacks
- [Phase 05.1-01]: Unverified token decoding (jwt.decode) provides complete diagnostic visibility
- [Phase 05.1-02]: SSR diagnostic logging in session callback (typeof window detection) for server vs client visibility
- [Phase 05.1-02]: Static code audit confirms 100% Next.js 15 async compliance (11/11 auth() calls properly awaited)
- [Phase 05.1-02]: Three-tier auth patterns identified: layout-level protection (primary), defensive double-check, server action error return
- [Phase 06-01]: 512-bit JWT_SECRET for cryptographic strength exceeding 256-bit minimum
- [Phase 06-01]: Fail-fast validation instead of fallback secrets for immediate error surfacing
- [Phase 06-01]: SHA256 fingerprint logging for secret verification without exposure
- [Phase 06.1-02]: Runtime API response validation with environment-aware strict/graceful modes (dev throws, prod logs)
- [Phase 06.1-02]: Separate response schemas from request validators for Date coercion and optional relations
- [Phase 06.1-03]: Edge case categorization into 6 types (loading/error/empty/navigation/permission/data-integrity) for comprehensive coverage
- [Phase 06.1-03]: Dual-track testing approach (21 automated E2E + 12 manual checks) balancing automation efficiency with human UX judgment
- [Phase 06.1-03]: Issue tracking integrated into checklist with severity levels (CRITICAL/HIGH/MEDIUM/LOW) for prioritization
- [Phase 06.1-03]: Manual verification checkpoint pattern for user-driven validation identifying issues automation can't catch
- [Phase 06.1-05]: Optional chaining with nullish coalescing for _count relation data (prevents TypeError during optimistic updates)
- [Phase 06.1-06]: Environment-aware API validation (strict dev throws errors, graceful prod logs) balances DX with UX
- [Phase 06.1-06]: OrganizationWithCountSchema pattern for extending base schemas with relation counts
- [Phase 06.1-06]: Validation integration testing with Vitest proves runtime type safety functional
- [Phase 07-01]: Truthful gap reporting documents actual state vs aspirational claims
- [Phase 07-01]: Verification status field (passed/failed/gaps_found) reflects real test outcomes
- [Phase 07-01]: Root cause hypothesis documented for each failure to guide gap closure planning
- [Phase 07.1-01]: Redis adapter with pub/sub for WebSocket horizontal scaling across server instances
- [Phase 07.1-01]: Project-level room isolation with membership verification prevents cross-tenant data leaks
- [Phase 07.1-01]: Dual listener pattern: EventEmitter2 events caught by both audit and WebSocket listeners
- [Phase 07.1-02]: Selective version-based OCC: text edits use conflict detection, dropdowns use last-write-wins
- [Phase 07.1-02]: Self-update filtering before version comparison prevents false conflict warnings
- [Phase 07.1-02]: Amber conflict warning UI with WCAG-compliant contrast and user-driven resolution
- [Phase 07.1]: Plan 07.1-03 FAILED: Attempted WCAG contrast fixes with spot changes. Learned that systemic design issues require design system overhaul, not piecemeal fixes. Led to v1.1 milestone creation.
- [v1.1 Roadmap]: Phase 8 Foundation Validation must precede component work to avoid Phase 07.1-03 failure pattern
- [v1.1 Roadmap]: 6 phases (8-13) derived from 16 requirements using research insights
- [v1.1 Roadmap]: Foundation-first approach validates Tailwind v4 before touching components
- [Phase 08-01]: CLI-based validation using server compilation logs acceptable for headless environments
- [Phase 08-01]: Sub-second compilation time (233-263ms) proves HMR functional without browser testing
- [Phase 08-01]: Comprehensive debugging workflow prevents Phase 07.1-03 failure pattern
- [Phase 08]: Programmatic OKLCH to RGB conversion with automated WCAG contrast calculation for repeatable accessibility auditing
- [Phase 08]: 3-tier violation severity system (CRITICAL/MEDIUM/HIGH) prioritizes text readability over UI visibility
- [Phase 08]: Document WCAG fixes for Phase 9 implementation rather than applying during audit phase
- [Phase 09]: tailwindcss added to apps/web devDependencies for shadcn CLI version detection (hoisted root package not visible to CLI Nt() function)
- [Phase 09]: tailwind.config.js stub created for shadcn CLI Lr() scanner compatibility in Tailwind v4 CSS-first project
- [Phase 09]: Shadcn UI CLI initialized with new-york style, neutral base color (Plan 02 replaces with Radix Colors blue scale)
- [Phase 09-02]: Radix Colors two-layer pattern: scale steps (--blue-9) → semantic names (--primary) → @theme inline Tailwind utilities (--color-primary)
- [Phase 09-02]: Dark mode via Radix dark CSS imports (not hand-rolled .dark {} block) — same CSS variable names, different values auto-scoped to .dark
- [Phase 09-02]: @custom-variant dark uses :where(.dark, .dark *) selector for next-themes class="dark" on <html>
- [Phase 09-02]: Radix scale step WCAG strategy: step 9=saturated backgrounds, step 11=readable text (Lc 60+ APCA), step 6=visible borders (3:1+)
- [Phase 09-02]: blue-11 on blue-3 for accent (fixes 1.21:1 CRITICAL), amber-12 on amber-9 for warning (fixes 1.01:1 CRITICAL)
- [Phase 09-03]: Simplified ESLint flat config without FlatCompat — ESLint not installed, Next.js handles core-web-vitals separately via next lint
- [Phase 09-03]: className restrictions are PR review gate — ESLint no-restricted-imports cannot inspect className string contents
- [Phase 09-04]: Skipped Storybook — in-app /design-system verification page used instead (faster, no extra tooling infra)
- [Phase 09-04]: Semantic foreground tokens (text-primary-foreground, etc.) replace mix-blend-difference CSS trick for readable color swatch labels
- [Phase 09-04]: badge component for Phase 10 tech stack tags, sonner replaces deprecated toast, separator for layout dividers
- [Phase 10-01]: Link className=block group wrapping Card chosen over Button asChild wrapping Card for project-card — simpler focus ring behavior
- [Phase 10-01]: Badge variant=secondary for tech stack tags — neutral appearance vs variant=default which signals primary action
- [Phase 10-01]: Button asChild size=lg pattern for Link CTAs, Button asChild variant=outline for external links
- [Phase 10-01]: Button variant=ghost size=icon for mobile hamburger toggle replacing raw button element
- [Phase 10-component-migration-portfolio]: Dark mode via classList.add('dark') class injection — not colorScheme which sets media query not Radix Colors class
- [Phase 10-component-migration-portfolio]: AxeBuilder with wcag2a + wcag2aa + wcag21aa tags for full WCAG AA accessibility coverage in portfolio tests
- [Phase 10-03]: bg-accent token used for info panel backgrounds replacing bg-blue-50 dark:bg-blue-950/30 — matches Radix Colors accent scale semantics
- [Phase 10-03]: About page CTA changed from mailto: href to /contact Link — consistent with Button asChild navigation pattern
- [Phase 10-03]: green-600/green-400 preserved for success checkmark list items (semantically correct, not primary color)
- [Phase 10-04]: dark mode axe-core test: localStorage pre-load (addInitScript) required — post-load class injection causes body bg to remain transparent (rgba(0,0,0,0)), axe falls back to white canvas for all color contrast checks
- [Phase 10-04]: primary token: blue-9 (#0090ff) → blue-11 (#0d74ce) for WCAG 2 AA compliance — Radix step 9 guarantee is APCA Lc 60 only, not WCAG 2 4.5:1 (blue-9 on white = 2.99:1)
- [Phase 10-04]: body element requires bg-background text-foreground classes — without it, html/body/main have transparent backgrounds and axe-core cannot resolve dark mode CSS custom properties
- [Phase 10-04]: Full semantic token sweep: bg-white/text-gray-*/border-gray-* → bg-card/text-foreground/text-muted-foreground/border-border across all 50+ dashboard pages and components
- [Phase 10-04]: Status/badge colors use Radix CSS variables directly (bg-[var(--green-3)] text-[var(--green-11)]) for dark mode compatible status indicators
- [Phase 11-01]: Shadcn CLI --yes flag still prompts for overwrites on existing files — pipe N to preserve Phase 9/10 migrated button.tsx and label.tsx
- [Phase 11-01]: Form ARIA automation via FormItemContext: React.useId() generates IDs, FormControl sets aria-invalid on error, aria-describedby links to description + message
- [Phase 11-02]: FormField render prop replaces register() spread — automatic aria-invalid + aria-describedby wiring activated
- [Phase 11-02]: mode: 'onBlur' across all 6 auth forms — validation fires on field exit, not every keystroke
- [Phase 11-02]: role=alert for errors (assertive), role=status for success (polite) — correct ARIA live region semantics
- [Phase 11-02]: Hidden token field in reset-password-form uses form.register('token') directly — appropriate for non-UI hidden inputs outside FormField context
- [Phase 11-02]: profile-form image field: value={field.value ?? ''} coercion required — updateProfileSchema infers null but Input expects string | undefined
- [Phase 11-03]: Shadcn Select onValueChange pattern (not {...field} spread on Select root) for invite-member-form role field
- [Phase 11-03]: Inline zod commentSchema in comment-form — no shared schema needed for single-use component
- [Phase 11-03]: comment-form alert() replaced with console.error — no toast required per plan spec
- [Phase 11-04]: task-form labels toggle: role=group + aria-labelledby for accessible multi-select button group (not FormField — uses setValue pattern)
- [Phase 11-04]: Links on muted backgrounds: text-foreground + underline instead of text-primary when blue-11 (#0d74ce) on bg-muted (#f0f0f3) yields 4.18:1, below WCAG AA 4.5:1
- [Phase 11-04]: autoComplete attributes: current-password for login fields, new-password for signup/reset/change-new fields, email for email inputs — follows HTML spec for password managers
- [Phase 11-04]: useForm defaultValues must be explicit empty strings (not undefined) for all text-like inputs — prevents React uncontrolled→controlled warnings on first render
- [Phase 11-04]: task-form optional fields (dueDate, assigneeId): default to '' not undefined when bound to Shadcn Select or Input type=date
- [Phase 12-01]: Piped N to shadcn overwrite prompt to preserve Phase 10/11 migrated button.tsx
- [Phase 12-01]: tabs.tsx and popover.tsx were pre-existing from uncommitted session — shadcn skipped as identical; alert-dialog.tsx newly created
- [Phase 12-02]: TaskForm always rendered with Dialog controlling visibility — replaces conditional {isFormOpen && <TaskForm>} pattern with Radix-managed mount/unmount
- [Phase 12-02]: selectedTask guard in task-list-view: open={isFormOpen && !!selectedTask} — preserves safety check without needing conditional render wrapper
- [Phase 12-02]: Dialog open/onOpenChange is the established interface for all future modal components in this codebase
- [Phase 12-03]: Shadcn Select onValueChange replaces native <select> onChange — no spread needed, color className preserved
- [Phase 12-03]: Tabs defaultValue replaces activeTab useState — Radix manages internal tab state
- [Phase 12-03]: AlertDialog with AlertDialogTrigger asChild replaces showDeleteConfirm inline confirm div — no extra state variable
- [Phase 12-03]: Inline-edit UX (onBlur save, Enter/Escape handling) preserved when swapping to Shadcn Input/Textarea
- [Phase 12-04]: Each filter dropdown is an independent Popover — no shared openDropdown state needed; Radix Popover handles open/close per instance
- [Phase 12-04]: Badge variant=default for active filter count badges inside PopoverTrigger buttons
- [Phase 12-04]: Shadcn Input pl-10 pr-10 preserves search icon and clear button absolute positioning; hardcoded focus-ring styles removed
- [Phase 12-05]: Badge variant=outline with border-0 override preserves CVA base styles while applying Radix Color tokens via cn()
- [Phase 12-05]: setNodeRef from useDroppable MUST stay on inner div — not moved to Card component — to preserve dnd-kit drag detection
- [Phase 12-06]: AlertDialogTrigger asChild wraps Button for Remove — single trigger element, no wrapper div, correct ARIA wiring
- [Phase 12-06]: showConfirm state deleted entirely — AlertDialog manages open/close state internally via Radix, no extra boolean needed
- [Phase 12-06]: Badge variant=outline border-0 override preserves CVA base styles while applying Radix Color tokens via cn()
- [Phase 12-07]: Controlled Dialog (not AlertDialog) for delete with name verification — AlertDialog does not support Input inside it; controlled Dialog required
- [Phase 12-07]: deleteOpen + confirmName states replace showDeleteConfirm + DOM getElementById pattern — React-controlled instead of DOM mutation
- [Phase 12-07]: Tabs defaultValue=ACTIVE replaces filter useState — Radix manages tab state internally, filteredProjects derived state deleted
- [Phase 12-08]: Button size=sm asChild for compact header navigation links — matches plan spec for outline variant nav buttons in team/project headers
- [Phase 12-08]: projects.length used for Projects stat instead of hardcoded 0 — pre-existing bug fixed during migration
- [Phase 12-08]: projects.reduce for Tasks stat instead of hardcoded 0 — correctly aggregates task counts from project _count relation
- [Phase 12]: Active sidebar nav link: text-foreground on bg-primary/10 (not text-primary) — blue-11 (#0d74ce) on #e1ecf7 = 3.98:1 fails WCAG AA; foreground = 21:1 passes (12-09)
- [Phase 12]: DEMO badge: text-[var(--green-12)] on bg-[var(--green-3)] — green-11 = 4.21:1 (fails 4.5:1), green-12 passes WCAG AA (12-09)
- [Phase 12]: Shadcn SelectItem cannot use value="" — Radix Select crashes on empty string; use sentinel value="__none__" and map back to null/undefined in onValueChange handler (12-09)
- [Phase 13]: Dashboard visual regression uses storageState for auth + mask on dynamic content to prevent spurious diffs
- [Phase 13]: CI E2E split into 3 named steps (accessibility / visual regression / remaining) + ESLint governance check added
- [Phase 13-automation-optimization]: ESLint skeleton restriction removed: components/ui/skeleton.tsx is the active skeleton used by loading.tsx files; skeleton restriction was incorrect since no alternative Shadcn skeleton exists at a different path
- [Phase 13-automation-optimization]: @typescript-eslint/parser required in eslint flat config: TypeScript generics in Shadcn components fail without it; added languageOptions.parser field
- [Phase 13-automation-optimization]: Bundle baseline: 103 kB shared chunks, 243 kB largest route (projectId board with DnD Kit + TanStack Table + Shadcn form system)
- [Phase 13-automation-optimization]: Lighthouse CI scoped to public routes only (/, /about, /projects, /projects/teamflow, /login) — dashboard routes cannot be audited by lhci (no auth)
- [Phase 13-automation-optimization]: categories:accessibility warn (not error) in lighthouserc.json — axe-core is authoritative for WCAG; dual failures would be confusing to triage
- [Phase 13-automation-optimization]: upload.target=temporary-public-storage for Lighthouse reports — no GitHub App token or LHCI server required for portfolio CI

### Roadmap Evolution

- Phase 6 added: Authentication Fixes
- Phase 6.1 inserted after Phase 6: User Flow & Architecture Audit (URGENT)
- Phase 7.1 inserted after Phase 7: Phase 3 Gap Closure - Real-Time Collaboration Fixes (URGENT)
- Milestone v1.1 added: UI/Design System Overhaul (Phases 8-13)

### Pending Todos

**Phase 9 - Design System Foundation**: ✅ Complete (all 4 plans). ✅ Color system (09-02). ✅ ESLint governance (09-03). ✅ Shadcn components installed + WCAG verified (09-04).
**Phase 10 - Component Migration Portfolio**: ✅ Complete (4 of 4 plans). ✅ Portfolio components migrated (10-01). ✅ Visual regression + accessibility tests created (10-02). ✅ All 6 portfolio pages migrated to Shadcn UI (10-03). ✅ Visual regression baselines + WCAG AA accessibility + full semantic token sweep (10-04). MIG-01 satisfied. All 12 portfolio WCAG AA tests pass (0 violations). Dark mode fully semantic across entire app.
**Phase 11 - Form Components & Validation**: ✅ Complete (all 4 plans done). ✅ Shadcn Form + Select installed (11-01, COMP-03). ✅ All 6 auth forms migrated to FormField pattern (11-02). ✅ All 5 dashboard/portfolio forms migrated (11-03). ✅ task-form.tsx migrated with 3 Shadcn Selects + role=group labels toggle (11-04). ✅ 6 axe WCAG AA tests passing (11-04). ✅ Human-verified: keyboard navigation, ARIA attributes, zero browser console warnings. COMP-03 satisfied.
**Phase 12 - Critical Route Migration**: ✅ Complete (all 9 plans done). ✅ TaskForm→Dialog, TaskDetailPanel→Select/Tabs/AlertDialog, TaskFilters→5 Popovers, TaskSearch→Input, TaskCard→Badge, KanbanColumn→Card (12-02 through 12-05). ✅ TeamMemberList→AlertDialog/Badge, ProjectCard/List/Actions→Card/Tabs/AlertDialog/Dialog (12-06, 12-07). ✅ Route pages→Button/Card/lucide icons (12-08). ✅ MIG-03 grep clean, WCAG AA axe tests passing, SelectItem __none__ sentinel fix, human verified (12-09). COMP-04/MIG-02/MIG-03 satisfied.
**Phase 13 - Automation & Optimization**: ✅ COMPLETE (3/3 plans done). ✅ 13-01: Dashboard visual regression spec created, 6 PNG baselines generated (teams-list/profile/team-detail × light+dark), CI split into named steps, ESLint governance check added. ✅ 13-02: ConflictWarning/EmptyState replaced inline in 5 files (3 components + 2 app pages), ESLint governance hardened (zero violations on all feature dirs), @next/bundle-analyzer installed, bundle baseline documented (103 kB shared / 243 kB max). COMP-05 satisfied. ✅ 13-03: lighthouserc.json asserting performance >=0.9 on 5 public routes, Lighthouse CI job in deploy.yml (needs: test), build-and-push gated on [test, lighthouse]. MIG-04 satisfied. Human-verified: visual regression pass, ESLint governance enforces, Lighthouse config valid, CI YAML valid.

### Blockers/Concerns

**v1.0 Completion Status** (updated 2026-02-16):
- ✅ **Phase 3 real-time features**: Fully functional after Phases 6, 6.1, 7, 07.1-01, 07.1-02
  - Redis pub/sub: Working
  - WebSocket authentication: Working
  - Live updates: Working
  - Presence indicators: Working
  - Conflict detection: Working (selective OCC)
- ❌ **UI/UX accessibility**: BLOCKED (Plan 07.1-03 FAILED)
  - Root cause: Systemic design issues (Tailwind v4 config, color palette, no design system)
  - Resolution: NEW MILESTONE v1.1 - UI/Design System Overhaul
  - **Do NOT retry spot fixes** - requires architectural solution

**v1.1 Prerequisites** (updated 2026-02-17):
- ✅ Roadmap created: Phases 8-13 defined
- ✅ Research complete: research/SUMMARY.md provides foundation
- ✅ Requirements defined: 16 requirements (FOUND-01 through MIG-04)
- ✅ Phase 8 complete: Foundation Validation (both plans 08-01, 08-02 complete)

**No active blockers** - ready to proceed with Phase 9 planning.

## Session Continuity

Last session: 2026-02-17 (Phase 13 Plan 03 — complete)
Stopped at: Completed 13-03-PLAN.md. lighthouserc.json created asserting performance >=0.9 on 5 public routes; Lighthouse CI job added to deploy.yml (build-and-push now needs [test, lighthouse]); human verified full Phase 13 automation layer. MIG-04 satisfied.
Status: Phase 13 COMPLETE. v1.1 milestone COMPLETE. 3/3 plans done.
Next action: v1.1 milestone complete — all 16 requirements satisfied. Ready for v1.2 planning or deployment verification.

---
*v1.0 at 79% complete. v1.1 roadmap ready.*
