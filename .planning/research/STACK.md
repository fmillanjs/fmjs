# Stack Research

**Domain:** AI SDR Replacement System — Claude API integration, web scraping, background job queues, structured outputs
**Researched:** 2026-02-28
**Confidence:** HIGH

---

## Context: What Is Already Decided

The following are NOT re-researched. They are locked decisions from PROJECT.md:

- **Frontend:** Next.js 15 (App Router, `'use client'` where needed)
- **Backend:** NestJS 11 (standalone repo, separate from Turborepo monorepo)
- **ORM:** Prisma (same pattern as TeamFlow + DevCollab)
- **Database:** Postgres
- **AI Model:** `claude-sonnet-4-6` via Anthropic Claude API
- **Auth:** NextAuth v5 + NestJS JWT strategy (same pattern as TeamFlow)
- **Deployment:** Docker + Coolify (same CI/CD pattern)
- **No Redis** in the base stack — see Background Jobs section below

This research covers only the **new capabilities** required: Claude API integration, web scraping, job queuing, structured outputs, and cost management.

---

## Recommended Stack

### Core New Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@anthropic-ai/sdk` | `^0.78.0` | Claude API client — streaming, tool use, structured outputs | Official SDK from Anthropic. Latest stable is 0.78.0 (released 2026-02-19). Provides `client.messages.stream()` for streaming, `output_config.format` for structured JSON, `strict: true` tool definitions, and built-in retry/backoff logic. No need for raw fetch. |
| `cheerio` | `^1.2.0` | HTML parsing for company URL scraping | Version 1.0+ is now stable (after 7 years of RC). jQuery-style selectors for server-side HTML. Fast and lightweight (~38KB). Works without a browser engine — correct for scraping static company "About" pages, meta tags, og:description, og:title. |
| `axios` | `^1.7.x` | HTTP fetch layer for cheerio scraping | Fetches raw HTML from company URLs for cheerio to parse. Already a common dependency in NestJS projects. TypeScript-native. Handles redirects, timeouts, and custom User-Agent headers out of the box. |
| `@nestjs/bullmq` | `^11.0.4` | NestJS module for BullMQ — background job queue | Official NestJS integration. Matches the NestJS module pattern (imports, decorators, `@Processor`). Ships with `BullModule`, `InjectQueue`, and `@Processor` decorator. Matches NestJS 11 module lifecycle. |
| `bullmq` | `^5.70.1` | Redis-backed job queue engine | Peer dependency of `@nestjs/bullmq`. Provides `Queue`, `Worker`, `QueueEvents`, and built-in rate limiting at the queue level (`limiter: { max, duration }`). TypeScript-first rewrite of deprecated Bull. Active — 5.70.1 released 2026-02-23. |
| `zod` | `^3.24.x` | TypeScript-first schema validation for Claude responses | Used to define the JSON schema sent to Claude's `output_config.format`, and to validate + parse the returned structured JSON. `z.object()` schemas generate JSON Schema via `zodToJsonSchema()`. v4 is in beta — use v3 for stability. |
| `zod-to-json-schema` | `^3.23.x` | Converts Zod schemas to JSON Schema format | Required to pass Zod-defined schemas to Claude's `output_config.format.schema` field, which expects raw JSON Schema. Note: Zod v4 will make this unnecessary — but v4 is not yet stable. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ioredis` | `^5.4.x` | Redis client for BullMQ | BullMQ requires Redis. Install ioredis as the Redis adapter. Required if you use BullMQ — no way around it. |
| `@nestjs/throttler` | `^6.x` | HTTP-level rate limiting for NestJS endpoints | Limits how many enrichment/email generation requests one user can trigger per minute. Sits in front of the queue — prevents queue flooding from the UI. |
| `p-limit` | `^6.x` | In-process concurrency limiter | Alternative to full BullMQ for simple sequential Claude calls. Use when you do NOT want to add Redis as a service dependency (see Alternatives section). |
| `@types/cheerio` | Not needed in v1+ | TypeScript types for cheerio | Cheerio 1.0+ ships its own TypeScript types. Do NOT install `@types/cheerio` — it was for v0.x and causes type conflicts with v1+. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Redis (Docker) | Required by BullMQ | Add to `docker-compose.yml` alongside Postgres. Use official `redis:7-alpine` image. Port 6379. If you already have Redis from TeamFlow (for Socket.io adapter), reuse the same Redis service. |
| `@bull-board/api` + `@bull-board/nestjs` | Queue monitoring UI | Optional but useful for debugging AI pipeline jobs in development. Provides a dashboard showing job status, retries, failures. Add in dev only — do not expose in production without auth. |

---

## Critical Architecture Decision: BullMQ vs p-limit

This is the most important stack decision for the AI SDR backend.

### Option A: BullMQ + Redis (Recommended for Portfolio Impressiveness)

**Add to stack:** `bullmq`, `@nestjs/bullmq`, `ioredis`, Redis Docker service

**Why:** Demonstrates production-grade background job architecture. Jobs survive server restarts. Queue is observable (Bull Board). Rate limiting at the queue level protects Claude API rate limits automatically. Recruiter-visible: the architecture diagram shows a proper pipeline. Concretely: enriching 10 leads simultaneously without Redis means a NestJS crash loses all in-progress enrichments.

**Trade-off:** Adds Redis as a service dependency. More Docker configuration. More code.

**Use when:** This is a standalone repo with its own docker-compose. Adding Redis is a one-line `docker-compose.yml` change. The complexity cost is low and the architectural statement is high.

### Option B: p-limit (Simpler, No Redis)

**Add to stack:** `p-limit` only

**Why:** p-limit provides in-process concurrency control with zero infrastructure. `pLimit(3)` limits to 3 concurrent Claude calls. Sufficient for a demo with 10-20 pre-seeded leads.

**Trade-off:** Jobs are lost on server restart. No retry logic built-in. No observable queue. Less architecturally impressive.

**Use when:** You want to ship faster and the demo's pre-seeded leads make job persistence irrelevant.

**RECOMMENDATION: Use BullMQ.** The AI SDR project's purpose is to demonstrate production engineering skills. A Redis-backed job queue is a concrete signal of that. The overhead is one extra Docker service and ~150 lines of NestJS boilerplate that follows the exact same module pattern already in the project.

---

## Claude API Integration Patterns

### Streaming (NestJS SSE)

NestJS has built-in SSE support via the `@Sse()` decorator. Use it to stream Claude email generation responses to the Next.js frontend.

```typescript
// nestjs: ai-sdr-api/src/emails/emails.controller.ts
import { Controller, Post, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';

@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  // Step 1: POST stores job data, returns a streamId
  @Post('generate')
  async startGeneration(@Body() dto: GenerateEmailDto) {
    const streamId = await this.emailsService.prepareStream(dto);
    return { streamId };
  }

  // Step 2: GET /emails/stream/:id opens SSE connection
  @Sse('stream/:streamId')
  streamEmail(@Param('streamId') streamId: string): Observable<MessageEvent> {
    return this.emailsService.streamEmail(streamId);
  }
}
```

**Why POST then GET:** Claude streaming requires request body data. SSE uses GET requests. POST stores the parameters temporarily (in-memory Map or Redis), GET opens the stream using the stored ID. This is the confirmed pattern for NestJS + Claude streaming.

### Structured Output (Lead Enrichment)

Use `output_config.format` with `type: "json_schema"` for non-streaming AI calls that need guaranteed JSON (lead scoring, CRM enrichment). This is generally available — no beta header required as of SDK 0.78.0.

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const LeadEnrichmentSchema = z.object({
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string(),
  techStack: z.array(z.string()),
  painPoints: z.array(z.string()),
  icpScore: z.number().min(0).max(100),
  icpReasoning: z.string(),
});

type LeadEnrichment = z.infer<typeof LeadEnrichmentSchema>;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: enrichmentPrompt }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: zodToJsonSchema(LeadEnrichmentSchema) as Record<string, unknown>,
    },
  },
});

// Response is guaranteed valid JSON — no try/catch on JSON.parse needed
const enrichment = LeadEnrichmentSchema.parse(
  JSON.parse(response.content[0].text)
);
```

**Key facts from official docs (verified 2026-02-28):**
- `output_config.format` is the current API shape — the old `output_format` top-level param and `structured-outputs-2025-11-13` beta header both still work but are deprecated.
- Structured outputs are generally available on claude-sonnet-4-6 (no beta header needed).
- Prompts using structured outputs are processed with Zero Data Retention (ZDR) — good for lead data privacy.
- `additionalProperties: false` should be set in the schema to prevent extra fields.

### Tool Use (Alternative to Structured Output)

Use `tools` + `tool_choice: { type: "tool", name: "..." }` when you want Claude to reason before returning structured data. More powerful than `output_config.format` for complex reasoning tasks like ICP scoring where the thought process matters.

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  tools: [{
    name: 'score_lead',
    description: 'Score a lead against our ICP criteria',
    input_schema: {
      type: 'object',
      properties: {
        icpScore: { type: 'number', description: 'ICP fit score 0-100' },
        icpReasoning: { type: 'string' },
        intentSignals: { type: 'array', items: { type: 'string' } },
      },
      required: ['icpScore', 'icpReasoning', 'intentSignals'],
      additionalProperties: false,
    },
    strict: true,  // Guarantees schema compliance on tool inputs
  }],
  tool_choice: { type: 'tool', name: 'score_lead' },
  messages: [{ role: 'user', content: leadScoringPrompt }],
});

const toolUse = response.content.find(b => b.type === 'tool_use');
const scored = toolUse.input; // Typed as the schema shape
```

**When to use tool use vs structured output:**
- `output_config.format` = use for extraction tasks (pull data out of text, format CRM fields)
- `tools` + `tool_choice` = use for reasoning tasks (ICP scoring, intent analysis) where Claude's chain-of-thought before calling the tool produces better results

---

## Web Scraping Pattern

Company URL scraping uses axios (HTTP) + cheerio (HTML parsing). No browser engine needed — company websites' public "About" and homepage HTML contains the metadata we need.

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedCompanyData {
  title: string;
  description: string;
  ogDescription: string;
  keywords: string;
}

async function scrapeCompanyUrl(url: string): Promise<ScrapedCompanyData> {
  const { data: html } = await axios.get(url, {
    timeout: 10_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-SDR-Enrichment/1.0)',
    },
  });

  const $ = cheerio.load(html);

  return {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') ?? '',
    ogDescription: $('meta[property="og:description"]').attr('content') ?? '',
    keywords: $('meta[name="keywords"]').attr('content') ?? '',
  };
}
```

**Limitations of this approach (be explicit in case study):**
- JavaScript-rendered pages (SPAs) will return empty HTML — cheerio cannot execute JS
- Some sites block headless requests (rate limiting, bot detection, Cloudflare)
- Solution for production: fall back gracefully — if scraping fails, Claude still enriches from the manually entered company name/domain

**Why not Playwright for scraping:**
- Playwright is already in the monorepo for screenshot testing, not available in the standalone AI SDR repo
- A full browser engine adds ~150MB to Docker image just to scrape meta tags
- cheerio handles 80%+ of company sites (static HTML meta tags)

**Why not Firecrawl:**
- External paid API dependency for a portfolio demo — not worth it
- Adds external API key management overhead
- cheerio + axios achieves the same goal for meta-tag enrichment

---

## Rate Limiting Strategy

### Claude API Rate Limits (Tier 1 — expected for a new API key)

| Model | RPM | ITPM | OTPM |
|-------|-----|------|------|
| claude-sonnet-4-6 | 50 | 30,000 | 8,000 |

**Tier 1 is very constrained.** 50 RPM = ~1 request/second. For a demo with 10 pre-seeded leads running 3 AI operations each (enrichment + email + follow-up sequence), that is 30 total calls. At 1/sec they complete in 30 seconds — acceptable.

**BullMQ queue-level rate limiting:**

```typescript
// Rate limit the AI queue to 40 jobs/minute (below Claude's 50 RPM limit)
BullModule.registerQueue({
  name: 'ai-enrichment',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
  limiter: {
    max: 40,        // max 40 jobs per duration
    duration: 60000, // per 60 seconds
  },
}),
```

**Handle 429 errors from Claude API:**

```typescript
// In the BullMQ processor
@Processor('ai-enrichment')
export class EnrichmentProcessor {
  @Process('enrich-lead')
  async process(job: Job<EnrichLeadJobData>) {
    try {
      return await this.claudeService.enrichLead(job.data);
    } catch (error) {
      if (error?.status === 429) {
        // Re-throw so BullMQ triggers exponential backoff retry
        throw error;
      }
      // Log non-retryable errors (bad prompt, etc.)
      throw error;
    }
  }
}
```

**Prompt caching to reduce ITPM consumption:**

For operations that reuse the same system prompt (ICP scoring, email generation), use Anthropic's prompt caching. Cache-read tokens do NOT count toward ITPM rate limits at Tier 1. Mark the system prompt with `cache_control: { type: 'ephemeral' }`:

```typescript
messages: [
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: LONG_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: leadSpecificData,
      },
    ],
  },
],
```

---

## Installation

### Backend (ai-sdr-api — NestJS 11)

```bash
# Claude API
npm install @anthropic-ai/sdk

# Web scraping
npm install axios cheerio
# Do NOT install @types/cheerio — cheerio 1.0+ ships its own types

# Structured output schema validation
npm install zod zod-to-json-schema

# Background jobs (choose one path — see architecture decision above)
# Path A: BullMQ (recommended)
npm install @nestjs/bullmq bullmq ioredis

# Rate limiting for HTTP endpoints
npm install @nestjs/throttler
```

### Frontend (ai-sdr-web — Next.js 15)

```bash
# No new packages required for Claude integration
# SSE streaming is consumed via native browser EventSource API
# or fetch with ReadableStream — no package needed

# Zod (for form validation, if not already installed)
npm install zod
```

### Docker Compose Addition

```yaml
# docker-compose.yml — add Redis service if using BullMQ
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@anthropic-ai/sdk` direct | `@ai-sdk/anthropic` (Vercel AI SDK) | Use Vercel AI SDK if Next.js API routes are the AI layer (not NestJS). Since AI calls go through NestJS, use the official Anthropic SDK directly — it has no Vercel-specific abstractions to fight. |
| `bullmq` + `@nestjs/bullmq` | `p-limit` in-process concurrency | Use p-limit if you want to avoid Redis entirely. Sufficient for a demo with pre-seeded data. Lower impressiveness for portfolio showcase. |
| `cheerio` + `axios` | `playwright` headless browser scraping | Use Playwright scraping only if you need to scrape JS-rendered SPAs. Adds ~150MB to Docker image. Not worth it for meta-tag extraction. |
| `zod` + `zod-to-json-schema` | Raw JSON Schema objects | Use raw JSON Schema if you want zero dependencies. Zod adds TypeScript type inference (`z.infer<>`) which pays dividends when mapping Claude output to Prisma writes. |
| `output_config.format` (structured outputs) | Prompt engineering for JSON + regex | Never rely on prompt engineering alone for structured data. Claude's constrained decoding via `output_config.format` guarantees valid JSON — prompt-only approaches fail ~5-15% of the time. |
| Redis 7 Alpine | Redis 6 | Redis 7 is the current stable. BullMQ 5.x requires Redis >= 6.2. Alpine variant keeps Docker image small. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@ai-sdk/anthropic` (Vercel AI SDK) | Built for Next.js API routes and edge runtime. This project uses NestJS as the API layer. The Vercel SDK abstractions (useChat, streamText) are Next.js-centric and do not map to NestJS controllers cleanly. | `@anthropic-ai/sdk` directly in NestJS services |
| `@nestjs/bull` (old Bull module) | Bull (not BullMQ) is in maintenance-only mode. Maintainers only fix critical bugs. BullMQ is the TypeScript-native successor with active development. | `@nestjs/bullmq` + `bullmq` |
| `node-fetch` or raw `fetch` for Claude API | The `@anthropic-ai/sdk` already wraps fetch with proper retry logic, streaming support, type-safe responses, and SDK-level error handling. Rolling your own HTTP calls loses all of that. | `@anthropic-ai/sdk` client |
| `puppeteer` for company URL scraping | Adds a full Chromium binary (~150-300MB) to the Docker image just to read meta tags. Overkill. Most company marketing sites serve static HTML with meta tags. | `axios` + `cheerio` |
| `@types/cheerio` | This was for cheerio v0.x. Cheerio 1.0+ ships its own TypeScript declarations. Installing `@types/cheerio` creates type conflicts. | Nothing — cheerio 1.x types are included. |
| Hardcoded `max_tokens` above 4096 for streaming | Large `max_tokens` values with streaming can hit OTPM rate limits quickly at Tier 1. For email generation, 1500 tokens is sufficient. For ICP scoring, 1024 is enough. | Keep `max_tokens` conservative: 1024 for structured outputs, 1500 for emails. |
| `structured-outputs-2025-11-13` beta header | Deprecated. The structured outputs feature is generally available. The old beta header still works during a transition period but will be removed. | Use `output_config: { format: { type: 'json_schema', ... } }` — no header needed. |
| Purple in any design element | User requirement — all milestones | Use Matrix green (`#00FF41`) and neutral grays only |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@anthropic-ai/sdk@0.78.0` | Node.js >= 18, TypeScript >= 4.9, NestJS 11 | ESM + CJS dual build. Import as `import Anthropic from '@anthropic-ai/sdk'`. Works in NestJS modules without any special config. |
| `cheerio@1.2.0` | Node.js >= 18.17 | Minimum Node 18.17 required. NestJS 11 runs on Node 18+ so no conflict. Do NOT install `@types/cheerio`. |
| `bullmq@5.70.1` | Redis >= 6.2, Node.js >= 16 | Requires Redis. Works with ioredis as the Redis client. `@nestjs/bullmq@11.0.4` is the tested integration layer. |
| `@nestjs/bullmq@11.0.4` | NestJS >= 10, bullmq ^5.x | Works with NestJS 11. Version 11.x of the package tracks NestJS major versions — 11.0.4 is the correct version for NestJS 11. |
| `zod@3.24.x` | TypeScript >= 4.5 | Use Zod v3 (stable). Zod v4 is in beta and changes the `zod-to-json-schema` integration. Wait for v4 stable before migrating. |
| `zod-to-json-schema@3.23.x` | `zod@3.x` | Converts Zod schemas to JSON Schema objects for Claude's `output_config.format.schema`. Will be deprecated when Zod v4 stabilizes (built-in JSON Schema generation in v4). |

---

## Sources

- GitHub: anthropics/anthropic-sdk-typescript releases — Latest version 0.78.0 confirmed 2026-02-19. Streaming and tool use patterns — HIGH confidence
- Anthropic Official Docs: `platform.claude.com/docs/en/docs/build-with-claude/structured-outputs` — `output_config.format` shape, generally available status for claude-sonnet-4-6, ZDR note — HIGH confidence
- Anthropic Official Docs: `platform.claude.com/docs/en/api/rate-limits` — Tier 1 limits: 50 RPM, 30K ITPM, 8K OTPM for claude-sonnet-4-6. Cache-aware ITPM (cached tokens don't count) — HIGH confidence
- npm: `bullmq` — Latest 5.70.1 (2026-02-23), `@nestjs/bullmq` — Latest 11.0.4 — HIGH confidence
- npm: `cheerio` — Latest 1.2.0, Node >= 18.17 required, own TypeScript types — HIGH confidence
- BullMQ Docs: `docs.bullmq.io/guide/nestjs` — NestJS integration pattern, `@Processor` decorator, `limiter` config — HIGH confidence
- NestJS Docs: `docs.nestjs.com/techniques/server-sent-events` — `@Sse()` decorator pattern for streaming — HIGH confidence
- Zod: `zod.dev` — v3 stable, v4 beta, built-in JSON Schema in v4 — HIGH confidence
- WebSearch: Cheerio 1.0 release notes — "batteries included", Node 18.17 minimum, own types — HIGH confidence

---
*Stack research for: v5.0 AI SDR Replacement System — Claude API integration, web scraping, job queues, structured outputs*
*Researched: 2026-02-28*
