---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Live QA & Content Polish
status: unknown
last_updated: "2026-02-26T09:00:00.000Z"
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 54
  completed_plans: 52
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v4.0 — Live QA & Content Polish (Phase 34 complete — both apps live and working)

## Current Position

Phase: 37 of 37 (Phase 34 Documentation & Tracking Closure)
Plan: 01 of 01 complete
Status: COMPLETE — Phase 37 complete. LIVE-03 and LIVE-04 formally documented using Phase 35 evidence. Phase 34 formally closed. v4.0 milestone fully closed.
Last activity: 2026-02-26 — Phase 37 Plan 01 complete: 34-02-SUMMARY.md and 34-VERIFICATION.md created, REQUIREMENTS.md LIVE-03/LIVE-04 checkboxes updated, ROADMAP.md Phase 34 marked complete, stale .continue-here.md deleted. ALL v4.0 REQUIREMENTS SATISFIED.

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE | v4.0 COMPLETE (all 12 requirements satisfied 2026-02-26)

Progress: [██████████████████████████████] 100% (52/52 plans complete — Phase 37 DONE — ALL PHASES AND REQUIREMENTS COMPLETE)

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

| Phase 37 | 1 | ~4 min |

## Accumulated Context

### Decisions (relevant to v4.0)

- **Phase 36 Plan 03:** Badge arrays must match deployed package.json exactly — WebSocket replaced with Socket.io, Tiptap replaced with react-markdown throughout; Next.js Image requires explicit width/height to prevent CLS
- **Phase 36 Plan 03:** Screenshots captured via Playwright from authenticated live production sessions at 1280x800; stored in apps/web/public/screenshots/ and served as static assets
- **Phase 36 Plan 02:** TeamFlow case study must present real-time features as shipped, not future promises — Challenge 1 rewritten as solved (AUTH_TRUST_HOST=true, Socket.IO room join before Prisma async queries)
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
Stopped at: Phase 37 Plan 01 complete — ALL PHASES COMPLETE. v4.0 milestone fully closed. LIVE-03 and LIVE-04 formally documented. Phase 34 formally closed with 34-02-SUMMARY.md and 34-VERIFICATION.md.
Resume file: None
Next action: None — all 52 plans across all 12 phases are complete. Portfolio is production-ready. All 12 v4.0 requirements satisfied.
