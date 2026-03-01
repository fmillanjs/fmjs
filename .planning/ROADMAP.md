# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 TeamFlow Foundation** - Phases 1-7 (shipped)
- ✅ **v1.1 Design System** - Phases 8-13 (shipped)
- ✅ **v2.0 DevCollab** - Phases 14-21 (shipped 2026-02-18)
- ✅ **v2.5 Matrix Portfolio Overhaul** - Phases 22-26 (shipped 2026-02-19)
- ✅ **v3.0 Deployment & Tech Debt Closure** - Phases 27-33 (shipped 2026-02-21)
- ✅ **v3.1 Portfolio Polish & Matrix Cohesion** - Phases 34-37 (shipped 2026-02-21)
- ✅ **v4.0 Live QA & Content Polish** - Phases 34-37 (shipped 2026-02-26)
- ✅ **v4.1 Screenshot Story Walkthroughs** - Phases 38-40 (shipped 2026-02-26)
- 🚧 **v5.0 AI SDR App** - Phases 41-46 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v4.1 (Phases 1-40) — SHIPPED</summary>

All phases 1-40 complete. See milestone archives in `.planning/milestones/`.

</details>

### 🚧 v5.0 AI SDR App (In Progress)

**Milestone Goal:** Build and deploy a standalone AI SDR Replacement System using the Claude API (lead qualification, CRM enrichment, personalized cold email generation), then add it to the portfolio as a third project.

**Repo note:** Phases 41-45 are work in a new standalone `ai-sdr` repo (NestJS + Next.js + Postgres). Phase 46 includes portfolio integration back into this monorepo (`apps/web`).

- [ ] **Phase 41: Project Foundation** - Standalone repo, Prisma schema (Lead, AIOutput, EmailSequence, DemoLead), NestJS skeleton, Docker Compose with Postgres
- [ ] **Phase 42: Claude API Integration** - ClaudeService with structuredOutput and streamText, Zod schemas, ICP scoring rubric validated at temperature 0
- [ ] **Phase 43: Enrichment Pipeline** - ScraperService, PipelineService orchestrator, qualify/enrich/personalize pipeline end-to-end in isolation
- [ ] **Phase 44: NestJS REST + SSE Endpoints** - LeadsController REST API, SSE streaming endpoint with cleanup, throttle guard
- [ ] **Phase 45: Next.js Frontend** - Auth (login + session), CRM dashboard, lead detail with PipelineMonitor, full pipeline UI with streaming email
- [ ] **Phase 46: Demo Seed + Portfolio Integration** - Seed script with 6-8 fictional leads, Coolify deployment with verified SSE, portfolio project card and case study

## Phase Details

### Phase 41: Project Foundation
**Goal**: The standalone ai-sdr repo exists with a running NestJS + Postgres stack, correct database schema, and ANTHROPIC_API_KEY wired securely to the backend only
**Depends on**: Nothing (first phase of v5.0 — new standalone repo)
**Requirements**: None (enabling infrastructure — no user-visible behavior until Phase 43+)
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts Postgres and NestJS without errors and NestJS connects to the database
  2. `prisma migrate dev` applies the Lead, AIOutput, EmailSequence, and DemoLead schema with no errors
  3. ANTHROPIC_API_KEY is readable from NestJS ConfigService and is absent from all client-side files and git history
  4. A GET /health endpoint returns 200
**Plans**: TBD

Plans:
- [ ] 41-01: Repo init, Docker Compose, NestJS scaffold, environment config
- [ ] 41-02: Prisma schema (Lead, AIOutput, EmailSequence, DemoLead models) and initial migration

### Phase 42: Claude API Integration
**Goal**: ClaudeService is validated — structured outputs return correctly-typed ICP scores and enrichment fields at temperature 0, with consistent scores across repeated calls for the same input
**Depends on**: Phase 41
**Requirements**: None (infrastructure validation — ClaudeService enables PIPE-01/04 in Phase 43 but is not itself user-visible)
**Success Criteria** (what must be TRUE):
  1. Calling ClaudeService.structuredOutput() with the qualify Zod schema returns an ICP score (0-100 integer) and reasoning string for a test lead input
  2. Running the qualify call twice for the same lead produces the same ICP score both times (temperature 0 determinism confirmed)
  3. Calling ClaudeService.structuredOutput() with the enrich Zod schema returns company size, industry, tech stack array, and pain points
  4. ClaudeService.streamText() returns an async stream of text tokens for a personalization prompt
  5. No module other than ClaudeService imports the Anthropic SDK directly
**Plans**: TBD

Plans:
- [ ] 42-01: ClaudeService with structuredOutput<T>() and streamText(), Zod schemas for qualify and enrich steps
- [ ] 42-02: Prompt engineering iteration — ICP scoring rubric, nullable fields, few-shot examples, temperature 0 variance validation

### Phase 43: Enrichment Pipeline
**Goal**: The full pipeline runs end-to-end in isolation — a lead input flows through scraping, qualification, enrichment, and email personalization, with all results persisted to Postgres
**Depends on**: Phase 42
**Requirements**: PIPE-01, PIPE-04
**Success Criteria** (what must be TRUE):
  1. ScraperService returns a text summary (up to 3000 chars) for a valid company URL and returns an empty string (not an error) for a Cloudflare-protected or unreachable URL
  2. PipelineService.processWithStream() completes all steps for a test lead and persists AIOutput records for qualify, enrich, and personalize steps to Postgres
  3. The pipeline emits step-progress events in order via the callback emitter: qualify-complete, enrich-complete, then streaming email tokens during personalize
  4. After pipeline completion, the Lead record in Postgres has a non-null ICP score (0-100), status set to complete, and denormalized industry and companySize fields
**Plans**: TBD

Plans:
- [ ] 43-01: ScraperService (Axios + Cheerio, realistic User-Agent, Cloudflare challenge detection, empty-string fallback)
- [ ] 43-02: QualifyService, EnrichService, PersonalizeService — each calling ClaudeService and returning typed results
- [ ] 43-03: PipelineService orchestrator with callback emitter pattern, end-to-end console test with Prisma writes confirmed

### Phase 44: NestJS REST + SSE Endpoints
**Goal**: The pipeline is exposed over HTTP — a lead can be submitted, listed, and retrieved via REST, with pipeline progress streamable via SSE and no memory leaks on client disconnect
**Depends on**: Phase 43
**Requirements**: LEAD-01, LEAD-02, LEAD-03
**Success Criteria** (what must be TRUE):
  1. POST /leads with name, company name, and company URL returns a leadId immediately without waiting for pipeline completion
  2. GET /leads returns all leads with ICP score, status, and industry columns
  3. GET /leads/:id returns complete lead detail including all AI-generated outputs for a completed lead
  4. GET /leads/:id/stream delivers SSE events for each pipeline step and streams email tokens in sequence, confirmed via curl
  5. Disconnecting the curl client terminates the SSE Observable and does not leave orphaned Claude API streams running
**Plans**: TBD

Plans:
- [ ] 44-01: LeadsController (POST /leads, GET /leads, GET /leads/:id) with Prisma persistence and @Throttle guard
- [ ] 44-02: @Sse(':id/stream') endpoint with Observable/callback bridge, res.on('close') cleanup, timeout(30000) safety net

### Phase 45: Next.js Frontend
**Goal**: A recruiter can log in with the demo credentials shown on the login page, browse the lead list, submit a new lead, and watch the pipeline run in real time with full enrichment outputs visible on the lead detail page
**Depends on**: Phase 44
**Requirements**: AUTH-01, AUTH-02, AUTH-03, PIPE-02, PIPE-03, PIPE-05, PIPE-06, PIPE-07, PIPE-08
**Success Criteria** (what must be TRUE):
  1. User sees demo credentials (email + password) displayed on the login page, enters them, and lands on the CRM dashboard — session persists across browser refresh via HttpOnly cookie
  2. User submits a new lead via the lead input form and immediately sees step-by-step labeled progress indicators updating in real time as the pipeline runs
  3. The email personalization step streams text token-by-token into the preview area so the user watches the email being written live
  4. The lead detail page shows the ICP score as a horizontal colored bar with a numeric label, and a "Why this score?" card the user can expand to see matched and weak ICP criteria
  5. Enrichment is displayed in a structured card with intent signals as badges, and a copy button transfers the generated email to the clipboard
**Plans**: TBD

Plans:
- [ ] 45-01: Auth — login page with demo credentials box, JWT session, HttpOnly cookie, redirect on refresh
- [ ] 45-02: CRM dashboard (RSC lead list table with score column and status) and lead input form with client validation
- [ ] 45-03: Lead detail page — PipelineMonitor EventSource client, step progress indicators, streaming email preview
- [ ] 45-04: Score bar, "Why this score?" collapsible card, enrichment card with intent signal badges, copy-to-clipboard button

### Phase 46: Demo Seed + Portfolio Integration
**Goal**: The deployed app has varied pre-seeded leads ready for recruiters, SSE streaming works through Coolify Nginx, and the portfolio presents AI SDR as a third project with case study and live demo link
**Depends on**: Phase 45
**Requirements**: DEMO-01, DEMO-02, PORT-01, PORT-02, PORT-03
**Success Criteria** (what must be TRUE):
  1. The deployed app shows 6-8 pre-seeded leads with ICP scores spanning 20-95 across distinct industries — visible immediately after login without any new lead submission
  2. Each seeded lead's personalized email references company-specific facts (not generic phrasing) and the enrichment card shows realistic intent signals distinct to that lead
  3. Submitting a new lead in the deployed app delivers streaming email tokens in real time (SSE is not buffered by Coolify Nginx — X-Accel-Buffering: no header confirmed working)
  4. The portfolio home page displays AI SDR as a third project card with a link to the live deployed demo
  5. Visiting /projects/ai-sdr on the portfolio renders a complete case study with tech stack badges, architecture decisions, and screenshots
**Plans**: TBD

Plans:
- [ ] 46-01: Seed script — 6-8 fictional leads with faker.seed(42), sequential upserts, verified score spectrum (20-95), idempotency test
- [ ] 46-02: Coolify deployment — Docker images for ai-sdr-api and ai-sdr-web, X-Accel-Buffering: no header, SSE streaming verified end-to-end in production
- [ ] 46-03: Portfolio integration — AI SDR project card on fernandomillan.me home page, /projects/ai-sdr case study page, PORT-03 live demo link

## Progress

**Execution Order:** 41 → 42 → 43 → 44 → 45 → 46

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 41. Project Foundation | v5.0 | 0/2 | Not started | - |
| 42. Claude API Integration | v5.0 | 0/2 | Not started | - |
| 43. Enrichment Pipeline | v5.0 | 0/3 | Not started | - |
| 44. NestJS REST + SSE Endpoints | v5.0 | 0/2 | Not started | - |
| 45. Next.js Frontend | v5.0 | 0/4 | Not started | - |
| 46. Demo Seed + Portfolio Integration | v5.0 | 0/3 | Not started | - |
