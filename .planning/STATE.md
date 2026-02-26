---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Live QA & Content Polish
status: unknown
last_updated: "2026-02-26T06:03:30Z"
progress:
  total_phases: 11
  completed_phases: 7
  total_plans: 51
  completed_plans: 48
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v4.0 — Live QA & Content Polish (Phase 34 complete — both apps live and working)

## Current Position

Phase: 36 of 36 (Content Update)
Plan: 01 of 03 complete
Status: In Progress — Phase 36 underway. Plan 01 complete: DevCollab case study Tiptap references removed, replaced with accurate react-markdown + remark-gfm + Shiki descriptions.
Last activity: 2026-02-26 — Phase 36 Plan 01 complete: DevCollab case study copy corrected (CONT-01 satisfied)

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE | v4.0 COMPLETE

Progress: [██████████████████████████░░░░] 72% (48/51 plans complete — Phase 36 in progress)

## Performance Metrics

**Velocity:**
- Total plans completed (v3.1): 14 plans
- Average duration: ~3 min/plan
- Total execution time v3.1: ~42 min

**By Phase (v3.1 only):**

| Phase | Plans | Avg/Plan |
|-------|-------|----------|
| 29 | 3 | ~2 min |
| 30 | 2 | ~2 min |
| 31 | 2 | ~8 min |
| 32 | 4 | ~10 min |
| 33 | 3 | ~6 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions (relevant to v4.0)

- **Phase 36 Plan 01:** Case study copy must match deployed package.json — list only libraries actually present; Tiptap was never installed in devcollab-web, react-markdown is the actual renderer
- **Phase 35 Plan 03:** useSession() returns null during SSR hydration — always check `status === 'loading'` before acting on session state in useEffect or router.push calls
- **Phase 35 Plan 03:** Socket.IO room join order matters for presence — call `client.join(roomName)` before any async Prisma queries to prevent presence:request race conditions
- **Phase 35 Plan 03:** lhci CLI `--collect.url` flags do not override `startServerCommand` in config file — use a separate config file without startServerCommand for production URL auditing
- **Phase 35 Plan 02:** Next.js API routes behind a reverse proxy must use x-forwarded-proto + x-forwarded-host headers for redirect URL construction — req.url resolves to internal container address (0.0.0.0:80), not the public domain
- **Phase 35 Plan 02:** DevCollab API is at devcollab-api.fernandomillan.me (separate subdomain) — devcollab.fernandomillan.me/api routes are served by the Next.js frontend, not the NestJS backend
- **Phase 35 Plan 01:** Portfolio case study CTAs must use absolute https:// URLs — relative paths (e.g., /teams) cause 404 on fernandomillan.me
- **Phase 35 Plan 01:** Playwright CTA tests run against local dev server via relative paths to verify href attribute values without navigating to external URLs
- **Phase 34 Plan 01:** devcollab-seed added to coolify-compose.yml; devcollab-api now depends on devcollab-seed completing; CI builds devcollab-seed image in build-and-push-devcollab job
- **Phase 34 Plan 01:** Diagnostic script (scripts/diagnose-live-auth.sh) covers all 7 auth failure classes; auto-detects API domains; human must run it on VPS and report findings
- **Phase 34 COMPLETE:** Both apps fully authenticated and working in production
- **DevCollab fix:** COOKIE_DOMAIN=.fernandomillan.me — cookie sharing across subdomains
- **TeamFlow fixes:** AUTH_SECRET (v5 renamed from NEXTAUTH_SECRET), AUTH_TRUST_HOST=true (reverse proxy), port mismatch PORT vs API_PORT, Redis deadlock in connectToRedis(), CORS_ORIGIN env var
- **v3.0:** NEXT_PUBLIC_API_URL baked into devcollab-web Docker image at build time via `--build-arg`
- **v3.0:** Coolify deploy API uses GET + Bearer token (not POST); separate webhook per service
- **v3.0:** VPS GHCR auth must be done as root (`sudo su -` before `docker login`)
- **v3.0:** Domain TLD is `.me` not `.dev` — `devcollab.fernandomillan.me`, `teamflow.fernandomillan.me`

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-26
Stopped at: Phase 36 Plan 01 complete — DevCollab case study corrected (Tiptap removed, react-markdown added).
Resume file: None
Next action: Execute Phase 36 Plan 02
