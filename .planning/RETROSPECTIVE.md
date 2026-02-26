# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v4.0 — Live QA & Content Polish

**Shipped:** 2026-02-26
**Phases:** 4 (34–37) | **Plans:** 9 | **Commits:** ~49

### What Was Built
- Diagnosed and fixed 6 production auth failures across DevCollab and TeamFlow (COOKIE_DOMAIN, AUTH_TRUST_HOST, PORT, Redis deadlock, CORS_ORIGIN, AUTH_SECRET rename in NextAuth v5)
- Full end-to-end QA of both recruiter flows — 9/9 DevCollab steps PASS, 11/11 TeamFlow steps PASS
- Fixed 2 runtime bugs found during QA: DevCollab logout used internal container URL; TeamFlow Kanban had session hydration race + Socket.IO presence join race
- Rewrote both case studies with accurate copy, corrected badge arrays, captured 4 live screenshots and wired into case studies + ProjectCard
- Phase 37 inserted to close tracking gap: created missing 34-02-SUMMARY.md + 34-VERIFICATION.md from Phase 35 evidence

### What Worked
- Retrospective verification pattern: citing existing walkthrough evidence from Phase 35 to satisfy Phase 34 documentation requirements post-facto was clean and traceable
- Audit-before-complete workflow caught the Phase 34 documentation gap before archival — Phase 37 closed it without disrupting the milestone
- 3-source cross-reference (VERIFICATION × SUMMARY frontmatter × REQUIREMENTS traceability) gave high confidence in completeness
- Fix-forward approach: bugs found in QA were fixed immediately in the same phase rather than deferred

### What Was Inefficient
- Phase 34 documentation gap required an entire Phase 37 — earlier documentation discipline (writing SUMMARY.md on the day work completes) would have avoided this
- STATE.md had a pre-existing `total_plans: 54` vs `52/52` completed mismatch — minor tracking artifact from earlier milestones that was never caught
- Live auth debugging is inherently slow (VPS round-trips, env var iteration, Coolify redeployment cycles)

### Patterns Established
- **Retrospective verification:** When phase artifacts are missing post-facto, cite timestamped evidence from subsequent phase SUMMARYs and walkthroughs — creates a traceable audit trail without reinventing work
- **Production URL for case study CTAs:** All portfolio CTAs to live apps must use absolute `https://` URLs — relative paths resolve to fernandomillan.me subdirectory
- **Reverse proxy auth headers:** Next.js API routes behind Coolify must use `x-forwarded-proto` + `x-forwarded-host` for redirect URL construction
- **Socket.IO room join order:** Always call `client.join(roomName)` before any async Prisma/DB queries to prevent presence event race conditions
- **NextAuth v5 naming:** `AUTH_SECRET` (not `NEXTAUTH_SECRET`), `AUTH_TRUST_HOST=true` required behind reverse proxy

### Key Lessons
1. **Document on the day.** Phase 34 work was done but not documented — Phase 37 existed solely to close the documentation gap. Write SUMMARY.md the same session the work completes.
2. **Cross-subdomain cookies need explicit COOKIE_DOMAIN.** When the Next.js frontend and NestJS API are on different subdomains (`devcollab.` vs `devcollab-api.`), cookies set by the API won't be sent to the frontend without `COOKIE_DOMAIN=.fernandomillan.me`.
3. **Lighthouse lhci `--collect.url` flags don't override config `startServerCommand`.** For production URL auditing, use a separate `lighthouserc.production.json` without `startServerCommand`.
4. **Audit milestone before archiving** — the audit workflow caught the Phase 34 gap. Running audit first made completion clean and traceable.

### Cost Observations
- Model mix: primarily Sonnet 4.6 throughout
- Sessions: ~4-6 sessions across 2 days
- Notable: Phase 37 (documentation closure) was fastest phase at ~4 min — well-structured insertion via the gap-closure workflow

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 8 | 43 | Initial build — TeamFlow foundation + auth |
| v1.1 | 6 | 26 | Design system before deployment — WCAG AA |
| v2.0 | 8 | 32 | Second app (DevCollab) in same monorepo |
| v2.5 | 5 | 17 | Matrix aesthetic overhaul — animation-first |
| v3.0 | 2 | 6 | Deployment focus — Coolify + debt closure |
| v3.1 | 5 | 14 | Polish: Lenis + GSAP + magnetic buttons + footer |
| v4.0 | 4 | 9 | Live QA + content accuracy — recruiter-readiness |

### Top Lessons (Verified Across Milestones)

1. **Document same-day.** Multiple milestones had trailing documentation gaps (v4.0 Phase 34, earlier phases). Write SUMMARY.md before closing the session.
2. **Lighthouse CI must be set up before deploying.** Catching performance regressions late costs more time than gating from the start.
3. **Audit before completing a milestone.** The `audit-milestone` workflow catches requirement gaps that would otherwise surface at demo time.
