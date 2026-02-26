# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v4.0 — Live QA & Content Polish (Phase 34 complete — both apps live and working)

## Current Position

Phase: 35 of 36 (Full QA Audit & Fixes)
Plan: 01 of N complete
Status: Active — Plan 01 complete (TeamFlow CTA fix + Playwright CTA assertions)
Last activity: 2026-02-25 — Phase 35 Plan 01 complete: fixed TeamFlow CTA link bug, added E2E regression tests

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE

Progress: [████████████████████░░░░░░░░░░] 67% (33/36 phases complete — Phase 35 in progress)

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

- Live auth is broken on both apps — Phase 34 must diagnose before QA or content work can begin
- Screenshots for CONT-04 cannot be captured until auth is fixed and apps are fully functional

## Session Continuity

Last session: 2026-02-25
Stopped at: Phase 35 Plan 01 complete — TeamFlow CTA fixed, Playwright assertions added.
Resume file: None
Next action: /gsd:execute-phase 35 — continue remaining Phase 35 plans
