# Project Research Summary

**Project:** AI SDR Replacement System (v5.0 portfolio milestone)
**Domain:** AI-powered lead qualification, CRM enrichment, personalized outbound email generation, follow-up sequencing
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

This project is a portfolio-grade AI SDR (Sales Development Representative) replacement system targeting technical recruiters as the primary audience. Experts build AI SDR tools on a pipeline architecture where lead data flows through sequential enrichment stages — qualification scoring, CRM enrichment, email personalization, and sequence generation — each driven by a structured LLM call. The core technical differentiation for this portfolio context is not mimicking a real SDR tool's feature set (email sending, CRM integrations, multi-tenancy) but rather demonstrating production-quality AI integration patterns: structured JSON outputs from Claude, streaming prose generation, and explainable AI reasoning surfaces.

The recommended approach is a hybrid synchronous pipeline with SSE progress events. The NestJS backend orchestrates four sequential Claude API calls (qualify then enrich then personalize then generate sequence), fires the pipeline in-process without blocking the HTTP response, and emits step-level progress events via a NestJS `@Sse()` endpoint. The critical architectural insight from research is that only the email personalization step should stream tokens to the frontend — the three structured output steps (qualification, enrichment, sequence) cannot be meaningfully rendered incrementally since partial JSON is not displayable. This hybrid approach delivers the highest recruiter-visible impressiveness (watching Claude write an email in real time) at medium implementation complexity, without the Redis infrastructure overhead that background job queues would require.

The primary risks center on three areas: AI output quality (Claude hallucinating company details when scraping fails; inconsistent lead scores from non-zero temperature), streaming infrastructure (NestJS SSE Observable memory leaks from abandoned connections; Nginx/Coolify buffering blocking token delivery), and demo data quality (generic seeded leads with no score variance undermine the demo's credibility). All three are well-understood and have concrete mitigations documented in research. The most important preventive decisions are: setting `temperature: 0` on all structured output calls before building any UI on top, adding graceful scraping fallbacks with Cloudflare challenge page detection, and pre-generating all demo content during seeding rather than live-generating during recruiter sessions.

---

## Key Findings

### Recommended Stack

The locked project stack (Next.js 15, NestJS 11, Prisma, Postgres, `claude-sonnet-4-6`) requires four new technology additions for the AI SDR capabilities. The `@anthropic-ai/sdk` v0.78.0 is the official Anthropic SDK providing streaming, structured outputs, and built-in retry logic — it must live in NestJS only, never in client components. Cheerio v1.2.0 plus Axios handles company URL scraping without the 300MB browser engine overhead that Playwright would add. Zod v3 with `zod-to-json-schema` defines structured output schemas with TypeScript type inference that carries through to Prisma writes. No Redis or BullMQ is needed: the architecture decision settled on an in-process async pipeline because the pipeline steps are sequential (each step's output is the next step's input), making parallel queue distribution architecturally incorrect for this use case.

**Core technologies:**
- `@anthropic-ai/sdk` v0.78.0 — Claude API client with streaming, structured outputs, built-in retry — official SDK, only viable choice; do not use Vercel AI SDK in NestJS
- `cheerio` v1.2.0 — HTML parsing for company URL scraping — stable release, ships own TypeScript types (do NOT install `@types/cheerio`)
- `axios` v1.7.x — HTTP fetch layer for cheerio scraping — handles redirects, timeouts, custom User-Agent headers; already common in NestJS
- `zod` v3.24.x — schema definition and Claude response validation — TypeScript-first; v4 still in beta, do not use
- `zod-to-json-schema` v3.23.x — converts Zod schemas to JSON Schema for Claude's `output_config.format` — required bridge until Zod v4 stabilizes
- `@nestjs/throttler` v6.x — HTTP rate limiting on enrichment endpoints — prevents API flooding from the UI layer

**Critical version and usage notes:**
- Do NOT install `@types/cheerio` — conflicts with Cheerio 1.x built-in types
- Do NOT use Zod v4 — still in beta, breaks `zod-to-json-schema` integration
- Structured outputs are GA (no beta header needed): use `output_config.format`, not deprecated `output_format` or `anthropic-beta: structured-outputs-2025-11-13` header
- Redis and BullMQ are NOT needed for this architecture — the pipeline steps are sequential dependencies, not parallel workers
- Claude API Tier 1 limits: 50 RPM, 30K ITPM — sufficient for demo scale with prompt caching on repeated system prompts

### Expected Features

Research identifies a clear distinction between table stakes (recruiter expects these to exist), differentiators (what makes a senior engineer stand out), and anti-features (commonly requested but counterproductive). The anti-features list is as important as the must-haves.

**Must have (P1 — table stakes):**
- Lead input form (name, company, URL) — entry point for the entire demo
- Lead list with score column, status column, sortable by score descending — proves there is a real backend
- Lead score displayed prominently (0-100) with horizontal colored bar — first visual hit on detail view; horizontal bar not circular gauge
- Lead detail view showing all enrichment fields — clicking must reveal depth
- 3-email follow-up sequence displayed as vertical timeline (Day 1 / Day 5 / Day 10)
- Loading progress indicator with explicit step labels while Claude API runs — prevents "is it broken?" confusion during 3-8 second calls
- Demo account pre-seeded with 5-8 varied leads (full score spectrum) — recruiter will not wait for live generation
- Copy buttons on emails — basic polished UX signal

**Should have (P2 — differentiators that signal senior-level AI work):**
- ICP reasoning transparency ("Why this score?" collapsible card) — primary technical differentiator showing prompt engineering sophistication; shows matched vs weak criteria
- Personalization callout under each email ("Personalized for: Series A milestone, SDR hiring signal") — explainable AI pattern
- Intent signals as badge cloud (max 4: Hiring SDRs, Recently Funded, Expanding to EMEA, etc.) — visual richness requiring prompt engineering
- Enrichment metadata as structured cards: company size, industry, funding stage, tech stack as badge chips, pain points as bullet list

**Defer (v2+):**
- Bulk lead import via CSV
- Lead status workflow (contacted / replied / meeting booked)
- Export to CSV
- Sequence step editor for custom cadence timing
- Webhook integrations to HubSpot / Salesforce

**Anti-features (do not build):**
- Actual email sending — SMTP, deliverability, CAN-SPAM overhead with zero recruiter-visible benefit
- Drag-and-drop kanban pipeline — TeamFlow already demonstrates dnd-kit; duplication adds no new portfolio signal
- Multi-user workspaces — single shared demo account is correct; multi-tenancy adds weeks of work that hides the AI story
- Streaming all pipeline steps — structured JSON cannot be rendered incrementally; only email personalization step should stream
- Live web scraping during demo — pre-scrape and cache in seed; live scraping fails on ~20-30% of sites during recruiter sessions

### Architecture Approach

The architecture is a hybrid synchronous pipeline with SSE progress events and selective email streaming. The NestJS `LeadsController` receives a POST, creates the Lead record, fires `PipelineService.processWithStream()` without awaiting it (in-process fire-and-forget), and returns the `leadId` immediately. The Next.js client opens an `EventSource` to `GET /leads/:id/stream` which returns a NestJS `@Sse()` Observable. The pipeline emits four types of SSE events: step-complete events for qualify, enrich, and sequence (structured JSON calls), and token events during email personalization (the one streaming step). After pipeline completion, all results are persisted to Postgres and displayed via standard RSC fetches on the lead detail page.

**Major components:**
1. `ClaudeService` (NestJS) — isolated wrapper exposing `structuredOutput<T>()` and `streamText()`. All `@anthropic-ai/sdk` usage is contained here. No other service imports the SDK directly.
2. `PipelineService` (NestJS) — orchestrator for qualify then enrich then personalize then sequence. Receives an emitter callback from the SSE Observable; calls it after each step and for each token during email generation. Includes 100ms startup delay to give the client time to connect EventSource before first event fires.
3. `ScraperService` (NestJS) — Axios + Cheerio extracts 3000-char text summary from company URL; validates response is not a Cloudflare challenge page; returns empty string on failure (graceful fallback is required, not optional).
4. `LeadsController` (NestJS) — REST endpoints (POST /leads, GET /leads, GET /leads/:id) plus `@Sse(':id/stream')` endpoint with `res.on('close')` cleanup wired.
5. `PipelineMonitor` (Next.js, `'use client'`) — EventSource consumer that renders step progress indicators and accumulates streaming email tokens into live text display.
6. CRM Dashboard and Lead Detail (Next.js RSC) — standard server-side fetches of persisted Postgres data; no client-side state management needed for completed leads.

**Database schema highlights:**
- `Lead` — status enum (pending/processing/complete/error), denormalized score + industry + companySize for fast list queries without AIOutput joins
- `AIOutput` — Json column per pipeline step (handles different shapes per step without per-field migrations); unique constraint on `[leadId, step]` prevents duplicates
- `EmailSequence` — denormalized 3-email table for fast CRM dashboard reads without parsing AIOutput JSON on every list load
- `DemoLead` — separate table for pre-seeded content; prevents idempotency issues when re-running the seed script

### Critical Pitfalls

Eight pitfalls were identified. The five with the highest impact on demo success:

1. **Structured outputs guarantee format, not accuracy** — Claude hallucinated company details fill required schema fields when scraping fails or data is sparse. Mitigate with nullable schema fields (`anyOf: [type: string, type: null]`), explicit "use null if unknown" system prompt instruction, a `confidence` field alongside AI-generated values, and range validation before Prisma writes. Verify during seed phase that lead scores show full-spectrum variance (not all clustered 70-85).

2. **NestJS SSE Observable never closes on client disconnect** — Confirmed GitHub issue #11601 produces `MaxListenersExceededWarning` with orphaned Claude API streams accumulating under demo load. Mitigate with `res.on('close')` cleanup handler in the SSE controller, `stream.abort()` in a finally block on the Claude stream, and `timeout(30000)` RxJS operator as a safety net on the Observable.

3. **Next.js route handler buffers the entire stream before sending** — Awaiting async work before returning `Response` causes Next.js to buffer everything; recruiter sees blank screen for 10-30 seconds then all text appears at once. Mitigate by calling NestJS SSE directly from the browser EventSource (bypass Next.js proxy entirely), add `X-Accel-Buffering: no` header for Coolify's Nginx proxy, and `export const dynamic = 'force-dynamic'` on any route files that do proxy. Verify in Docker build, not just `next dev`.

4. **Web scraping silently returns Cloudflare challenge pages** — Default Axios headers (User-Agent: axios/1.x) get 403'd or Cloudflare challenge pages (which return HTTP 200 with placeholder HTML). Claude then hallucinates company data from "Just a moment..." page text. Mitigate with realistic browser User-Agent headers, post-fetch detection (`html.includes('cf-browser-verification')`), and for demo seeds: pre-scrape and cache content in Prisma so live scraping is never called during recruiter sessions.

5. **Inconsistent lead scores across runs** — Non-zero temperature plus an underspecified scoring rubric produces 10-20 point variance on repeated calls for the same lead. Recruiter who refreshes notices scores change. Mitigate with `temperature: 0` on all structured output calls, explicit numeric rubric in system prompt (define what 80-100 means vs 60-79 vs below), 2-3 few-shot examples, and persisting scores to Prisma — never re-run scoring on page load.

---

## Implications for Roadmap

Based on research, the build order is driven by hard dependencies: the database schema must exist before Claude calls can persist results; ClaudeService must be validated before the pipeline is built on top of it; the pipeline must work end-to-end before SSE transport is wired; and the backend API must be stable before the frontend can consume it. Research also identifies the demo seed phase as a critical path item that is typically underestimated — pre-seeded data must be generated against the live Claude API and reviewed before committing to the seed file.

### Phase 1: Project Foundation and Database Schema

**Rationale:** Everything else depends on the database schema. Prisma migrations are expensive to change after pipeline logic is written against them. Design the schema correctly first, including the nullable fields and the `confidence` column pattern that prevent hallucination issues downstream.
**Delivers:** NestJS app skeleton, Prisma schema (Lead, AIOutput, EmailSequence, DemoLead models), Docker Compose with Postgres, environment variable configuration including `ANTHROPIC_API_KEY` wired to NestJS config only.
**Addresses:** API key security pitfall (ANTHROPIC_API_KEY configured in NestJS env, CI grep check added from day one), Prisma seed race condition setup (sequential seed pattern established in seed script structure before any data is added).
**Avoids:** Pitfall 6 (API key browser exposure — enforced by architecture from day one, not by discipline later), Pitfall 8 (Prisma seed race condition — sequential seeding pattern established in seed script before any leads are seeded).
**Research flag:** Standard patterns — no research needed. Matches the established Prisma + NestJS + Docker Compose pattern from TeamFlow and DevCollab.

### Phase 2: Claude API Integration (ClaudeService and Schema Validation)

**Rationale:** ClaudeService is the dependency of every pipeline step. Validate that structured outputs return correctly-typed responses before building business logic on top. This is where prompt engineering happens — getting `temperature: 0`, nullable fields, and rubric definitions correct early prevents cascading quality issues in later phases that are expensive to retrofit.
**Delivers:** `ClaudeService` singleton with `structuredOutput<T>()` and `streamText()` methods, Zod schemas for qualify/enrich/sequence steps with nullable fields and confidence metadata, integration test confirming Claude returns valid typed responses for each schema against real API calls.
**Uses:** `@anthropic-ai/sdk` v0.78.0, `zod` v3.24.x, `zod-to-json-schema` v3.23.x, single `CLAUDE_MODEL` constant definition.
**Avoids:** Pitfall 1 (structured output accuracy — nullable fields and confidence fields in schema from the start), Pitfall 5 (wrong model ID — single constant defined here, never hardcoded at call sites), Pitfall 7 (inconsistent scores — `temperature: 0` locked in before any UI is built on top of it).
**Research flag:** Needs iteration — Claude prompt engineering for ICP scoring rubric and nullable field design requires 5-10 test calls to validate score variance and reasoning quality before proceeding to Phase 3.

### Phase 3: Enrichment Pipeline (ScraperService and PipelineService)

**Rationale:** The scraper and pipeline orchestrator are the core business logic. Build and validate these before adding HTTP endpoints so failures are isolated to the AI/data layer, not the transport layer. Test with direct TypeScript calls and console.log emitters before wiring to SSE.
**Delivers:** `ScraperService` (Axios + Cheerio with realistic User-Agent, Cloudflare challenge page detection, graceful empty-string fallback), `QualifyService`, `EnrichService`, `PersonalizeService`, `SequenceService`, `PipelineService` orchestrator with callback-based emitter pattern. End-to-end pipeline verified with a single test lead printing step events to console.
**Uses:** `axios` v1.7.x, `cheerio` v1.2.0.
**Avoids:** Pitfall 4 (bot detection — realistic User-Agent and challenge page validator in ScraperService from the start), Anti-Pattern 3 (storing raw HTML — ScraperService returns 3000-char text summary only, discards all raw HTML before returning).
**Research flag:** Scraping reliability needs validation against real URLs — test the ScraperService against 5 different company URLs including at least one Cloudflare-protected site to confirm fallback behavior works correctly before wiring to the HTTP layer.

### Phase 4: NestJS REST and SSE Endpoints

**Rationale:** Expose the pipeline over HTTP only after it works end-to-end in isolation. The SSE endpoint is the most architecturally complex piece — the Observable/callback bridge, the 100ms startup delay for client connection establishment, and the `res.on('close')` cleanup all need to be correct before the Next.js frontend depends on them.
**Delivers:** `LeadsController` with POST /leads, GET /leads, GET /leads/:id endpoints, `@Sse(':id/stream')` endpoint with Observable setup and `res.on('close')` cleanup wired, `@Throttle()` guard on enrichment and generation endpoints, end-to-end curl test confirming SSE events arrive in correct order.
**Implements:** Hybrid synchronous pipeline with SSE progress events (Option C from architecture research) — no Redis, no BullMQ, in-process fire-and-forget with callback-based SSE emitter.
**Avoids:** Pitfall 2 (NestJS SSE memory leak — `res.on('close')` + `stream.abort()` + `timeout(30000)` implemented from the start, not retrofitted), Pitfall 2 secondary (API rate limiting — `@nestjs/throttler` guard on generation endpoints).
**Research flag:** Standard NestJS `@Sse()` patterns are well-documented in official docs. The `res.on('close')` cleanup pattern has confirmed community solutions for GitHub issue #11601. No additional research needed — follow the documented fix directly.

### Phase 5: Next.js Frontend

**Rationale:** Frontend is the last dependency in the chain. Build after the API is stable and SSE events are verified. The `PipelineMonitor` component (EventSource consumer) is the most complex frontend piece — everything else is standard RSC data fetching with Prisma-backed data.
**Delivers:** CRM dashboard (RSC, lead list table with score column), lead input form (RSC with client validation), lead detail page with `PipelineMonitor` EventSource client component, step progress indicators, streaming email preview, 3-email sequence vertical timeline, ICP score horizontal colored bar, "Why this score?" collapsible card, enrichment fields two-column grid, intent signals badge cloud, copy-to-clipboard buttons on emails.
**Avoids:** Pitfall 3 (Next.js buffering — browser EventSource connects directly to NestJS SSE endpoint, bypassing any Next.js route handler proxy entirely), design constraint (no purple in any element; Matrix green `#00FF41` for accent elements consistent with portfolio theme; horizontal score bar not circular gauge).
**Research flag:** Standard Next.js 15 App Router patterns plus browser EventSource API. Both are well-documented standards. No research phase needed.

### Phase 6: Demo Seed Data and Portfolio Integration

**Rationale:** Pre-seeded demo data is a critical path item that is regularly treated as an afterthought. The seed script must run against the live Claude API to generate realistic, varied enrichment content. Seeded leads must cover the full ICP score spectrum. This phase is the final quality gate before recruiter exposure.
**Delivers:** Seed script with 6-8 varied leads (2-3 strong ICP 85-95, 2-3 moderate 55-70, 1-2 poor fit 20-40) with `faker.seed(42)` for deterministic IDs, sequential `for...of` upsert pattern with idempotency test (run twice, verify same lead count), demo credentials displayed on login page, Coolify deployment with verified SSE streaming headers (`X-Accel-Buffering: no`), portfolio project card and `/projects/ai-sdr` case study page.
**Avoids:** UX pitfall (generic leads with no variance — specific fictional companies with distinct industries, specific funding rounds, and realistic ICP profiles), Pitfall 1 (hallucinated demo data — seed generated against real Claude API with validated output reviewed per lead), Pitfall 7 (score variance — verified across all seeded leads before committing seed file), Pitfall 8 (seed race condition — sequential seeding enforced).
**Research flag:** Needs manual review — run seed script, inspect all 6-8 generated leads for score variance, email personalization quality (does each email reference company-specific facts?), and realistic enrichment signals. This is the one phase that cannot be fully automated; it requires human judgment on demo data quality before committing.

### Phase Ordering Rationale

- Schema before Claude: Claude output fields must map to Prisma columns. Designing schema and Claude output schemas simultaneously prevents the costly migrations that happen when Claude output shape is discovered after the data model is already seeded.
- ClaudeService before Pipeline: The service boundary ensures prompt engineering is done in isolation where iterations are cheap. Building the pipeline on top of an unvalidated ClaudeService means debugging two systems simultaneously when scores are wrong.
- Pipeline before HTTP: A pipeline that works with console.log emitters confirms Claude calls, Prisma writes, and business logic are correct before adding transport complexity. Failures after this point are isolated to the HTTP and SSE layer.
- Backend before Frontend: Standard dependency order. The EventSource URL in the frontend is a constant that only works if the NestJS endpoint exists and returns the correct SSE event shapes.
- Seed data last but before deployment: Seed data quality is the final gating factor before recruiter exposure. Generating seed against the live API after all pipeline logic is stable guarantees the seed reflects the actual system's behavior and prompt engineering quality.

### Research Flags

Phases needing deeper iteration during implementation:
- **Phase 2 (Claude API Integration):** ICP scoring prompt engineering requires hands-on iteration — run 5-10 test calls against sample leads and inspect score variance and reasoning quality before proceeding. The nullable field design, few-shot examples, and explicit scoring rubric are not boilerplate; they require domain-specific calibration.
- **Phase 6 (Demo Seed):** Seed data quality requires manual review per lead — no automated test can verify that generated emails are "genuinely personalized" vs. template-like. Review each seeded lead's emails individually before committing the seed file.

Phases with standard patterns (skip research-phase during planning):
- **Phase 1 (Foundation):** Matches the established Prisma + NestJS + Docker Compose pattern from TeamFlow and DevCollab. Well-documented and previously executed.
- **Phase 4 (NestJS SSE):** Official NestJS docs cover `@Sse()` completely. GitHub issue #11601 has documented community solutions. No new research needed.
- **Phase 5 (Next.js Frontend):** Standard Next.js 15 App Router patterns plus browser EventSource API. No new research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against official npm and Anthropic docs as of 2026-02-28. SDK 0.78.0 confirmed latest (released 2026-02-19). Structured outputs GA status confirmed on claude-sonnet-4-6. Architecture decision (no BullMQ/Redis) is well-reasoned against the sequential dependency structure of the pipeline. |
| Features | MEDIUM-HIGH | Table stakes and differentiators derived from competitor analysis (Apollo.io, AiSDR, Outreach.io, SalesLoft). Anti-features list based on development cost vs. recruiter signal ratio analysis — this is a subjective judgment call but well-reasoned against the 5-minute recruiter demo context. |
| Architecture | HIGH | Claude API patterns (structured outputs, streaming) verified against official Anthropic docs. NestJS `@Sse()` pattern verified against official NestJS docs. Database schema derived from explicit analysis of pipeline step output shapes. The SSE race condition (100ms startup delay) and Observable cleanup patterns are confirmed community solutions to documented issues. |
| Pitfalls | HIGH | Critical pitfalls sourced from official Anthropic docs, confirmed GitHub issues with issue numbers (NestJS #11601, Prisma #3242, Next.js #52809), and Anthropic's own consistency documentation. Model ID verified against official models overview page as of 2026-02-28. |

**Overall confidence:** HIGH

### Gaps to Address

- **Scraping reliability on the specific demo company URLs chosen:** Research identifies the risk of bot detection and Cloudflare blocking but cannot predict which URLs will be affected until the actual fictional company URLs are chosen and tested. Mitigation: test the ScraperService against each URL selected for demo seeding, and pre-cache scraped content in Prisma for those specific leads.

- **Claude API Tier 1 rate limits during seed generation:** Research documents Tier 1 limits (50 RPM, 30K ITPM) but 30 sequential Claude calls for 8-10 leads during seed script execution is untested. If the seed script hits rate limits, add per-call delays or use `p-limit(2)` for the seed script only (separate from the main pipeline which has no concurrency concern at demo scale).

- **SSE streaming through Coolify's specific Nginx configuration in production:** Research identifies `X-Accel-Buffering: no` as the standard fix for Nginx SSE buffering, but Coolify's internal Nginx proxy configuration may require additional settings. Verify in a Coolify staging deployment before the final demo build — do not wait until final deployment day to discover proxy buffering issues.

- **Email personalization quality as a subjective quality gate:** Research identifies the risk of template-like emails but cannot define exactly what prompt engineering produces genuinely personalized output without testing. This is the highest subjective quality gate in the project and must be validated through the seed review phase (Phase 6).

---

## Sources

### Primary (HIGH confidence)
- Anthropic Official Docs — `platform.claude.com/docs/en/build-with-claude/structured-outputs` — structured outputs GA status, `output_config.format` shape, ZDR note on lead data
- Anthropic Official Docs — `platform.claude.com/docs/en/build-with-claude/streaming` — `.stream()` TypeScript SDK patterns, SSE event types, `text_delta` events, error handling mid-stream
- Anthropic Official Docs — `platform.claude.com/docs/en/api/rate-limits` — Tier 1: 50 RPM, 30K ITPM, 8K OTPM for claude-sonnet-4-6; prompt caching ITPM exclusion
- Anthropic Official Docs — `platform.claude.com/docs/en/about-claude/models/overview` — confirmed `claude-sonnet-4-6` as current model ID as of 2026-02-28
- Anthropic Official Docs — `platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency` — temperature and rubric-based scoring guidance
- Anthropic API Key Best Practices — `support.claude.com/en/articles/9767949` — official security guidance on server-side-only key usage
- GitHub: `anthropics/anthropic-sdk-typescript` releases — SDK v0.78.0 confirmed 2026-02-19
- npm: `bullmq` v5.70.1, `@nestjs/bullmq` v11.0.4, `cheerio` v1.2.0 — confirmed current versions
- NestJS Official Docs — `docs.nestjs.com/techniques/server-sent-events` — `@Sse()` decorator, `Observable<MessageEvent>` return type, auto-set SSE headers
- BullMQ Official Docs — `docs.bullmq.io/guide/nestjs` — NestJS integration (evaluated and rejected for this use case)
- Prisma GitHub Issue #3242 — confirmed upsert race condition with `Promise.all()`, official Prisma acknowledgement
- NestJS GitHub Issue #11601 — confirmed SSE `MaxListenersExceededWarning` under load, community solutions with `res.on('close')` cleanup

### Secondary (MEDIUM confidence)
- Apollo.io, AiSDR, Outreach.io, SalesLoft — competitor feature and UX pattern analysis via third-party reviews and documentation
- NestJS GitHub Issue #9517 — SSE disconnect handling needs explicit cleanup
- Next.js GitHub Issue #52809 — `abort` signal unreliability in App Router route handlers
- Medium: "Fixing Slow SSE in Next.js" (Jan 2026) — `X-Accel-Buffering: no` pattern confirmed for Nginx reverse proxy
- ZenRows blog: bot detection avoidance — realistic User-Agent and Accept header patterns for web scraping
- Koala ICP scoring, RollWorks ICP Fit Grade system — lead scoring display conventions (horizontal bar, 0-100 scale, grade labels)
- Instantly, Clay AI enrichment documentation — enrichment field depth and one-liner personalization patterns

### Tertiary (LOW confidence / needs validation during implementation)
- HackerNoon: "Streaming in Next.js 15: WebSockets vs SSE" — EventSource hook pattern (community article, verify against actual behavior)
- DEV.to: "Production-ready Claude streaming with Next.js" — TransformStream pattern for route handler proxy (community article)
- Coolify Nginx-specific SSE header requirements — inferred from general Nginx `X-Accel-Buffering` documentation; verify in actual Coolify deployment

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
