# Architecture Research

**Domain:** AI SDR Replacement System — NestJS 11 backend + Claude API pipeline + Next.js 15 streaming frontend
**Researched:** 2026-02-28
**Confidence:** HIGH (Claude API patterns verified against official Anthropic docs; NestJS SSE verified against nestjs.com; structured outputs confirmed GA on Claude Opus 4.6/Sonnet 4.6)

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Next.js 15 Frontend                           │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Lead Input    │  │  Pipeline Status  │  │  Email Preview       │  │
│  │  Form (RSC)    │  │  (Client, SSE)    │  │  (Client, stream)    │  │
│  └───────┬────────┘  └──────────┬───────┘  └────────────┬─────────┘  │
│          │ POST /leads          │ GET /leads/:id/status  │ GET /leads/:id/email/stream  │
├──────────┼──────────────────────┼────────────────────────┼────────────┤
│                         NestJS 11 API                                 │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      LeadsController                            │   │
│  │   POST /leads    GET /leads     GET /leads/:id/email/stream    │   │
│  └───────────────────────┬────────────────────────────────────────┘   │
│                          │                                             │
│  ┌───────────────────────▼────────────────────────────────────────┐   │
│  │                   PipelineService (orchestrator)                │   │
│  │  qualify() -> enrich() -> personalize() -> generateSequence()  │   │
│  └──┬───────────────┬──────────────────┬────────────────┬─────────┘   │
│     │               │                  │                │              │
│  ┌──▼────┐    ┌─────▼──────┐   ┌───────▼──────┐  ┌────▼──────────┐   │
│  │Qualify│    │Enrich      │   │Personalize   │  │Sequence       │   │
│  │Service│    │Service     │   │Service       │  │Service        │   │
│  │(Claude│    │(Claude +   │   │(Claude       │  │(Claude        │   │
│  │ tool) │    │ scraper)   │   │ stream)      │  │ tool)         │   │
│  └──┬────┘    └─────┬──────┘   └───────┬──────┘  └────┬──────────┘   │
│     │               │                  │                │              │
│  ┌──▼───────────────▼──────────────────▼────────────────▼──────────┐  │
│  │                     ClaudeService (wrapper)                      │  │
│  │            @anthropic-ai/sdk  |  structured outputs  |  stream  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                          Postgres (Prisma ORM)                          │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │ Lead        │  │ AIOutput         │  │ EmailSequence             │  │
│  └─────────────┘  └──────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Decision: Synchronous Pipeline (Chosen) vs Background Jobs vs Pure Streaming

### The Three Approaches Evaluated

**Option A: Synchronous await-all pipeline**
- Run all Claude calls sequentially: qualify → enrich → personalize → sequence
- Return the entire result when all steps are done
- UI shows a spinner until all 4 steps complete (8–25 seconds)

**Option B: Background job queue (BullMQ + Redis)**
- POST /leads returns 202 Accepted immediately
- BullMQ workers process steps asynchronously
- UI polls GET /leads/:id until status = complete
- Requires Redis as a separate infrastructure dependency

**Option C: Hybrid — synchronous pipeline + step-level SSE progress + final email stream**
This is the recommended approach.

### Recommendation: Option C — Hybrid Synchronous + SSE Progress + Email Stream

**Rationale:**

The pipeline consists of 4 sequential steps where each step's output is the next step's input. They cannot be parallelized. Background jobs (BullMQ) would add Redis infrastructure, job state serialization, polling endpoints, and significant complexity — none of which demonstrates AI integration skills. The recruiter-visible outcome is the same: "it processed the lead."

Streaming the email generation step is distinct from background jobs. Email generation is the most compelling recruiter-visible feature (watching Claude write personalized cold email in real time). Streaming this one step gives a dramatic UX moment without full async architecture complexity.

The 3 structured steps (qualify, enrich, sequence) run synchronously and fast enough that a step-progress indicator via SSE makes the wait feel interactive. At portfolio scale with one demo user, there is no concurrency concern.

**Decision Table:**

| Concern | Sync-only | Background jobs | Hybrid (chosen) |
|---------|-----------|-----------------|-----------------|
| Infrastructure | Postgres only | Postgres + Redis | Postgres only |
| UX during wait | Spinner (bad) | Poll status (meh) | Step progress + stream (compelling) |
| Demo impressiveness | LOW | MEDIUM | HIGH |
| Implementation complexity | LOW | HIGH | MEDIUM |
| Correct for portfolio? | No | No | Yes |

---

## Pipeline Architecture (Detailed)

### Step-by-step execution flow

```
POST /leads { name, email, company, url }
          |
          v
    PipelineService.process(leadId)
          |
    [Step 1: Qualify]
    ClaudeService.structuredOutput({
      prompt: ICP scoring prompt,
      schema: QualificationSchema  // score 0-100, fit_reason, intent_signals[]
    })
    → save to AIOutput (step='qualify', result=JSON)
    → emit SSE event: { step: 'qualify', status: 'complete', score: 73 }
          |
    [Step 2: Enrich]
    ScraperService.scrapeCompanyUrl(lead.url)  // cheerio fetch + parse
    ClaudeService.structuredOutput({
      prompt: enrichment prompt + scraped HTML summary,
      schema: EnrichmentSchema  // company_size, industry, tech_stack[], pain_points[]
    })
    → save to AIOutput (step='enrich', result=JSON)
    → emit SSE event: { step: 'enrich', status: 'complete' }
          |
    [Step 3: Generate email — STREAMING]
    ClaudeService.stream({
      prompt: personalization prompt using qualify + enrich data
    })
    → save streamed text to AIOutput (step='personalize', result=text)
    → stream tokens to frontend via NestJS @Sse() endpoint
    → emit SSE token events as text arrives
          |
    [Step 4: Generate sequence — structured]
    ClaudeService.structuredOutput({
      prompt: sequence prompt using email + lead context,
      schema: SequenceSchema  // emails[]: { subject, body, send_delay_days }[]
    })
    → save to AIOutput (step='sequence', result=JSON)
    → emit SSE event: { step: 'sequence', status: 'complete' }
          |
    → Update Lead.status = 'complete'
    → Final SSE event: { step: 'done', leadId }
```

### Why Email Streaming, Not All Steps

Steps 1, 2, 4 produce structured JSON (scores, arrays, objects). JSON is not meaningful to render incrementally — you cannot display a half-parsed JSON object. Streaming these steps would add NestJS SSE pipe complexity with zero UX benefit.

Step 3 (email generation) produces prose. Prose is exactly what streaming is designed to show — recruiter sees Claude writing the cold email word by word. This is the demo's most impressive moment.

---

## Claude API Integration Patterns

### Pattern 1: Structured Output (Steps 1, 2, 4)

Use `output_config.format` with a JSON schema. As of 2025-11, structured outputs are GA on Claude Opus 4.6 and Sonnet 4.6. No beta headers required.

```typescript
// src/claude/claude.service.ts
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeService {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async structuredOutput<T>(prompt: string, schema: object): Promise<T> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      output_config: {
        format: {
          type: 'json',
          schema,
        },
      },
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as T;
  }
}
```

**Why structured outputs over tool use for schema enforcement:**
- Structured outputs with `output_config.format` are purpose-built for "give me JSON that matches this schema" — exactly what qualification scoring and enrichment need.
- Tool use is for "call a function with these parameters" — appropriate when Claude needs to invoke your application logic during generation.
- For lead qualification and CRM enrichment, we want the final response to be structured JSON. Structured outputs is the right primitive.
- Tool use would be appropriate IF we were letting Claude decide to call a "search_company" function mid-generation (agentic behavior). That is out of scope for this portfolio project.

**Confidence:** HIGH — verified against [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), GA on Claude Sonnet 4.6 and Opus 4.6 as of 2025-11.

### Pattern 2: Streaming Text (Step 3 — Email Generation)

The TypeScript SDK provides `.stream()` which returns an `AsyncIterable` of events. The NestJS SSE endpoint wraps this in an RxJS `Observable`.

```typescript
// src/claude/claude.service.ts (addition)
async *streamText(prompt: string): AsyncGenerator<string> {
  const stream = this.client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
```

**Confidence:** HIGH — verified against [Anthropic streaming docs](https://platform.claude.com/docs/en/build-with-claude/streaming), TypeScript SDK `.stream()` confirmed.

---

## NestJS SSE Implementation

NestJS has first-class SSE support via the `@Sse()` decorator. The endpoint must return an `Observable<MessageEvent>` from RxJS.

### SSE endpoint for pipeline progress + email streaming

```typescript
// src/leads/leads.controller.ts
import { Controller, Sse, Param, MessageEvent } from '@nestjs/common';
import { Observable, from, mergeMap } from 'rxjs';
import { PipelineService } from './pipeline.service';

@Controller('leads')
export class LeadsController {

  constructor(private readonly pipelineService: PipelineService) {}

  // POST /leads — triggers synchronous pipeline, returns leadId immediately
  @Post()
  async createLead(@Body() dto: CreateLeadDto) {
    const lead = await this.leadsService.create(dto);
    // Do not await — fire pipeline in background within same process
    this.pipelineService.process(lead.id).catch(console.error);
    return { leadId: lead.id };
  }

  // GET /leads/:id/stream — SSE endpoint for pipeline progress + email tokens
  @Sse(':id/stream')
  streamLeadPipeline(@Param('id') id: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      this.pipelineService
        .processWithStream(id, (event) => {
          subscriber.next({ data: event } as MessageEvent);
        })
        .then(() => subscriber.complete())
        .catch((err) => subscriber.error(err));
    });
  }
}
```

**Important:** The `@Sse()` endpoint must return `Observable<MessageEvent>`. NestJS internally calls `.subscribe()` and sends each emission as an SSE frame. The `MessageEvent` type is from `@nestjs/common`.

**SSE response headers NestJS sets automatically:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Source:** [NestJS official docs — Server-Sent Events](https://docs.nestjs.com/techniques/server-sent-events). HIGH confidence.

---

## Next.js 15 Client-Side SSE Consumption

EventSource is the native browser API for consuming SSE. It works directly against the NestJS `@Sse()` endpoint URL.

```typescript
// apps/ai-sdr-web/src/components/pipeline-monitor.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface PipelineEvent {
  step: 'qualify' | 'enrich' | 'personalize' | 'sequence' | 'done';
  status?: 'complete' | 'error';
  token?: string;  // email tokens arrive here during step 3
  data?: unknown;
}

export function PipelineMonitor({ leadId }: { leadId: string }) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [emailText, setEmailText] = useState('');

  useEffect(() => {
    const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/stream`);

    es.onmessage = (e) => {
      const event: PipelineEvent = JSON.parse(e.data);

      if (event.token) {
        // Token from email streaming — append to email text
        setEmailText((prev) => prev + event.token);
      } else {
        setEvents((prev) => [...prev, event]);
      }

      if (event.step === 'done') {
        es.close();
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [leadId]);

  return (
    <div>
      {/* Step progress indicators */}
      {events.map((e, i) => <StepIndicator key={i} event={e} />)}
      {/* Live streaming email preview */}
      {emailText && <EmailPreview text={emailText} />}
    </div>
  );
}
```

**EventSource vs fetch with ReadableStream:**
EventSource is simpler for this use case. It handles reconnection automatically, supports named event types, and is universally supported. Use fetch + ReadableStream only if you need POST requests (EventSource is GET-only). Since our SSE endpoint is GET and the lead ID is in the URL, EventSource is the right choice.

**Confidence:** HIGH — EventSource is a browser standard, well-documented pattern.

---

## Web Scraping for Company URL Enrichment

Use Axios (already common in NestJS) + Cheerio for HTML parsing. This is the right tool because company landing pages are mostly static HTML — no JavaScript rendering required for the text content Claude needs.

```typescript
// src/scraper/scraper.service.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async extractCompanySummary(url: string): Promise<string> {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SDR-Bot/1.0)' },
      });

      const $ = cheerio.load(html);
      // Remove script, style, nav, footer noise
      $('script, style, nav, footer, header').remove();

      // Extract meaningful text: headings + paragraphs only
      const text = $('h1, h2, h3, p').map((_, el) => $(el).text().trim()).get().join('\n');

      // Truncate to avoid blowing Claude's context budget
      return text.slice(0, 3000);
    } catch {
      return '';  // Graceful fallback — enrichment continues without scraped data
    }
  }
}
```

**Puppeteer is NOT needed** for this use case. Company websites are static-HTML for their marketing pages. Puppeteer adds 300MB+ to the Docker image and requires a chromium dependency. Avoid.

**Confidence:** MEDIUM — cheerio + axios pattern is well established. Some company sites may block scraping or require JS rendering. Graceful fallback is essential.

---

## Database Schema

```prisma
// schema.prisma for AI SDR app

generator client {
  provider = "prisma-client-js"
  output   = ".prisma/ai-sdr-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Lead {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Input fields
  name        String
  email       String
  company     String
  url         String?

  // Pipeline status
  status      LeadStatus @default(pending)

  // CRM fields (denormalized from AIOutput for easy display)
  score       Int?           // 0-100, from qualify step
  industry    String?
  companySize String?

  // Relations
  aiOutputs   AIOutput[]
  sequence    EmailSequence?

  @@map("leads")
}

enum LeadStatus {
  pending
  processing
  complete
  error
}

model AIOutput {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  step      PipelineStep
  result    Json         // Structured JSON for qualify/enrich/sequence; text string for personalize
  model     String       // claude-sonnet-4-6 — for auditability
  tokens    Int?         // input + output tokens, from usage field

  @@unique([leadId, step])
  @@map("ai_outputs")
}

enum PipelineStep {
  qualify
  enrich
  personalize
  sequence
}

model EmailSequence {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  leadId    String   @unique
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  // Denormalized from sequence AIOutput for fast reads
  email1Subject String
  email1Body    String
  email1DelayDays Int @default(0)

  email2Subject String
  email2Body    String
  email2DelayDays Int @default(3)

  email3Subject String
  email3Body    String
  email3DelayDays Int @default(7)

  @@map("email_sequences")
}

model DemoLead {
  // Pre-seeded leads for recruiter demo
  // Separate model so seeds don't pollute the real Lead table
  // Copy to Lead on demo account login
  id      String @id @default(uuid())
  payload Json   // Complete lead snapshot including all AI outputs

  @@map("demo_leads")
}
```

### Schema Rationale

**AIOutput.result is Json, not separate columns:** Each pipeline step returns a different shape (qualification score JSON, enrichment JSON, prose text). A single `Json` column handles all cases without migrations per new field. The `step` field is a typed enum for querying.

**EmailSequence denormalization:** Storing the 3 emails in their own table (rather than inside AIOutput) makes the CRM dashboard fast — one query to `EmailSequence` instead of parsing the sequence JSON from AIOutput every time the list loads.

**DemoLead separate model:** Pre-seeded demo content lives separately from real leads. The demo seeder populates `DemoLead`; the demo login trigger copies them to `Lead`. This prevents idempotency issues (re-seeding doesn't duplicate real leads).

**No multi-tenancy:** Single demo account, no userId foreign keys needed. If expanding later, add `userId` to `Lead`.

---

## Project Structure

```
ai-sdr-api/                    # NestJS 11 standalone repo
├── src/
│   ├── leads/
│   │   ├── leads.controller.ts        # REST endpoints + SSE endpoint
│   │   ├── leads.service.ts           # CRUD operations, Lead entity
│   │   ├── pipeline.service.ts        # Orchestrates qualify→enrich→personalize→sequence
│   │   ├── dto/
│   │   │   ├── create-lead.dto.ts
│   │   │   └── lead-response.dto.ts
│   │   └── leads.module.ts
│   │
│   ├── claude/
│   │   ├── claude.service.ts          # Wrapper: structuredOutput(), streamText()
│   │   ├── schemas/
│   │   │   ├── qualification.schema.ts  # JSON Schema for qualify step
│   │   │   ├── enrichment.schema.ts     # JSON Schema for enrich step
│   │   │   └── sequence.schema.ts       # JSON Schema for sequence step
│   │   └── claude.module.ts
│   │
│   ├── scraper/
│   │   ├── scraper.service.ts         # Axios + cheerio company URL extractor
│   │   └── scraper.module.ts
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts          # PrismaClient singleton (ai-sdr-client)
│   │   └── prisma.module.ts           # Global module
│   │
│   ├── seed/
│   │   └── seed.ts                    # Demo leads seeder (faker.seed(42))
│   │
│   └── main.ts
│
├── prisma/
│   └── schema.prisma
│
└── docker-compose.yml             # Postgres + api

ai-sdr-web/                    # Next.js 15 standalone repo
├── src/
│   ├── app/
│   │   ├── page.tsx                   # CRM dashboard (RSC, list all leads)
│   │   ├── leads/
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # Lead input form
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Lead detail with pipeline monitor
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── pipeline-monitor.tsx       # 'use client' — SSE EventSource consumer
│   │   ├── email-preview.tsx          # 'use client' — streaming email display
│   │   ├── lead-card.tsx              # Lead list item
│   │   └── step-indicator.tsx         # qualify/enrich/personalize/sequence status UI
│   │
│   └── lib/
│       └── api.ts                     # fetch() wrapper for NestJS API calls
```

### Structure Rationale

- **`claude/` module is isolated:** ClaudeService is a pure wrapper with no business logic. Swapping to a different model or provider requires only changing this module.
- **`pipeline.service.ts` is the orchestrator:** All step sequencing lives here, not scattered across controllers. The controller only starts the pipeline and opens the SSE stream.
- **JSON schemas in `schemas/` directory:** Keeping schemas as TypeScript objects (not inline) makes them testable in isolation. The schema objects are passed directly to `output_config.format.schema`.
- **Separate repos (not Turborepo):** Matches the project decision from PROJECT.md. Each app has its own Docker image, its own Prisma client output path (`.prisma/ai-sdr-client`).

---

## Data Flow

### Full Lead Processing Flow

```
User fills lead form
    |
    v
POST /leads { name, email, company, url }
    |
    v
NestJS creates Lead record (status=pending)
    |
Returns { leadId } immediately (< 100ms)
    |
    v                                       (parallel in same process)
pipelineService.process(leadId) [no await]
    |
Client opens EventSource to GET /leads/:id/stream
    |
    v
[Step 1: Qualify]
  ClaudeService.structuredOutput() with QualificationSchema
  Saves AIOutput { step: 'qualify', result: { score: 78, fit_reason: '...', intent_signals: [...] } }
  Updates Lead.score
  → SSE event: { step: 'qualify', status: 'complete', score: 78 }
    |
    v
[Step 2: Enrich]
  ScraperService.extractCompanySummary(lead.url)
  ClaudeService.structuredOutput() with EnrichmentSchema
  Saves AIOutput { step: 'enrich', result: { industry: 'SaaS', company_size: '50-200', tech_stack: [...] } }
  → SSE event: { step: 'enrich', status: 'complete' }
    |
    v
[Step 3: Personalize — STREAMING]
  ClaudeService.streamText() with personalization prompt
  Each text token → SSE event: { step: 'personalize', token: '...' }
  After stream complete → saves full text to AIOutput { step: 'personalize', result: fullText }
    |
    v
[Step 4: Sequence]
  ClaudeService.structuredOutput() with SequenceSchema
  Saves AIOutput + creates EmailSequence record (denormalized 3 emails)
  → SSE event: { step: 'sequence', status: 'complete' }
    |
    v
Updates Lead.status = 'complete'
→ SSE event: { step: 'done' }
EventSource closes
```

### CRM Dashboard Data Flow

```
User visits / (dashboard)
    |
    v
Next.js RSC fetch() → GET /leads
    |
    v
NestJS → Prisma query: Lead + EmailSequence (join)
    |
    v
RSC renders LeadCard components with score, industry, status
    |
    v
User clicks a lead → /leads/:id
    |
    v
Next.js RSC fetch() → GET /leads/:id with aiOutputs
    |
    v
Server renders lead detail with all AI outputs
```

---

## Architectural Patterns

### Pattern 1: Synchronous Pipeline with In-Process Fire-and-Forget

**What:** `POST /leads` creates the lead record and immediately starts the pipeline with `processWithStream().catch(console.error)` — no await, returns the leadId. The pipeline runs to completion in the same Node.js process.

**When to use:** When the pipeline steps are sequential (output of step N is input to step N+1), when there is no need for cross-process job distribution, and when portfolio-scale concurrency (1-5 simultaneous users) is the target.

**Trade-offs:** If the NestJS process crashes mid-pipeline, the job is lost (Lead stays in `processing` status permanently). For a portfolio demo, this is acceptable — add a cron job later if needed to reset stuck leads. The upside is zero infrastructure dependencies beyond Postgres.

**Example:**
```typescript
// In LeadsController
@Post()
async createLead(@Body() dto: CreateLeadDto) {
  const lead = await this.leadsService.create(dto);
  // No await — pipeline runs in background
  this.pipelineService.processWithStream(lead.id, /* emitter callback */).catch(err => {
    this.leadsService.updateStatus(lead.id, 'error');
    console.error('Pipeline failed', err);
  });
  return { leadId: lead.id };
}
```

### Pattern 2: Callback-Based SSE Emitter

**What:** The PipelineService receives an `emitter` callback function from the SSE Observable setup. As each step completes or emits a token, it calls `emitter({ step, token?, status? })`. The Observable wraps this pattern.

**When to use:** When you need to bridge an async sequential process with an RxJS Observable. This avoids needing to store an EventEmitter in a map keyed by leadId, which would require cleanup logic.

**Trade-offs:** The SSE connection must be established before the pipeline starts, or events will be missed. The design guarantees this by having the client open EventSource immediately after receiving leadId, before any pipeline progress events are emitted. A small sleep (100ms) at the start of processWithStream gives the client time to connect.

```typescript
// In PipelineService
async processWithStream(
  leadId: string,
  emitter: (event: PipelineEvent) => void
): Promise<void> {
  await sleep(100); // Give client time to connect EventSource

  // Step 1
  const qualification = await this.qualifyStep(leadId);
  emitter({ step: 'qualify', status: 'complete', score: qualification.score });

  // Step 2
  await this.enrichStep(leadId, qualification);
  emitter({ step: 'enrich', status: 'complete' });

  // Step 3 — streaming
  for await (const token of this.claudeService.streamText(emailPrompt)) {
    emitter({ step: 'personalize', token });
  }
  emitter({ step: 'personalize', status: 'complete' });

  // Step 4
  await this.sequenceStep(leadId);
  emitter({ step: 'sequence', status: 'complete' });

  emitter({ step: 'done' });
}
```

### Pattern 3: Isolated ClaudeService Wrapper

**What:** All Claude API interaction is encapsulated in `ClaudeService`. No other service imports `@anthropic-ai/sdk` directly. ClaudeService exposes two methods: `structuredOutput<T>()` and `streamText()`.

**When to use:** Always. Isolating the AI provider behind a service boundary allows swapping models, adding retry logic, logging token usage, and testing with mocks — all without touching business logic.

**Trade-offs:** Slight indirection. The benefit is that model-specific behavior (structured output schema format, streaming event types) is contained in one place. When Anthropic changes the API shape, only ClaudeService needs updating.

---

## Anti-Patterns

### Anti-Pattern 1: Using BullMQ/Redis for This Use Case

**What people do:** Reach for a job queue because the pipeline is "async" and "takes a while."

**Why it's wrong:** A job queue solves horizontal scaling and crash recovery for high-concurrency systems. For a portfolio demo with one demo account, it adds Redis infrastructure, job serialization complexity, dead-letter queue handling, and polling endpoints — none of which demonstrates AI integration skills. The portfolio goal is to show Claude API competency, not queue architecture.

**Do this instead:** In-process async pipeline with SSE progress events. If the system needs to survive process crashes later, add a simple cron that resets `processing` leads older than 5 minutes.

### Anti-Pattern 2: Streaming All Steps Instead of Just the Email

**What people do:** Try to make every Claude call stream to look "more real-time."

**Why it's wrong:** Streaming JSON is not meaningful. You cannot display half a JSON object in a UI. Steps 1, 2, and 4 return structured data. The SDK's `streamText` returns partial token strings that are not valid JSON mid-stream. Attempting to stream these steps forces you into partial-JSON accumulation and deferred parsing with no UX benefit.

**Do this instead:** Use `structuredOutput()` (non-streaming) for qualify, enrich, and sequence. Use `streamText()` only for the email personalization step where prose tokens are immediately displayable.

### Anti-Pattern 3: Storing Raw Scraped HTML in the Database

**What people do:** Save the full scraped HTML of the company page to a database column for later use.

**Why it's wrong:** Company pages can be 500KB+ of HTML. Storing this in Postgres is wasteful and the HTML is ephemeral — it changes frequently and the value was already extracted into the AIOutput enrichment JSON. There is no query use case for raw HTML.

**Do this instead:** ScraperService extracts a 3000-character text summary (headings + paragraphs), passes it to Claude for enrichment, and discards it. Only the enrichment output (industry, tech stack, pain points) is persisted.

### Anti-Pattern 4: Bypassing Structured Outputs with JSON Prompt Engineering

**What people do:** Prompt Claude with "return only valid JSON matching this schema" and parse the response with `JSON.parse()`.

**Why it's wrong:** Claude can and occasionally does include prose, markdown code fences (` ```json `), or explanation text before/after the JSON even with explicit instructions. This requires regex stripping, error handling, and retries. The `output_config.format` structured output feature uses constrained decoding — it is literally impossible for Claude to generate a response that fails `JSON.parse()`.

**Do this instead:** Use `output_config.format` with a JSON schema. It is GA on Claude Sonnet 4.6 as of November 2025. Zero parsing errors, guaranteed schema compliance.

### Anti-Pattern 5: Opening SSE Connection After Receiving LeadId (Race Condition)

**What people do:** `POST /leads` → receive leadId → open EventSource → miss events that already fired.

**Why it's wrong:** If the pipeline starts immediately and the qualify step completes in <200ms (Claude is fast for structured outputs), the SSE connection may not be established before the first event is emitted. The client never receives the qualify step event and the UI shows an incomplete pipeline.

**Do this instead:** Add a 100ms sleep at the start of `processWithStream` to give the client time to establish the EventSource connection. Alternatively, store the last N events in memory and replay them to new SSE connections for the same leadId. The sleep is simpler and sufficient for this use case.

---

## Integration Points

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| Anthropic Claude API | `@anthropic-ai/sdk` via ClaudeService | `claude-sonnet-4-6` for all steps. API key in env var. No streaming for steps 1/2/4. |
| Company websites | Axios GET + Cheerio parse | 8-second timeout. Graceful fallback to empty string if site is unreachable or blocks scraping. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Next.js → NestJS (CRUD) | REST over HTTP | `fetch()` from RSC for list/detail. NEXT_PUBLIC_API_URL env var. |
| Next.js → NestJS (progress) | Server-Sent Events (EventSource) | Client component only. `GET /leads/:id/stream` NestJS `@Sse()` endpoint. |
| PipelineService → ClaudeService | Direct TypeScript injection | NestJS DI. ClaudeService is scoped to REQUEST or DEFAULT (DEFAULT is fine — no per-request state). |
| PipelineService → ScraperService | Direct TypeScript injection | Same NestJS DI. |
| ClaudeService → Anthropic | HTTP via SDK | SDK handles retries (3x default). Do not add manual retry logic on top. |

### Build Order Recommendation

Based on dependencies:

```
Phase 1: Data foundation
  - Prisma schema (Lead, AIOutput, EmailSequence, DemoLead)
  - Prisma migration + PrismaService module
  - Seed script (faker.seed(42) demo leads)
  Verify: DB running in Docker, leads seeded

Phase 2: Claude integration (no HTTP yet)
  - ClaudeService with structuredOutput() + streamText()
  - JSON schemas for qualify/enrich/sequence
  - Unit test ClaudeService with real API (verify schemas parse correctly)
  Verify: Claude calls return valid typed responses

Phase 3: Pipeline service
  - QualifyService, EnrichService (ScraperService), PersonalizeService, SequenceService
  - PipelineService orchestrator with emitter callback
  - Test end-to-end pipeline with console.log emitter
  Verify: Single lead processes start-to-finish

Phase 4: NestJS REST + SSE
  - LeadsController: POST /leads, GET /leads, GET /leads/:id
  - SSE endpoint: GET /leads/:id/stream
  - Wire PipelineService to fire on POST
  Verify: curl POST /leads → SSE events arrive in order

Phase 5: Next.js frontend
  - CRM dashboard (RSC list)
  - Lead detail page + PipelineMonitor (EventSource client component)
  - Email preview with streaming display
  Verify: Full flow from form to email display works

Phase 6: Portfolio integration
  - ai-sdr project card in portfolio
  - /projects/ai-sdr case study page
  - Docker Compose + Coolify deployment
```

---

## Scaling Considerations

This is a portfolio demo. Relevant "scaling" is Lighthouse CI and demo reliability.

| Concern | At Demo Scale (1-5 users) | If Needed Later |
|---------|--------------------------|-----------------|
| Concurrent pipelines | Single Node.js event loop handles fine — Claude calls are I/O-bound | Add BullMQ + Redis worker pool |
| Claude API rate limits | Sonnet 4.6 has generous limits; no throttling expected at demo scale | Add exponential backoff via SDK retry config |
| SSE connection count | <5 concurrent SSE connections, Node.js handles natively | Add Redis-backed pub/sub for multi-process SSE |
| Scraped site blocking | Graceful fallback to empty string | Rotate user agents, add proxy |
| Claude latency | Total pipeline 10-25 seconds depending on Claude response times | Cache enrichment results by company URL |

---

## Sources

- [Anthropic Claude Streaming Docs](https://platform.claude.com/docs/en/build-with-claude/streaming) — `.stream()` TypeScript SDK, SSE event types, `text_delta` events. HIGH confidence.
- [Anthropic Structured Outputs Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `output_config.format`, JSON schema format, GA status on Sonnet 4.6 and Opus 4.6. HIGH confidence.
- [NestJS Server-Sent Events Docs](https://docs.nestjs.com/techniques/server-sent-events) — `@Sse()` decorator, `Observable<MessageEvent>` return type. HIGH confidence.
- [Upstash — Streaming LLM responses via SSE in Next.js](https://upstash.com/blog/sse-streaming-llm-responses) — ReadableStream pattern, client-side chunk buffering. MEDIUM confidence.
- [HackerNoon — Streaming in Next.js 15: WebSockets vs SSE](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events) — EventSource hook pattern for Next.js 15 client components. MEDIUM confidence.
- [DEV.to — Production-ready Claude streaming with Next.js](https://dev.to/bydaewon/building-a-production-ready-claude-streaming-api-with-nextjs-edge-runtime-3e7) — Transform Anthropic SDK events to SSE, buffer management. MEDIUM confidence.
- [BullMQ docs + NestJS queues docs](https://docs.nestjs.com/techniques/queues) — Background job queue evaluation (explicitly rejected for this use case). HIGH confidence on the technology; decision is architectural.
- PROJECT.md — Confirmed tech stack decisions (Next.js 15, NestJS 11, Prisma, Postgres, Claude API, separate standalone repo). HIGH confidence (authoritative project document).

---

*Architecture research for: v5.0 AI SDR Replacement System — pipeline architecture, Claude API streaming, NestJS SSE, database schema*
*Researched: 2026-02-28*
