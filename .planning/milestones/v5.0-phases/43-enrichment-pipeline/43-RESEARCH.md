# Phase 43: Enrichment Pipeline - Research

**Researched:** 2026-03-01
**Domain:** Web scraping (Axios + Cheerio), NestJS service orchestration, Prisma persistence, callback-based pipeline emitter
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | AI automatically qualifies a submitted lead with an ICP score (0-100) | QualifyService calls ClaudeService.structuredOutput() with QualifySchema + QUALIFY_SYSTEM_PROMPT — fully built in Phase 42 |
| PIPE-04 | AI automatically enriches CRM fields: company size, industry, tech stack, pain points | EnrichService calls ClaudeService.structuredOutput() with EnrichSchema + ENRICH_SYSTEM_PROMPT — fully built in Phase 42; Lead model has industry/companySize columns ready |
</phase_requirements>

---

## Summary

Phase 43 wires together all building blocks produced by Phases 41-42 into a working end-to-end pipeline: scraping → qualify → enrich → personalize → Prisma write. Every piece already exists; this phase adds the orchestration layer. The three new ingredients are ScraperService (Axios + Cheerio, realistic User-Agent, Cloudflare fallback), three thin AI services (QualifyService, EnrichService, PersonalizeService each delegating to ClaudeService), and PipelineService that calls them in order, emits step-progress events via a Node.js EventEmitter callback, and persists AIOutput rows plus Lead field updates to Postgres.

The key architectural insight from STATE.md: the pipeline is in-process and sequential — no Redis/BullMQ, no parallel steps, no streaming JSON for qualify/enrich. Only the personalize step streams tokens. This simplifies everything: PipelineService is a plain async method that calls each service in sequence and fires a callback function between steps.

The Cloudflare detection strategy is intentionally simple: check the response HTML for Cloudflare challenge markers ("Just a moment", "cf-browser-verification", HTTP 403/503 with Cloudflare headers) and return an empty string rather than throwing — the pipeline must not error on unreachable sites. Pre-scraping for seed data is already decided; live scraping only needs to degrade gracefully.

**Primary recommendation:** Install `axios@^1.13.6` and `cheerio@^1.2.0`. Build ScraperService as a NestJS Injectable with a single `scrape(url: string): Promise<string>` method. Build QualifyService, EnrichService, PersonalizeService each with one public method delegating to ClaudeService. Build PipelineService.processWithStream() that calls them in sequence, firing a typed callback between steps, and writing to Prisma after each AI step.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/common | ^11.0.0 | Injectable, Module decorators | Project convention |
| @anthropic-ai/sdk | ^0.78.0 | Claude API calls | Already wired in ClaudeService |
| @prisma/client | ^5.22.0 | Postgres writes | Already wired in PrismaService |
| zod | ^4.3.6 | Output schema validation | Already used in Phase 42 |
| rxjs | ^7.8.0 | Available but NOT needed for pipeline — in-process callback | Already installed |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| axios | ^1.13.6 | HTTP GET for web scraping | Industry standard HTTP client, typed, promise-based, Node.js native |
| cheerio | ^1.2.0 | HTML parsing + text extraction | Fast jQuery-like DOM API, no browser runtime needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | node-fetch / undici | Axios has better error objects (AxiosError), timeout support, and headers API — easier to unit-stub |
| cheerio | jsdom | jsdom executes JavaScript — much heavier, not needed for static text extraction |
| Node EventEmitter callback | @nestjs/event-emitter | @nestjs/event-emitter is for decoupled listeners; a callback function passed into processWithStream() is simpler and more testable |

**Installation:**
```bash
cd ai-sdr && npm install axios@^1.13.6 cheerio@^1.2.0
npm install --save-dev @types/cheerio 2>/dev/null || true  # cheerio 1.x ships its own types
```

Note: cheerio 1.x ships its own TypeScript types — no `@types/cheerio` needed.

---

## Architecture Patterns

### Recommended Project Structure
```
ai-sdr/src/
├── claude/                   # EXISTING — Phase 42
│   ├── claude.module.ts
│   ├── claude.service.ts
│   ├── prompts/
│   │   ├── qualify.prompt.ts
│   │   ├── enrich.prompt.ts
│   │   └── personalize.prompt.ts
│   └── schemas/
│       ├── qualify.schema.ts
│       └── enrich.schema.ts
├── pipeline/                 # NEW — Phase 43
│   ├── pipeline.module.ts
│   ├── pipeline.service.ts   # Orchestrator — processWithStream()
│   ├── scraper.service.ts    # Axios + Cheerio
│   ├── qualify.service.ts    # Delegates to ClaudeService
│   ├── enrich.service.ts     # Delegates to ClaudeService
│   └── personalize.service.ts # Delegates to ClaudeService (stream)
├── database/                 # EXISTING
├── health/                   # EXISTING
└── app.module.ts             # Import PipelineModule
```

### Pattern 1: ScraperService — Axios GET with Cloudflare Detection
**What:** Fetches HTML from a URL, extracts text content, returns empty string on any failure or Cloudflare challenge.
**When to use:** Always called first in the pipeline. Returns `""` on error so downstream steps proceed with what they have.

```typescript
// Source: axios-http.com/docs/req_config + cheerio.js.org/docs/intro
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const CLOUDFLARE_MARKERS = [
  'Just a moment',
  'cf-browser-verification',
  'Checking your browser',
  'DDoS protection by Cloudflare',
  'cf_chl_',
];

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly MAX_CHARS = 3000;

  async scrape(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url, {
        headers: { 'User-Agent': REALISTIC_USER_AGENT },
        timeout: 10_000,         // 10s hard cap
        responseType: 'text',
        maxRedirects: 5,
      });

      const html: string = response.data;

      // Detect Cloudflare challenge page
      if (this.isCloudflareChallenge(response.status, html)) {
        this.logger.warn(`Cloudflare challenge detected for ${url} — returning empty string`);
        return '';
      }

      const text = this.extractText(html);
      return text.slice(0, this.MAX_CHARS);
    } catch (err) {
      this.logger.warn(`Scrape failed for ${url}: ${(err as Error).message} — returning empty string`);
      return '';
    }
  }

  private isCloudflareChallenge(status: number, html: string): boolean {
    if (status === 403 || status === 503) return true;
    return CLOUDFLARE_MARKERS.some((marker) => html.includes(marker));
  }

  private extractText(html: string): string {
    const $ = cheerio.load(html);
    // Remove script, style, nav, footer noise
    $('script, style, nav, footer, header, aside, noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  }
}
```

### Pattern 2: Thin AI Service Wrappers
**What:** Each step has its own service to keep PipelineService readable and each service independently testable.

```typescript
// qualify.service.ts
import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import { QualifySchema, QualifyOutput } from '../claude/schemas/qualify.schema';
import { QUALIFY_SYSTEM_PROMPT } from '../claude/prompts/qualify.prompt';

@Injectable()
export class QualifyService {
  constructor(private readonly claude: ClaudeService) {}

  async qualify(leadProfile: string): Promise<QualifyOutput> {
    return this.claude.structuredOutput(
      QualifySchema,
      QUALIFY_SYSTEM_PROMPT,
      leadProfile,
    );
  }
}
```

```typescript
// personalize.service.ts — streams tokens
@Injectable()
export class PersonalizeService {
  constructor(private readonly claude: ClaudeService) {}

  streamEmail(leadProfile: string, enrichment: EnrichOutput): AsyncGenerator<string> {
    const userMessage = this.buildPersonalizeInput(leadProfile, enrichment);
    return this.claude.streamText(PERSONALIZE_SYSTEM_PROMPT, userMessage);
  }
}
```

### Pattern 3: PipelineService with Callback Emitter
**What:** Sequential orchestrator that accepts a typed callback for step-progress events. The callback is fired between steps so the caller (future controller) can forward events to SSE.

```typescript
// pipeline.service.ts
export type StepEvent =
  | { type: 'qualify-complete'; data: QualifyOutput }
  | { type: 'enrich-complete'; data: EnrichOutput }
  | { type: 'personalize-token'; token: string }
  | { type: 'personalize-complete' };

export type StepCallback = (event: StepEvent) => void;

@Injectable()
export class PipelineService {
  constructor(
    private readonly scraper: ScraperService,
    private readonly qualify: QualifyService,
    private readonly enrich: EnrichService,
    private readonly personalize: PersonalizeService,
    private readonly prisma: PrismaService,
  ) {}

  async processWithStream(leadId: string, onStep: StepCallback): Promise<void> {
    // 1. Load lead
    const lead = await this.prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

    // 2. Scrape
    const scraped = await this.scraper.scrape(lead.companyUrl);
    const leadProfile = this.buildLeadProfile(lead, scraped);

    // 3. Qualify
    const qualifyResult = await this.qualify.qualify(leadProfile);
    await this.prisma.aIOutput.create({
      data: { leadId, step: 'qualify', content: qualifyResult },
    });
    onStep({ type: 'qualify-complete', data: qualifyResult });

    // 4. Enrich
    const enrichResult = await this.enrich.enrich(leadProfile);
    await this.prisma.aIOutput.create({
      data: { leadId, step: 'enrich', content: enrichResult },
    });
    onStep({ type: 'enrich-complete', data: enrichResult });

    // 5. Personalize (streaming)
    let emailBody = '';
    for await (const token of this.personalize.streamEmail(leadProfile, enrichResult)) {
      emailBody += token;
      onStep({ type: 'personalize-token', token });
    }
    await this.prisma.aIOutput.create({
      data: { leadId, step: 'personalize', content: { email: emailBody } },
    });
    onStep({ type: 'personalize-complete' });

    // 6. Update Lead record
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        icpScore: qualifyResult.icpScore,
        industry: enrichResult.industry,
        companySize: enrichResult.companySize,
        status: 'complete',
      },
    });
  }
}
```

### Pattern 4: End-to-End Console Test Script
**What:** A standalone ts-node script (like validate-claude.ts) that bootstraps a Lead in Postgres, runs processWithStream(), and confirms AIOutput rows + Lead field updates.
**When to use:** Plan 43-03 verification — confirms the pipeline works before any HTTP controller exists.

```typescript
// scripts/validate-pipeline.ts (pattern only)
const lead = await prisma.lead.create({
  data: {
    name: 'Sarah Chen',
    companyName: 'Flowmatic',
    companyUrl: 'https://flowmatic.io',
    status: 'pending',
  },
});

await pipelineService.processWithStream(lead.id, (event) => {
  console.log('[event]', event.type);
  if (event.type === 'personalize-token') process.stdout.write(event.token);
});

const updated = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
console.assert(updated.icpScore !== null, 'icpScore must be non-null');
console.assert(updated.status === 'complete', 'status must be complete');
```

### Anti-Patterns to Avoid
- **Throwing on scrape failure:** ScraperService MUST return `""` on any error — a failed scrape should not abort the pipeline.
- **Streaming qualify/enrich:** structuredOutput is synchronous-result only. Never attempt to stream structured output — Anthropic SDK's parse() returns a complete object.
- **Using @nestjs/event-emitter for in-process callbacks:** That library is for decoupled pub/sub. A callback function parameter is simpler, fully typed, and more testable.
- **Making PipelineService call ClaudeService directly:** Keep the three AI services as thin wrappers. PipelineService stays readable and each service stays independently unit-testable.
- **Calling the pipeline during recruiter sessions with live scraping:** Per STATE.md decision: seed data is pre-scraped. Live scraping (Phase 43) is only for real new leads submitted via the form.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client | Custom fetch wrapper | axios@^1.13.6 | Error objects (AxiosError), timeout, redirect handling, typed responses out of box |
| HTML text extraction | Regex on raw HTML | cheerio@^1.2.0 | Script/style removal, whitespace normalization, selector API — regex fails on nested tags |
| Cloudflare bypass | Any JS execution | Return empty string | Out of scope (STATE.md). Puppeteer/Playwright adds 60MB+, unreliable in CI |
| Step event bus | Custom EventEmitter class | Typed callback function | Callback is simpler, synchronous, and doesn't need cleanup/teardown |
| Retry logic on scraping | Custom retry loop | Single try, return "" | Pre-scraping handles seed data; live scraping graceful fallback is sufficient |

**Key insight:** The scraper intentionally does NOT bypass Cloudflare. The requirement is: return `""` for protected sites, not bypass protection. This collapses a hard problem into a trivial one.

---

## Common Pitfalls

### Pitfall 1: axios responseType default parses JSON
**What goes wrong:** `axios.get(url)` without `responseType: 'text'` will try to parse the HTML response as JSON and throw.
**Why it happens:** axios default responseType is `'json'` which calls `JSON.parse()` on the response body.
**How to avoid:** Always set `responseType: 'text'` in ScraperService.
**Warning signs:** `SyntaxError: Unexpected token '<'` in stack trace.

### Pitfall 2: Cheerio's `$.text()` on the root includes script content
**What goes wrong:** `$.text()` on the cheerio root includes JavaScript source code from `<script>` tags.
**Why it happens:** `$.text()` extracts all text nodes, including inside script/style elements.
**How to avoid:** Call `$('script, style, nav, footer').remove()` BEFORE calling `$('body').text()`.
**Warning signs:** Output contains minified JavaScript.

### Pitfall 3: processWithStream() called before Lead exists in DB
**What goes wrong:** `findUniqueOrThrow` throws `NotFoundError` if leadId is invalid.
**Why it happens:** Future controller may pass a leadId before Prisma create completes.
**How to avoid:** PipelineService assumes the Lead record is already created by the caller. The console test must create the Lead first.
**Warning signs:** `PrismaClientKnownRequestError: No Lead found`.

### Pitfall 4: PipelineModule not importing ClaudeModule and DatabaseModule
**What goes wrong:** Nest DI cannot resolve ClaudeService or PrismaService for pipeline services.
**Why it happens:** NestJS DI is module-scoped. Services must be exported by their module and imported where needed.
**How to avoid:** PipelineModule imports: [ClaudeModule, DatabaseModule]. Both already export their providers.
**Warning signs:** `Nest can't resolve dependencies of the PipelineService`.

### Pitfall 5: AIOutput `step` field name mismatch
**What goes wrong:** The lead detail page (Phase 45) queries AIOutput by step name. If names differ, outputs won't load.
**Why it happens:** No enforced enum on the `step: String` column — it's free text.
**How to avoid:** Use exactly three string literals: `'qualify'`, `'enrich'`, `'personalize'`. Treat these as a constant. Document them in PipelineService.
**Warning signs:** Phase 45 queries return empty arrays.

### Pitfall 6: axios throws on non-2xx status
**What goes wrong:** A 404 or 503 from a company website throws an AxiosError, not detected by Cloudflare check.
**Why it happens:** axios throws for any status >= 400 by default.
**How to avoid:** The `catch` block in ScraperService already handles this — it returns `""` for ALL exceptions. The Cloudflare check inside the try block handles 403/503 before axios throws (note: axios throws before returning the response for 4xx/5xx, so the Cloudflare check in the catch via `err.response?.status` is needed).
**Corrected pattern:**
```typescript
} catch (err: unknown) {
  const axiosErr = err as import('axios').AxiosError;
  const status = axiosErr.response?.status;
  if (status === 403 || status === 503) {
    this.logger.warn(`Cloudflare/blocked ${url} (${status}) — returning empty string`);
  } else {
    this.logger.warn(`Scrape failed ${url}: ${axiosErr.message} — returning empty string`);
  }
  return '';
}
```

---

## Code Examples

### Cheerio text extraction (verified)
```typescript
// Source: cheerio.js.org/docs/intro
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
$('script, style, nav, footer, header, aside, noscript').remove();
const text = $('body').text().replace(/\s+/g, ' ').trim();
```

### Axios GET with options (verified)
```typescript
// Source: axios-http.com/docs/req_config
const response = await axios.get<string>(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' },
  timeout: 10_000,
  responseType: 'text',
  maxRedirects: 5,
});
```

### Prisma AIOutput create (verified against schema)
```typescript
// Source: ai-sdr/prisma/schema.prisma
await this.prisma.aIOutput.create({
  data: {
    leadId,        // String — foreign key
    step: 'qualify',  // String — free text; use 'qualify' | 'enrich' | 'personalize'
    content: qualifyResult,  // Json — Prisma accepts any object
  },
});
```

### Prisma Lead update (verified against schema)
```typescript
// Source: ai-sdr/prisma/schema.prisma
await this.prisma.lead.update({
  where: { id: leadId },
  data: {
    icpScore: qualifyResult.icpScore,   // Int? -> Int
    industry: enrichResult.industry,    // String?
    companySize: enrichResult.companySize,  // String?
    status: 'complete',                 // LeadStatus enum
  },
});
```

### NestJS Module wiring pattern
```typescript
// pipeline.module.ts
import { Module } from '@nestjs/common';
import { ClaudeModule } from '../claude/claude.module';
import { DatabaseModule } from '../database/database.module';
import { PipelineService } from './pipeline.service';
import { ScraperService } from './scraper.service';
import { QualifyService } from './qualify.service';
import { EnrichService } from './enrich.service';
import { PersonalizeService } from './personalize.service';

@Module({
  imports: [ClaudeModule, DatabaseModule],
  providers: [PipelineService, ScraperService, QualifyService, EnrichService, PersonalizeService],
  exports: [PipelineService],
})
export class PipelineModule {}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| request (deprecated) | axios@^1.13.6 | 2020 | request has been end-of-life since 2020; axios is the standard |
| cheerio@0.x (callback-based) | cheerio@^1.x (ESM/CJS, own types) | 2022 | No @types/cheerio needed; cleaner import |
| @nestjs/event-emitter for in-process events | Typed callback function | Architecture decision | EventEmitter2 adds complexity; a simple callback is correct for sequential pipelines |

**Deprecated/outdated:**
- `cheerio.load()` returning `$` directly as default export: Now use `import * as cheerio from 'cheerio'` then `cheerio.load()`.
- `require('axios').default`: Use `import axios from 'axios'` or `import { default as axios } from 'axios'` in TypeScript.

---

## Open Questions

1. **Lead profile input format for AI services**
   - What we know: validate-claude.ts uses a multi-line string with Name, Title, Company, Employees, Industry, Profile fields.
   - What's unclear: Is there a canonical format? ScraperService output is appended to the profile.
   - Recommendation: PipelineService builds the profile string inline from Lead fields + scraped text. Keep it consistent with validate-claude.ts format.

2. **Error handling: what happens when Claude API fails mid-pipeline?**
   - What we know: PipelineService has no retry logic. ClaudeService throws on API errors.
   - What's unclear: Should the Lead be set to `status: 'failed'` on exception?
   - Recommendation: Wrap processWithStream() body in try/catch at the PipelineService level; on catch, set `status: 'failed'`. This prevents orphaned leads stuck in 'processing'. Plan 43-03 should include this.

3. **Max characters for scraped text**
   - What we know: Phase description says "up to 3000 chars". Claude prompt max_tokens=1024 for structured output.
   - What's unclear: Is 3000 chars the right balance between context richness and token cost?
   - Recommendation: Use 3000 chars as specified. This is well within Claude's context window.

---

## Sources

### Primary (HIGH confidence)
- `ai-sdr/src/claude/claude.service.ts` — ClaudeService.structuredOutput() and streamText() signatures confirmed directly
- `ai-sdr/src/claude/schemas/` — QualifySchema, EnrichSchema confirmed; types match plan
- `ai-sdr/prisma/schema.prisma` — Lead, AIOutput, EmailSequence models confirmed; icpScore nullable Int, step String, content Json
- `ai-sdr/package.json` — existing dependencies confirmed; axios and cheerio NOT yet installed
- cheerio.js.org/docs/intro — load(), $(), text(), find() API verified
- axios-http.com/docs/req_config — headers, timeout, responseType, maxRedirects verified

### Secondary (MEDIUM confidence)
- blog.apify.com/web-scraping-with-axios-and-cheerio — Axios + Cheerio code patterns, User-Agent recommendation
- github.com/cheeriojs/cheerio/releases — cheerio v1.2.0 published 2025-01-23 confirmed
- github.com/axios/axios/releases — axios v1.7.x stable, v1.13.6 most recent confirmed

### Tertiary (LOW confidence)
- zenrows.com/blog/bypass-cloudflare-nodejs — Cloudflare detection markers (HTML string matching). Sufficient for graceful fallback; NOT sufficient for bypass.
- NestJS EventEmitter docs — confirm callback pattern is simpler than @nestjs/event-emitter for sequential use cases

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both axios and cheerio confirmed via official releases; existing stack confirmed via direct file reads
- Architecture: HIGH — code patterns verified against actual existing ClaudeService, PrismaService, schema
- Pitfalls: MEDIUM — responseType/axios behavior is documented; Cloudflare HTML markers are web-sourced (LOW for specific strings, MEDIUM overall as the concept is verified)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (axios/cheerio stable; NestJS v11 stable)
