# Pitfalls Research: v5.0 AI SDR Replacement System

**Domain:** AI pipeline with Claude API (claude-sonnet-4-6) in NestJS 11 + Next.js 15 App Router — URL scraping for CRM enrichment, structured JSON output from Claude, SSE streaming to browser, and demo data seeding for recruiter presentation.
**Researched:** 2026-02-28
**Confidence:** HIGH on Claude API structured outputs (official Anthropic docs, verified GA status), HIGH on streaming SSE pitfalls (official docs + confirmed GitHub issues), HIGH on scraping detection (community consensus + multiple sources), MEDIUM on demo data quality (community patterns + recruiter feedback aggregates), MEDIUM on NestJS SSE memory leaks (confirmed GitHub issues, community-verified)

---

## Critical Pitfalls

### Pitfall 1: Structured Outputs Guarantee Format, Not Accuracy — Lead Scores Will Be Confidently Wrong

**What goes wrong:**
Claude's `output_config.format` with `json_schema` guarantees the response parses as valid JSON matching your schema. It does NOT guarantee that the values inside are correct. A lead score of `87` with reasoning `"Company shows strong enterprise buying signals"` will be returned as perfectly valid JSON even when Claude is hallucinating the signals from a company URL it failed to scrape meaningfully. Recruiters interacting with the demo will see authoritative-looking scores that are fabricated.

**Why it happens:**
Developers conflate schema compliance with factual accuracy. The constrained decoding that prevents malformed JSON has no effect on the semantic content Claude generates within those fields. Claude will invent company revenue, team size, and tech stack details to fill required schema fields rather than leaving them empty, because the schema marks them `required`.

**How to avoid:**
- Add a nullable pattern: use `"anyOf": [{"type": "string"}, {"type": "null"}]` instead of `"type": "string"` for fields that depend on scraped data. Instruct Claude in the system prompt: "If the information is not available in the provided content, use null. Do not guess."
- Add a `confidence` field (0–1 float) to the JSON schema alongside each AI-generated field. Claude will self-report uncertainty.
- Validate outputs: any field in your schema that maps to a numeric range (e.g., `lead_score: 0–100`) should be range-checked before persisting to Prisma.
- In the system prompt, include: "Do not infer company size from job titles or domain age. If the website does not state it, set company_size to null."

**Warning signs:**
- Every lead has a lead score between 70–90 (no variance indicates Claude is pattern-matching, not reasoning).
- Tech stack detections list frameworks the company website never mentions.
- `pain_points` field contains generic text like "scaling challenges" for every lead.

**Phase to address:** CRM Enrichment phase (Phase building the enrichment pipeline). Verify during demo seed phase that lead scores show realistic variance.

---

### Pitfall 2: NestJS SSE Observable Never Completes — Memory Leak Under Demo Load

**What goes wrong:**
When using the `@Sse()` decorator in NestJS with an `Observable<MessageEvent>`, if the client disconnects (browser tab closed, page navigated away) before Claude finishes generating, the Observable subscription is not automatically cancelled. The underlying Claude API stream continues consuming tokens and holding the HTTP connection. Under recruiter demo conditions where a user triggers generation and immediately navigates away, you accumulate orphaned streams.

There is a confirmed NestJS GitHub issue (#11601) showing `MaxListenersExceededWarning` with `101 drain listeners added to [SseStream]` under moderate concurrent usage.

**Why it happens:**
NestJS's `@Sse()` handler calls the handler method AFTER the SSE connection is established. Throwing `HttpException` inside results in an SSE error message, not an HTTP 4xx. The `request.signal` abort detection is unreliable — confirmed Next.js GitHub issue (#52809) shows the `abort` event does not fire consistently when the browser cancels the request.

**How to avoid:**
- Use `fromEvent` + `takeUntil` pattern in RxJS: wire the Observable to a subject that completes when the response closes.
- In the NestJS controller, inject `@Res() res: Response` alongside `@Sse()` and listen to `res.on('close', ...)` to trigger stream cleanup.
- Wrap the Anthropic SDK `.stream()` call in a try/finally block and call `stream.abort()` in the finally clause.
- Set a hard token ceiling via `max_tokens` on every Claude call — never let a generation run unbounded.
- Use `timeout(30000)` from `rxjs/operators` as a safety net on the Observable.

**Warning signs:**
- Node.js process memory grows after multiple demo triggers without page reload.
- `MaxListenersExceededWarning` in server logs.
- Claude API usage dashboard shows unexpectedly high token counts that don't match user-visible completions.

**Phase to address:** Streaming phase (Phase building SSE endpoint in NestJS). Add `res.on('close')` cleanup test before merging.

---

### Pitfall 3: Next.js 15 Route Handler Buffers the Entire Stream Before Sending

**What goes wrong:**
In Next.js 15 App Router, if you create a route handler that proxies the NestJS SSE stream (or calls Claude directly), and you `await` anything before returning the `Response`, Next.js buffers the entire response body before sending it to the browser. The user sees nothing for 10–30 seconds, then all the text appears at once — defeating the purpose of streaming.

**Why it happens:**
Next.js route handlers await the handler function to completion before dispatching the Response to the client. The streaming only works if you return a `Response` wrapping a `ReadableStream` **immediately** — without awaiting the async work first.

**How to avoid:**
- Pattern: create a `TransformStream`, return `new Response(readable, { headers })` immediately, then write to `writable` asynchronously after the return.
- Required headers on the Response: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no` (critical for nginx/Coolify reverse proxy to disable buffering).
- Add `export const dynamic = 'force-dynamic'` to the route file to prevent Next.js from attempting to cache or statically optimize the SSE endpoint.
- If proxying through Next.js to NestJS: prefer calling NestJS directly from the browser instead. Avoid the double-hop (browser → Next.js route handler → NestJS SSE) unless CORS makes it unavoidable — every proxy layer adds a buffering risk.

**Warning signs:**
- Streaming works in local `next dev` but chunks appear all at once in production (`next start` or Docker).
- `X-Accel-Buffering` header missing from response when inspected in browser DevTools.
- Response appears after `Content-Length` header is set (indicates fully buffered).

**Phase to address:** Streaming phase. Verify with browser DevTools Network tab that chunks arrive incrementally (not all at once) in Docker/Coolify environment before shipping.

---

### Pitfall 4: Web Scraping the Company URL — Bot Detection Blocks on the First Request

**What goes wrong:**
The NestJS enrichment service fetches the company URL to extract tech stack clues, meta descriptions, and signals. Sending a `fetch()` or Axios request with Node.js defaults (no `User-Agent`, no `Accept` headers) immediately triggers bot detection on Cloudflare-protected sites, enterprise marketing sites, and modern SaaS landing pages. The response is either a 403, a Cloudflare challenge page (which returns 200 with HTML that says "Just a moment..."), or a redirect to a CAPTCHA. The enrichment pipeline silently succeeds — it receives HTML — but passes Cloudflare's challenge page to Claude, which then hallucinates company details from generic placeholder text.

**Why it happens:**
Node.js `fetch()` sends minimal headers. Default Axios sends `axios/1.x.x` as User-Agent. Both are instantly identifiable as bots. Developers assume a successful HTTP response (200) means they received the actual page content.

**How to avoid:**
- Always set realistic headers: `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0`, `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`, `Accept-Language: en-US,en;q=0.5`.
- After fetch, check the response HTML for Cloudflare challenge indicators before passing to Claude: `if (html.includes('cf-browser-verification') || html.includes('Just a moment'))`.
- Set a request timeout of 8–10 seconds. Company sites that take longer will block indefinitely.
- For the demo: pre-scrape and cache the enrichment data for seeded leads. Do not rely on live scraping during recruiter demos — sites go down, add bot protection, change structure. Store scraped content in a `scraped_content` column in Prisma.
- Cheerio + Axios is sufficient for static sites; reserve Playwright headless only if a specific demo company URL requires JavaScript rendering.

**Warning signs:**
- `tech_stack` returns empty array for companies you know use specific tools.
- Company description matches "Checking your browser" or "Please wait..." text.
- Enrichment latency is always < 500ms (suspiciously fast — means the page content is tiny/redirected).

**Phase to address:** URL scraping / enrichment phase. Add a scrape-result validator that checks minimum content length before passing to Claude.

---

### Pitfall 5: Wrong Model ID String Breaks All Claude API Calls Silently

**What goes wrong:**
Using an incorrect or outdated model ID string causes the Claude API to return a 404 or model-not-found error. Verified correct model IDs as of 2026-02-28: `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5-20251001`. Common mistakes: using `claude-sonnet-4-5-20250929` (now legacy, still works but not current), using `claude-3-5-sonnet` (old family, discontinued), or using a dated suffix that doesn't match the current release.

**Why it happens:**
Model IDs change between major releases. Training data and tutorials reference old IDs. The TypeScript SDK's `Anthropic.Models` enum may not be updated as quickly as the API. Hardcoding model strings without constants creates silent version drift.

**How to avoid:**
- Define model ID as a single constant in a config file: `export const CLAUDE_MODEL = 'claude-sonnet-4-6' as const`.
- Use the confirmed current API ID from the models overview page, not SDK enum values.
- Current confirmed IDs (2026-02-28, HIGH confidence — verified from official docs): `claude-sonnet-4-6` (recommended for this project — fast + capable), `claude-opus-4-6` (most capable, higher cost), `claude-haiku-4-5-20251001` (fastest, cheapest — use for high-volume qualification).

**Warning signs:**
- `model_not_found` or 404 errors in Claude API responses.
- API calls succeed in one environment (where model was verified) but fail in another (where model ID was changed).

**Phase to address:** Initial Claude API setup phase. Verify with a single test call before building pipeline logic on top.

---

### Pitfall 6: ANTHROPIC_API_KEY Exposed to the Browser via Next.js Public Variables

**What goes wrong:**
Any environment variable prefixed with `NEXT_PUBLIC_` is bundled into the client-side JavaScript and visible to anyone who opens DevTools. If `ANTHROPIC_API_KEY` is accidentally prefixed `NEXT_PUBLIC_ANTHROPIC_API_KEY` or referenced in a Client Component without going through a server-side API route, the key is exposed. A leaked API key means unauthorized Claude usage billed to your account.

**Why it happens:**
Developers in a hurry copy-paste env var references into Client Components. Next.js Client Components run in the browser — they cannot access server-only env vars, so the natural fix is to add `NEXT_PUBLIC_` prefix, which is the wrong fix.

**How to avoid:**
- The Anthropic SDK must only be instantiated in NestJS (server) or Next.js Server Components / Route Handlers (server-side only).
- Never pass `ANTHROPIC_API_KEY` to Client Components. Client Components call Next.js Route Handlers which call NestJS which calls Claude.
- In NestJS: load the key from `process.env.ANTHROPIC_API_KEY` in a `ConfigService` and inject it into an `AnthropicService` singleton.
- Add to CI: `grep -r "NEXT_PUBLIC_ANTHROPIC" apps/` should return zero results.

**Warning signs:**
- `window.__NEXT_DATA__` in browser console contains `ANTHROPIC_API_KEY` value.
- Build output shows the API key in `.next/static/` chunks.

**Phase to address:** Initial project setup / environment configuration phase. Never fixable by "just being careful" — enforce with a grep check in CI.

---

### Pitfall 7: Prompt Produces Inconsistent Lead Scores Across Runs — Demo Feels Broken

**What goes wrong:**
The same lead with the same scraped company data receives different ICP scores on different Claude calls (e.g., 72, 85, 91 across three runs). Recruiters who regenerate results notice the inconsistency and conclude the system is unreliable — the opposite of what a demo should communicate.

**Why it happens:**
Claude's sampling temperature defaults to a non-zero value, introducing randomness. Additionally, underspecified prompts leave scoring criteria open to interpretation. "Rate this lead's fit for a B2B SaaS product" produces different answers depending on what Claude infers about the product.

**How to avoid:**
- Set `temperature: 0` for all qualification and scoring calls. Use non-zero temperature only for email generation where creative variation is desirable.
- Make the scoring rubric explicit in the system prompt: define what score ranges mean ("80–100: strong ICP fit — company is a known buyer of similar tools, has explicit budget signals; 60–79: moderate fit...").
- Provide few-shot examples in the prompt: 2–3 example lead + score pairs with reasoning.
- For the demo: pre-compute and persist scores. Do not re-run qualification on every page load. Store in Prisma and display cached results. Offer a "Re-analyze" button that triggers a fresh call only on explicit user action.

**Warning signs:**
- Score variance > 10 points across repeated calls on the same lead.
- `reasoning` field text changes significantly between calls while score stays similar.
- Lead ranking order changes on page refresh.

**Phase to address:** Claude prompt engineering phase. Lock in `temperature: 0` on all structured output calls before building the UI on top.

---

### Pitfall 8: Prisma Upsert Race Condition During Demo Seed — Duplicate Key Errors

**What goes wrong:**
Running `prisma db seed` with `Promise.all()` for multiple lead upserts triggers parallel reads followed by parallel writes. Two concurrent upserts on the same unique key (e.g., `email`) read "record does not exist" simultaneously, then both attempt to create it, causing a P2002 unique constraint violation. The seed script fails partway through, leaving partial data.

**Why it happens:**
Prisma's `upsert()` is not atomic at the database level — it performs a read then a write as two separate operations. The confirmed Prisma GitHub issue (#3242) documents this as a known race condition when using `Promise.all()` with upsert.

**How to avoid:**
- Seed leads sequentially with `for...of` + `await`, not `Promise.all()`. The performance difference is irrelevant for demo seeding (20–50 leads).
- Use `createMany` with `skipDuplicates: true` for bulk inserts where update-on-conflict is not needed.
- Add `faker.seed(42)` (as established in DevCollab) to ensure deterministic IDs and emails across seed runs.
- Wrap the seed in a try/catch that logs which record caused the conflict so it's debuggable.

**Warning signs:**
- `Error P2002: Unique constraint failed on fields: ['email']` during seed.
- Database has partial data after seed (some leads missing).
- Re-running seed produces a different result each time.

**Phase to address:** Demo seed / database setup phase. Test seed idempotency by running `npx prisma db seed` twice in a row and asserting the lead count remains the same.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode model ID string inline at call site | Faster setup | Silent model drift if Anthropic deprecates the model; every call site must be updated | Never — use a single `CLAUDE_MODEL` constant |
| Skip `temperature: 0` on scoring calls | Slightly more varied reasoning text | Inconsistent scores break recruiter trust in the demo | Never for scoring; only skip for creative email generation |
| Call Claude API directly from Next.js Route Handler (skipping NestJS) | Saves one HTTP hop | Bypasses NestJS's auth guard, rate limiting, and error handling layers; creates two separate API surfaces to maintain | Only acceptable for portfolio-scale if NestJS is the designated AI gateway and this is a documented exception |
| Store ANTHROPIC_API_KEY in `.env.local` committed to repo | Convenient for solo dev | Key exposure on push; GitHub scans and auto-deactivates leaked Anthropic keys | Never — use `.gitignore` + secret manager or manual env injection |
| Skip scrape result validation before Claude call | Fewer code paths | Cloudflare challenge pages fed to Claude produce confident hallucinations | Never — always validate minimum content length |
| Re-generate AI content on every page load | Simpler state management | Unpredictable API costs; scores change between loads; terrible demo UX | Never for demo — always persist results to Prisma |
| Use `Promise.all()` for seed upserts | Faster seed script | P2002 race condition on unique keys | Never for upsert — use sequential seeding |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Anthropic SDK | Instantiate `new Anthropic()` inside a request handler on every call | Instantiate once as a NestJS singleton via `AnthropicService` registered in a module |
| Anthropic SDK | Not setting `max_tokens` explicitly | Always set `max_tokens` — the API requires it and unbounded responses cause timeout errors on long generations |
| Anthropic structured outputs | Using old `output_format` parameter + `anthropic-beta: structured-outputs-2025-11-13` header | Use `output_config.format` — structured outputs are now GA, beta header no longer required (old parameter kept for transition period) |
| Anthropic streaming | Returning `stream.text_stream` as-is from NestJS to SSE | Convert SDK stream to `Observable<MessageEvent>` that handles `error` events from the SSE protocol; `overloaded_error` can appear mid-stream |
| Axios/Fetch (scraping) | Default Node.js fetch with no headers | Set explicit `User-Agent`, `Accept`, `Accept-Language` headers; validate response is actual page content not a bot challenge |
| NestJS HttpModule | Returning raw `AxiosResponse` object from controller | Extract `response.data` only — `AxiosResponse` contains circular references that crash Express JSON serialization |
| Prisma (seeding) | `Promise.all()` with upsert operations | Sequential `for...of` loop or `createMany` with `skipDuplicates: true` |
| Next.js Route Handler (SSE) | Awaiting async work before returning Response | Return `new Response(readableStream, headers)` immediately; write to stream asynchronously after return |
| Next.js Route Handler (SSE) | Missing `export const dynamic = 'force-dynamic'` | Add it to every SSE route file to prevent static optimization attempts |
| Coolify reverse proxy (SSE) | Missing `X-Accel-Buffering: no` header | Nginx used by Coolify buffers responses by default; this header disables buffering for the stream |

---

## Performance Traps

Patterns that work at small scale but cause problems.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous enrichment pipeline (scrape → Claude → persist) in single request | 15–30 second response time per lead | Make enrichment async — return job ID immediately, poll or SSE for completion | Every lead; makes the dashboard feel broken |
| Sending full scraped HTML to Claude | Input token costs balloon; slow responses; risk hitting context limit on verbose pages | Extract relevant sections with Cheerio before sending: `<title>`, `<meta description>`, `<h1>`, `<h2>`, visible body text (first 2000 chars) | Any company with a marketing-heavy site (>50KB HTML) |
| Running qualification + enrichment + email generation as one mega-prompt | Single point of failure; if one output field is wrong, all are suspect; expensive to retry | Split into separate Claude calls with separate schemas: qualify first, enrich second, generate email third | At scale; for demo it "works" but produces lower quality output |
| No request timeout on external scrape calls | Slow or down company sites hang the NestJS thread indefinitely | Set 8–10 second timeout via `AbortController` or Axios `timeout` config | Any company site with slow DNS or TTFB |
| Generating emails live on demo click with no caching | Latency visible to recruiter; API cost per click | Pre-generate all emails during seed; only re-generate on explicit "Regenerate" action | Every recruiter demo session |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` or any client-exposed API key | Anthropic auto-deactivates leaked keys found on GitHub; billing fraud if key used elsewhere | Only instantiate Anthropic client server-side (NestJS or Next.js Server Component/Route Handler) |
| No rate limit on the AI generation endpoints | Malicious actor triggers thousands of Claude calls, running up API bill | Add NestJS `@Throttle()` guard on enrichment and email generation endpoints; demo-mode guard that limits to pre-seeded leads only |
| Passing user-controlled company URLs directly to the scraper without validation | SSRF — attacker provides `http://169.254.169.254/latest/meta-data/` (AWS metadata) or internal network addresses | Validate URL is public internet (`url.hostname` not localhost/10.x/172.x/192.168.x), allow-list `http(s)` schemes only |
| Logging full Claude prompts + responses to stdout | Prompt injection payloads, scraped PII (email addresses from company pages) appear in logs | Log only token counts and latency, not content; use structured logging with explicit content exclusion |
| Demo credentials in `.env` file committed to repo | Exposes ANTHROPIC_API_KEY + database password | `.env` in `.gitignore`; demo credentials injected via Coolify environment variables panel |

---

## UX Pitfalls

Common user experience mistakes specific to AI SDR demos for recruiters.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic demo leads ("John Doe at ACME Corp") | Recruiter recognizes fake data immediately; undermines credibility | Use realistic fictional companies with specific industries: "Sarah Chen, VP Engineering at Prismatic Data (Series B, 120 employees, uses Snowflake + dbt)" |
| Lead scores with no variance (all 70–85) | Recruiter cannot see the AI making meaningful distinctions | Seed leads across the full spectrum: 2–3 strong ICP (score 85–95), 2–3 moderate (55–70), 1–2 poor fit (20–40) |
| Showing raw Claude output without formatting | Wall of unformatted text reads as a prototype, not a product | Structure email output: Subject line, greeting, body paragraphs, CTA — render as formatted card, not textarea dump |
| No loading state during AI generation | Blank screen during 5–15 second Claude call; recruiter thinks it's broken | Show streaming text in real time or a typed-out progress indicator ("Analyzing company... Scoring ICP fit... Drafting email...") |
| Email body that could apply to any lead | Proves personalization is fake | Include at minimum: company name, inferred tech stack item, one specific signal from their site, lead's title |
| No "how it works" annotation visible to recruiter | Recruiter sees output but doesn't know Claude generated it | Show a collapsible "AI Reasoning" panel with the `reasoning` field from the qualification response |
| Re-running enrichment on every page load | Scores change, recruiter notices; also runs up API costs | Persist all AI results to Prisma; display cached results by default |
| Demo account can access real enrichment pipeline (live scraping) | Risk of hitting bot-blocked sites during demo; long latency kills flow | Gate live enrichment behind a feature flag; demo account uses pre-seeded enrichment results only |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Streaming:** Verify in production Docker build (not `next dev`) that stream chunks arrive incrementally. `next dev` bypasses many of the buffering behaviors that affect `next start`.
- [ ] **Structured outputs:** Verify `output_config.format` (not the legacy `output_format`) is used in the API call body. The old parameter still works during the transition period but emits deprecation warnings.
- [ ] **Lead scores:** Verify score variance across seeded leads — if all scores cluster between 70–85, the prompt is not discriminating. Check with `temperature: 0` locked in.
- [ ] **Scraping validation:** Verify the enrichment service rejects Cloudflare challenge pages before sending to Claude. Send a request to `https://cloudflare.com` and assert the pipeline returns a "scrape failed" result rather than hallucinated company data.
- [ ] **SSE cleanup:** Verify that closing the browser tab during generation does not cause the NestJS process memory to grow. Monitor with `process.memoryUsage()` before and after 5 abandoned streams.
- [ ] **API key security:** Run `grep -r "NEXT_PUBLIC_ANTHROPIC" apps/` — must return zero results.
- [ ] **Seed idempotency:** Run `npx prisma db seed` twice consecutively. Lead count must be identical after both runs.
- [ ] **Nginx buffering:** Inspect live Coolify deployment response headers for `X-Accel-Buffering: no`. If missing, SSE will not stream through the reverse proxy.
- [ ] **Email personalization:** Verify generated emails contain the lead's company name and at least one specific signal. A template that replaces `{{company_name}}` is not personalization.
- [ ] **Demo credentials:** Verify demo login works with `demo@aisdr.fernandomillan.me` / `demo` (or whatever the seeded credentials are) on production before presenting to any recruiter.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| API key leaked in git history | HIGH | Rotate key immediately in Anthropic Console; `git filter-branch` or BFG Repo Cleaner to remove from history; force push (only acceptable case for force push on main) |
| All demo lead scores are identical | LOW | Add variance to system prompt rubric; re-run with `temperature: 0` and more explicit scoring criteria; re-seed. Takes ~30 min. |
| SSE never streams (everything buffered) | MEDIUM | Add `X-Accel-Buffering: no` header; add `export const dynamic = 'force-dynamic'`; refactor to return `Response` immediately without awaiting. Allow 2–4 hours. |
| Cloudflare blocks scraping on demo leads | LOW | Pre-scrape and cache in Prisma. For live demos, disable live scraping entirely — use cached enrichment only. Takes ~1 hour. |
| Seed race condition corrupts database | LOW | Add `--reset` flag to seed script that drops and recreates demo leads table; use sequential seeding; re-run. Takes ~30 min. |
| Structured output returns wrong schema shape | MEDIUM | Switch from prompt-based JSON to `output_config.format` with explicit schema; add `additionalProperties: false` to schema; add Zod validation before Prisma write. Takes 2–4 hours. |
| NestJS memory leak from orphaned streams | MEDIUM | Add `res.on('close')` cleanup + `stream.abort()` in finally block; deploy. Need load test to verify. Takes 4–8 hours. |
| Demo data looks fake to recruiter | HIGH | Redesign seed data with realistic companies, specific industries, meaningful score variance, properly personalized emails. Takes 1–2 days. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Structured outputs accuracy vs format confusion | Claude API integration / prompt engineering phase | Schema has nullable fields; `confidence` field present; range validation before Prisma write |
| NestJS SSE memory leak | Streaming phase (NestJS SSE endpoint) | `res.on('close')` cleanup implemented; memory stable after 5 abandoned streams |
| Next.js streaming buffering | Streaming phase (Next.js route handler or direct browser call) | Browser DevTools shows incremental chunk delivery in Docker build |
| Bot detection blocks scraping | URL enrichment / scraping phase | Scrape validator rejects challenge pages; realistic User-Agent set |
| Wrong Claude model ID | Project setup / environment phase | Single `CLAUDE_MODEL` constant defined; test call succeeds before pipeline build |
| API key browser exposure | Project setup / environment phase | `grep -r "NEXT_PUBLIC_ANTHROPIC" apps/` returns zero results in CI |
| Inconsistent lead scores | Claude prompt engineering phase | `temperature: 0` confirmed; score variance across seeded leads is realistic (full spectrum 20–95) |
| Prisma seed race condition | Demo data / seed phase | `npx prisma db seed` runs twice idempotently; uses sequential seeding |
| Generic demo data | Demo data / seed phase | Seed data reviewed: specific companies, score variance, personalized email content |
| Nginx SSE buffering (Coolify) | Deployment / integration phase | `X-Accel-Buffering: no` verified in production response headers |
| SSRF via user-provided URLs | URL enrichment / scraping phase | URL validation rejects private IP ranges and non-http(s) schemes |
| No rate limiting on AI endpoints | NestJS API security phase | `@Throttle()` guard confirmed on enrichment and email generation endpoints |

---

## Sources

- [Anthropic Structured Outputs — Official Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — HIGH confidence; verified GA status, `output_config.format` parameter, accuracy disclaimer
- [Anthropic Streaming Messages — Official Docs](https://platform.claude.com/docs/en/build-with-claude/streaming) — HIGH confidence; SSE event types, error events, recovery strategies
- [Anthropic Models Overview — Official Docs](https://platform.claude.com/docs/en/about-claude/models/overview) — HIGH confidence; verified `claude-sonnet-4-6` as correct model ID as of 2026-02-28
- [NestJS SSE Memory Leak — GitHub Issue #11601](https://github.com/nestjs/nest/issues/11601) — MEDIUM confidence; confirmed community issue with `MaxListenersExceededWarning`
- [NestJS SSE disconnect cleanup — GitHub Issue #9517](https://github.com/nestjs/nest/issues/9517) — MEDIUM confidence; confirms SSE disconnect handling needs explicit cleanup
- [Next.js request abort not firing — GitHub Issue #52809](https://github.com/vercel/next.js/issues/52809) — MEDIUM confidence; confirms abort signal unreliability
- [Fixing Slow SSE in Next.js — Medium, Jan 2026](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) — MEDIUM confidence; X-Accel-Buffering pattern confirmed
- [Prisma upsert race condition — GitHub Issue #3242](https://github.com/prisma/prisma/issues/3242) — HIGH confidence; documented known issue, official Prisma acknowledgement
- [Anthropic API Key Best Practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure) — HIGH confidence; official Anthropic security guidance
- [Playwright bot detection avoidance — ZenRows](https://www.zenrows.com/blog/avoid-playwright-bot-detection) — MEDIUM confidence; community-verified User-Agent and header patterns
- [Anthropic Increase Output Consistency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency) — HIGH confidence; official Anthropic guidance on temperature and rubric-based scoring

---
*Pitfalls research for: AI SDR Replacement System — Claude API + NestJS 11 + Next.js 15*
*Researched: 2026-02-28*
