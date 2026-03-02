---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: AI SDR App
status: unknown
last_updated: "2026-03-02T04:57:08.092Z"
progress:
  total_phases: 15
  completed_phases: 11
  total_plans: 62
  completed_plans: 58
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28 after v5.0 start)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** Milestone v5.0 — AI SDR App, Phase 45 (Next.js Frontend)

## Current Position

Phase: 46 of 46 (Demo Seed + Portfolio Integration) — IN PROGRESS
Plan: 3 of 3 — Plan 46-02 fully COMPLETE (all tasks including human-verify checkpoint approved). Ready for Plan 46-03 (portfolio case study).
Status: Phase 46 IN PROGRESS — Plan 46-02 complete (all 3 tasks). AI SDR deployed to production: https://ai-sdr.fernandomillan.me (web) and https://ai-sdr-api.fernandomillan.me (API). SSE streaming verified with X-Accel-Buffering: no. 8 seeded leads visible after login. 6 fix commits applied during deployment (Traefik labels, GHCR paths, ts-node ESM, prisma generate, build context isolation). Ready for Plan 46-03 portfolio case study.
Last activity: 2026-03-01 — Plan 46-02 human verification approved — AI SDR live in production

Progress: [█████░░░░░] 24%

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (this milestone)
- Average duration: 5 min
- Total execution time: 29 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 41 Project Foundation | 2/2 | 10 min | 5 min |
| 42 Claude API Integration | 2/2 | 17 min | 9 min |
| 43 Enrichment Pipeline | 3/3 | 10 min | 3 min |
| 44 NestJS REST + SSE | 2/2 complete | 10 min | 5 min |
| 45 Next.js Frontend | 4/4 complete | 18 min | 5 min |

*Updated after each plan completion*
| Phase 46 P01 | 2 | 2 tasks | 2 files |
| Phase 46 P02 | 8 | 2 tasks | 4 files |
| Phase 46 P02 | 60 | 3 tasks | 4 files |

## Accumulated Context

### Decisions (relevant to v5.0)

- **v4.1:** Screenshots in `apps/web/public/screenshots/` at 1280x800; served via `next/image`
- **v5.0 research:** ANTHROPIC_API_KEY in NestJS only — enforce from day one, never in client components
- **v5.0 research:** No Redis/BullMQ — in-process pipeline with callback-based SSE emitter (sequential steps, not parallel)
- **v5.0 research:** Only email personalization step streams tokens — qualify/enrich use structuredOutput (not renderable incrementally)
- **v5.0 research:** temperature: 0 on all structured output calls — lock before any UI is built on top
- **v5.0 research:** Pre-scrape and cache in seed — never run live scraping during recruiter sessions
- **v5.0 research:** X-Accel-Buffering: no header required on Coolify for SSE to work through Nginx proxy
- **41-01:** ai-sdr is a standalone directory (not Turborepo workspace) — avoids monorepo coupling
- **41-01:** PrismaService extends PrismaClient directly — no shared package for standalone app
- **41-01:** Postgres on port 5436 — avoids conflict with teamflow:5434 and devcollab:5435
- **41-01:** docker-compose DATABASE_URL overrides .env to use internal service name postgres:5432
- **41-02:** icpScore is nullable Int — null until pipeline qualify step runs; set to integer after
- **41-02:** Dockerfile must COPY prisma before npm ci — postinstall runs prisma generate which requires schema
- **41-02:** DemoLead.seedKey is @unique — Phase 46 seed script uses this for idempotent upserts
- **41-02:** EmailSequence.body uses @db.Text — email bodies are long, avoids VARCHAR limit
- **42-01:** zodOutputFormat() takes 1 arg (schema only) — plan template had wrong 2-arg call; corrected during execution
- **42-01:** Use claude-sonnet-4-6 as private constant in ClaudeService — single place to change for all Phase 43 pipeline steps
- **42-01:** nullable() not optional() for EnrichSchema fields — Anthropic structured outputs require all fields in JSON schema required array; optional() would cause API rejection
- **42-02:** Zod v4 required — zodOutputFormat() calls z.toJSONSchema() which only exists in zod v4+; upgraded from v3.25.76 to v4.3.6 (no schema changes needed)
- **42-02:** Prompt constants co-located in src/claude/prompts/ — single canonical import location for Phase 43 pipeline services
- **42-02:** ICP rubric uses two few-shot examples anchoring the score distribution — delta=0 between two runs at temperature 0 confirmed
- **43-01:** cheerio 1.x ships own TypeScript types — do NOT install @types/cheerio (would cause type conflicts)
- **43-01:** responseType 'text' critical on axios.get — prevents SyntaxError when HTML is treated as JSON
- **43-01:** ScraperService.scrape() catch block returns '' for ALL exceptions — resilience over verbosity for pipeline input steps
- **43-01:** Cloudflare detection uses dual-check: HTTP status 403/503 AND HTML marker strings — covers both redirect-blocked and challenge-page cases
- **43-02:** PersonalizeService.buildPersonalizeInput() formats EnrichOutput as labeled rows under "## Enrichment Context" heading — null fields render as "Unknown", empty arrays render as "Unknown"
- **43-02:** Services omit @anthropic-ai/sdk import entirely — all AI calls go through ClaudeService abstraction layer per architecture decision from Phase 42
- **43-03:** PipelineService exported only from PipelineModule — thin AI services remain internal (Phase 44 injects PipelineService via PipelineModule import)
- **43-03:** STEP_QUALIFY/ENRICH/PERSONALIZE constants defined in pipeline.service.ts — Phase 45 queries AIOutput by these exact strings, never drift
- **44-01:** POST /leads creates Lead record only — pipeline triggered from SSE endpoint in Plan 02, not from POST handler
- **44-01:** LeadsModule imports PipelineModule in Plan 01 even though PipelineService only used in Plan 02 — avoids re-touching module file
- **44-01:** ThrottlerGuard as APP_GUARD (global) + @Throttle(5/60s) on POST /leads + @SkipThrottle on all GET endpoints including health
- **44-01:** rootDir: ./src added to tsconfig.json — fixes Docker dist/main.js path (was outputting to dist/src/main.js without rootDir)
- **44-02:** @Res() injected without passthrough:true in @Sse() method — @Sse() owns response lifecycle; @Res() used only for setHeader and close listener
- **44-02:** Observable/callback bridge pattern: new Observable<MessageEvent>(subscriber => onStep callback) connects PipelineService StepCallback to SSE subscriber.next()
- **44-02:** closed boolean flag + subscriber.closed guard in onStep prevents "Cannot call next on closed subscriber" errors after client disconnect
- **45-01:** Next.js 16.1.6 installed (not 15 as planned) — middleware.ts renamed to proxy.ts with proxy() function export per Next.js 16 convention
- **45-01:** turbopack.root set in next.config.ts — silences multiple-lockfiles workspace root warning in monorepo context
- **45-01:** Radix Color tokens override Shadcn oklch defaults — CSS variables point to Radix slate/blue/red/green/amber scale steps
- **45-01:** web/.gitignore pattern changed from .env* to .env*.local — allows .env.example to be tracked in git while blocking .env.local secrets
- **45-02:** leads/page.tsx uses explicit LeadSummary[] type annotation — TypeScript strict mode requires it when let [] is reassigned inside try/catch
- **45-02:** createLead Server Action calls revalidatePath('/leads') before returning — ensures table refreshes if user navigates back
- **45-02:** LeadInputForm navigates to /leads/:id on submit via router.push — leads user directly to SSE pipeline monitor (Plan 03)
- **45-03:** shouldStream = lead.status === 'pending' only — prevents double pipeline trigger for processing/complete/failed leads; SSE endpoint IS the pipeline trigger
- **45-03:** onerror does NOT reconnect EventSource — NestJS 30s pipeline timeout is terminal, not a transient network error to retry
- **45-03:** NEXT_PUBLIC_API_URL env var required in Client Component — server-side API_URL is not accessible in browser context
- **45-04:** ScoreCard/WhyScoreCard/EnrichmentCard are RSC (no 'use client') — only EmailPreview needs client context for clipboard API
- **45-04:** navigator.clipboard.writeText() used directly in EmailPreview — no library needed; Sonner toast already wired in layout.tsx
- **45-04:** Copy button disabled={!emailText} — prevents clipboard call when email is empty (pipeline not yet complete)
- **46-01:** Seed script uses raw new PrismaClient() — not PrismaService which requires NestJS DI container
- **46-01:** All 8 leads hand-authored (not faker) — DEMO-02 quality requires company-specific facts in personalized emails
- **46-01:** DemoLead.seedKey @unique is the idempotency guard — re-run is safe, skips existing leads
- **46-02:** NEXT_PUBLIC_API_URL passed as Docker build ARG (not runtime ENV) — Next.js bakes NEXT_PUBLIC_ vars into client bundle at build time; runtime ENV has no effect
- **46-02:** Seed Dockerfile uses ts-node --skip-project flag — avoids needing tsconfig.json in runner stage
- **46-02:** coolify-compose dependency chain: postgres healthy → api healthy → seed completed_successfully → web starts
- **46-02:** build-and-push-ai-sdr depends only on [test] (not lighthouse) — AI SDR CI independent of Teamflow Lighthouse
- **46-02:** Traefik labels + coolify-overlay external network required in Coolify compose for custom domain routing
- **46-02:** ts-node --compiler-options '{"module":"commonjs"}' required on Alpine — --skip-project alone causes ERR_REQUIRE_ESM
- **46-02:** GHCR image paths in compose must match github.repository format (owner/repo) — ghcr.io/owner/repo/image-name
- **46-02:** web/ must be excluded from api Docker build context via .dockerignore — prevents node_modules conflict
- **46-02:** AI SDR live at https://ai-sdr.fernandomillan.me — PORT-03 dependency satisfied

### Pending Todos

None.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 5 | add demo credentials box to teamflow login for consistency with devcollab | 2026-02-28 | 5f31ef1 | [5-add-demo-credentials-box-to-teamflow-log](./quick/5-add-demo-credentials-box-to-teamflow-log/) |

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 46-02-PLAN.md all 3 tasks — Docker infrastructure deployed to Coolify, SSE streaming verified in production. Ready for Plan 46-03 (portfolio case study — "View Live Demo" button at https://ai-sdr.fernandomillan.me).
Resume file: None

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE | v4.0 COMPLETE | v4.1 COMPLETE
