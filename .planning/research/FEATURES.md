# Feature Research

**Domain:** AI SDR Replacement System — AI-powered lead qualification, CRM enrichment, personalized outbound email, and follow-up sequencing
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (AI SDR UX patterns researched via competitor analysis of Apollo.io, Outreach.io, SalesLoft, AiSDR, Instantly, Clay; explainability UI patterns from industry research; recruiter-specific framing derived from project context)

---

## Context: What This Is and Who It's For

This is a **portfolio demo, not a production SDR tool.** The primary audience is a technical recruiter or hiring manager who will spend 3-5 minutes clicking around. Every feature decision must answer:

> "Does this make Fernando look like a senior engineer, or does this make the app look like a real product?"

Both answers can be right, but they lead to different choices. A real SDR tool hides its AI reasoning. A portfolio demo *shows* its AI reasoning — that's the technical flex.

---

## Feature Landscape

### Table Stakes (Recruiters Expect These)

Features a recruiter expects to exist based on the promise "AI SDR system." Missing these = the demo feels unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Lead input form (name, company, URL) | The entry point — without input, nothing else works | LOW | Single form, 3 fields, validation, loading state |
| Lead list / pipeline view | Any CRM shows leads in a list or kanban; absence of a list makes the app feel like a toy | LOW-MEDIUM | Table with sortable columns: name, company, score, status, date added |
| Lead score displayed prominently (0–100) | Every modern lead scoring tool (HubSpot, Apollo, Salesloft) shows the score as the primary sorting signal | LOW | Score badge with color coding: 0-39 red, 40-69 yellow/amber, 70-100 green |
| Per-lead detail view | Clicking a lead must reveal its enriched data; list-only = no depth demonstration | MEDIUM | Separate route or side drawer: all enrichment fields + emails + sequence |
| AI-generated cold email displayed per lead | The core AI output — must be visible and copy-able | LOW | Read-only email card with subject + body, copy button |
| Follow-up sequence emails (3 emails) | If the feature is listed, it must be accessible; buried in code but hidden from UI is a red flag | MEDIUM | Tabbed or stacked email cards: Email 1, Email 2, Email 3 per lead |
| Demo account pre-seeded | Recruiter will not create a lead from scratch; they need to land and see results immediately | LOW | Seed script, shared demo credentials on login page |
| Persistent storage (Postgres) | A demo that loses data on page refresh looks like it was built without a backend | LOW | Standard NestJS + Prisma + Postgres — already established pattern |

### Differentiators (What Makes This Impressive to a Recruiter)

These are the features that demonstrate AI integration skill, architectural thinking, and product polish — things a junior developer would not build.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI reasoning transparency — ICP score *with justification* | Shows Claude API integration depth; any tool can show a number but showing *why* requires prompt engineering and structured output | MEDIUM | A collapsible "Why this score?" card that explains: matched ICP criteria, weak signals, company profile summary |
| Tech stack detection displayed as badges | Real enrichment data shown as visual chips (e.g., "React", "Stripe", "Segment") — demonstrates that the system actually analyzed the company URL | MEDIUM | Tag cloud of detected technologies, each with a badge; derived from Claude analysis of company website/description |
| Pain point extraction displayed as bullets | AI extracts 2–3 inferred pain points from company profile — shows prompt design sophistication | MEDIUM | "Likely pain points:" bulleted list card under enrichment section |
| "How this email was personalized" callout | A one-line explanation beneath each email: "Referenced their use of Stripe and Series B funding round" — shows AI output transparency (explainable AI pattern) | LOW-MEDIUM | Small italic note under the email body; drawn from Claude's structured response |
| Sequence step timeline UI | Emails displayed as a timeline (Day 1, Day 5, Day 10) with visual step indicators — shows UX design thinking beyond "just dump the text" | MEDIUM | Vertical timeline component: numbered circles, day labels, email content per node |
| Loading state that shows AI work in progress | A skeleton or animated progress indicator while Claude API runs — prevents "is it broken?" confusion and shows async handling sophistication | LOW | Show step indicators: "Analyzing company..." → "Scoring ICP fit..." → "Generating emails..." |
| Enrichment metadata displayed as structured cards | Company size, industry, funding stage displayed in a two-column grid card — mirrors Apollo.io / HubSpot detail view pattern | LOW | Card grid: Company Size, Industry, Funding Stage, HQ Location (if inferable), Tech Stack, Founded (if known) |
| Lead score with visual indicator | 0–100 numeric score backed by a colored progress arc or segmented bar — not just a number, a *visual signal* | LOW-MEDIUM | Circular arc or horizontal bar; green/yellow/red zones; number + label ("Strong Fit", "Weak Fit") |
| Intent signals as tags | Display inferred intent signals as green badges: "Hiring SDRs", "Recently Funded", "Expanding to EMEA" — shows understanding of B2B sales signals | MEDIUM | Tag list with icon prefix; green outline badges; max 4 signals; powered by Claude analysis |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Actual email sending | "Make it really send emails" | SMTP setup, deliverability, SPF/DKIM, CAN-SPAM compliance — massive overhead with zero recruiter-visible benefit; not the point | Display-only email with copy button; clear label "Email ready to send" |
| Real web scraping of company URLs | "Actually analyze the URL the user enters" | Rate limits, bot detection, Playwright overhead in serverless, flaky results on cold run — will fail in demo with ~80% reliability | Claude API infers company details from URL + name in the prompt; cleaner, reliable, and still impressive |
| Kanban pipeline with drag-and-drop | "Like Trello for leads" | High complexity for zero recruiter signal gain; TeamFlow already demonstrates dnd-kit; duplication adds no new skill signal | Simple table list with status filter; sortable columns are sufficient |
| Multi-user accounts with separate workspaces | "Real CRM" | Auth system, org management, tenant isolation — 3 weeks of work that obscures the AI integration story | Single shared demo account; clearly labeled "Demo Account" |
| Real LinkedIn data integration | "Pull their actual LinkedIn" | LinkedIn blocks scraping, has no free public API, OAuth flow adds auth complexity | Claude infers job title, seniority, and profile signals from name + company — nearly as impressive |
| Sequence editor (letting user edit email timing) | "Let users customize the cadence" | Adds UI complexity without demonstrating new skills; the AI writing is the technical story, not the scheduling | Fixed 3-email sequence per lead; generation is what matters |
| Lead status Kanban (New → Qualified → Contacted → Won) | "Pipeline management" | Drag-and-drop status changes are not the AI story; this duplicates TeamFlow's core feature | Simple status dropdown in lead detail view — enough to show state management |
| Webhook integrations (send to HubSpot/Salesforce) | "Real integration" | OAuth flows, token management, Salesforce sandbox setup — weeks of work, zero recruiter time to verify | Show "Export to CRM" as a disabled button with tooltip: "Integration available via API"; signals awareness without building it |
| Rate limiting / API key management UI | "Production-ready" | Complex admin UI that distracts from the AI features and is invisible to a 5-minute demo | Single Claude API key in environment variables; single shared demo user means no per-user key management |
| Sentiment analysis on email replies | "Complete the loop" | Requires inbound email parsing infrastructure (IMAP, webhooks) — entirely separate product | Scope to outbound generation only; "reply tracking" noted as future feature |
| Streaming AI output (typewriter effect) | "Looks cooler" | Claude streaming adds SSE/WebSocket complexity; for structured JSON output (scores, fields, emails), streaming is actually harder to parse | Generate full response, show loading state, reveal complete result — cleaner and more reliable |

---

## UX Patterns for Each Feature

This section documents specifically how each AI output should be presented. This is the "how it looks" for each feature — what actually makes it impressive.

### Lead Score Display

**Pattern: Colored numeric badge + label + horizontal bar**

```
┌─────────────────────────────┐
│  LEAD SCORE                 │
│  ████████████░░░░  78 / 100 │
│  [Strong ICP Fit]           │
└─────────────────────────────┘
```

- Score 70–100: green background, label "Strong ICP Fit"
- Score 40–69: amber/yellow, label "Moderate Fit"
- Score 0–39: red/muted, label "Weak Fit"
- Do NOT use a circular gauge/speedometer — looks like a health metric, not a sales tool
- Use a horizontal segmented bar (consistent with Apollo.io and HubSpot patterns)
- The number is large (text-3xl), the bar is secondary visual
- Positioned top-right of the lead detail card — first thing recruiter sees

### ICP Reasoning Display

**Pattern: Collapsible card with bullet list**

```
┌──────────────────────────────────────────────────────┐
│  WHY THIS SCORE?                          [▼ Expand]  │
│                                                       │
│  Matched criteria:                                    │
│  • B2B SaaS company (✓ ICP target industry)          │
│  • 50–200 employees (✓ target company size)          │
│  • Uses Stripe (✓ indicates payment infrastructure)  │
│                                                       │
│  Weak signals:                                        │
│  • No clear outbound sales team detected             │
│  • Series A (earlier than ideal Stage B+ target)     │
└──────────────────────────────────────────────────────┘
```

- Collapsed by default to avoid overwhelming the layout
- Green checkmarks for matches, muted X or dash for misses
- Stored as structured JSON from Claude response, rendered as a list
- This is the primary technical differentiator — shows prompt engineering sophistication

### CRM Enrichment Fields Display

**Pattern: Two-column property grid (HubSpot-style)**

```
┌─────────────────────────────────────────────────────┐
│  COMPANY ENRICHMENT                                  │
│                                                      │
│  Company Size    │  51–200 employees                 │
│  Industry        │  B2B SaaS                         │
│  Funding Stage   │  Series A                         │
│  Tech Stack      │  [React] [Stripe] [AWS] [Segment] │
│  Pain Points     │  • Scaling outbound sales team    │
│                  │  • Manual lead qualification      │
│                  │  • No structured follow-up cadence│
└─────────────────────────────────────────────────────┘
```

- Tech stack as badge chips — not a comma-separated string
- Pain points as a bullet list — not prose
- Label column left-aligned, value column right of divider
- "Unknown" for any field Claude could not infer — never leave blank, never hallucinate

### Intent Signals Display

**Pattern: Badge tag cloud with icon**

```
Intent Signals:
[↑ Hiring SDRs]  [$ Series A Raised]  [→ Expanding to EMEA]
```

- Green outline badges (consistent with Matrix theme)
- Icon prefix: arrow for growth signals, $ for financial, magnifying glass for research signals
- Maximum 4 signals — if Claude returns more, show top 4 by confidence
- "No strong intent signals detected" placeholder if none found — never hide the field

### Cold Email Display

**Pattern: Email card mimicking an email client**

```
┌─────────────────────────────────────────────────────────┐
│  Email 1 — Initial Outreach                             │
│  ─────────────────────────────────────────────────────  │
│  Subject: Quick question about your outbound at Acme    │
│                                                         │
│  Hi Sarah,                                              │
│                                                         │
│  Noticed Acme Co just closed a Series A — congrats.     │
│  Companies at your stage usually hit a wall with        │
│  manual lead qualification as the team scales...        │
│  [full email body]                                      │
│                                                         │
│  Personalized for: Series A milestone, SDR hiring signal│
│                                                         │
│  [Copy Email]  [Copy Subject Line]                      │
└─────────────────────────────────────────────────────────┘
```

- Rendered in a card with a subtle left border in Matrix green
- Subject line always visible above fold
- "Personalized for:" note at bottom in italic/muted text — the explainability callout
- Copy button for both subject and body independently
- Monospace font for email body (optional but on-brand for this portfolio)

### Follow-up Sequence Timeline

**Pattern: Vertical step timeline (Outreach.io / SalesLoft-inspired)**

```
● Day 1 ── Email 1: Initial Outreach
│           [card with email preview]
│
● Day 5 ── Email 2: Follow-up — Value Add
│           [card with email preview]
│
● Day 10 ── Email 3: Final Attempt — Soft Close
            [card with email preview]
```

- Numbered circles or colored dots connected by a vertical line
- Day label on the left, email title on the right
- Clicking a step expands the email card inline
- Start collapsed — show subject lines only, expand to full body on click
- This visual is the clearest signal that a "sequence" was built, not just one email

### Lead Pipeline / List View

**Pattern: Table with sortable columns (not kanban)**

```
┌──────────┬──────────────┬───────┬─────────────┬──────────┐
│ Name     │ Company      │ Score │ Status      │ Added    │
├──────────┼──────────────┼───────┼─────────────┼──────────┤
│ Sarah K. │ Acme SaaS    │ 78    │ Emails Ready│ Today    │
│ John M.  │ BuiltWith Co │ 52    │ Processing  │ Yesterday│
│ Amy L.   │ GrowthCo     │ 91    │ Emails Ready│ 2 days   │
└──────────┴──────────────┴───────┴─────────────┴──────────┘
```

- Score column has inline color coding (red/yellow/green chip)
- Status: "Processing" (AI running), "Emails Ready" (generation complete), "Failed" (API error)
- Clicking a row navigates to the lead detail view
- Sortable by Score descending by default — highest-quality leads first

### Loading / Generation State

**Pattern: Step-by-step progress indicator**

```
Analyzing company profile...  [▓▓▓▓░░░░░░]
Scoring ICP fit...            [▓▓▓▓▓▓▓░░░]
Generating personalized emails [▓▓▓▓▓▓▓▓▓░]
```

- Each step labeled explicitly — shows the recruiter what the AI is doing
- Linear progress, not a spinner — makes the system feel intelligent, not just loading
- Alternative: simple step list with checkmarks appearing: ✓ Company analyzed → ✓ ICP scored → ⟳ Generating emails...
- Duration: Claude API typically takes 3–8 seconds; the progress animation should cover this without feeling fake

---

## Feature Dependencies

```
Lead Input Form
    └──triggers──> AI Enrichment Pipeline (NestJS service)
                       └──calls──> Claude API (structured JSON response)
                                       └──writes──> Postgres (enrichment fields)
                                       └──writes──> Postgres (lead score + reasoning)
                                       └──writes──> Postgres (3 follow-up emails)

Lead List View
    └──reads──> Postgres (all leads for demo user)
    └──navigates to──> Lead Detail View

Lead Detail View
    └──reads──> Postgres (enrichment + score + emails)
    └──renders──> ICP Score Card
    └──renders──> Enrichment Fields Grid
    └──renders──> Intent Signals Badge Cloud
    └──renders──> Sequence Timeline (3 emails)
    └──renders──> "Why This Score?" Collapsible Card

Demo Account
    └──requires──> Seed script (pre-seeded leads with enrichment complete)
    └──requires──> Login page with demo credentials displayed
```

### Dependency Notes

- **Claude API must return structured JSON, not prose.** All fields (score, reasoning, tech stack, pain points, emails) must be parsed deterministically. Use `response_format` or prompt-constrained JSON output. Raw prose cannot be reliably split into UI components.
- **Seed data must include complete enrichment.** Leads seeded without AI-generated content defeat the demo. Run the seed script against a live Claude API call and commit the results to the seed file.
- **Loading state requires async job tracking.** The NestJS service must store a `status` field on each lead: `pending → processing → complete → failed`. The frontend polls or receives this status to show/hide the progress UI.
- **ICP reasoning must be stored as structured JSON, not string.** The reasoning display (matched/weak bullets) requires a JSON array, not a single explanation string. Define the schema before writing the Claude prompt.

---

## MVP Definition

### Launch With (v1 — AI SDR Demo)

- [ ] Lead input form — 3 fields, validation, submission
- [ ] Claude API integration — single NestJS service call returning structured JSON (score, reasoning, enrichment, 3 emails)
- [ ] Lead list view — table with score column, status column, sortable
- [ ] Lead detail view — all enrichment fields, score, reasoning, sequence timeline
- [ ] Loading/progress state — step labels while Claude API runs
- [ ] Demo account — pre-seeded with 5–8 varied leads, login credentials on login page
- [ ] Copy buttons on emails — recruiter must be able to copy the email text

### Add After Core Works (v1.x)

- [ ] "Personalized for:" explainability callout under each email — impressive but not blocking
- [ ] Intent signals as badge cloud — requires prompt engineering; add after base JSON schema is stable
- [ ] Error state handling — "AI generation failed, please try again" with retry button

### Future Consideration (v2+)

- [ ] Bulk lead import (CSV) — complex parsing, not needed for 5-minute demo
- [ ] Lead status workflow (contacted → replied → meeting booked) — manual CRM actions, not AI story
- [ ] Export to CSV — useful feature, not a differentiator

---

## Feature Prioritization Matrix

| Feature | Recruiter Value | Implementation Cost | Priority |
|---------|-----------------|---------------------|----------|
| Lead input → AI generation pipeline | HIGH — the core demo moment | MEDIUM — Claude API + NestJS service | P1 |
| Lead score with colored bar | HIGH — first visual hit on detail view | LOW — CSS + Prisma field | P1 |
| Lead list with score column | HIGH — proves there's a real backend | LOW — TanStack Table or plain table | P1 |
| ICP reasoning transparency | HIGH — differentiating technical signal | MEDIUM — structured Claude prompt design | P1 |
| Sequence timeline (3 emails, day labels) | HIGH — visual proof of "sequencing" feature | MEDIUM — timeline component + expand/collapse | P1 |
| Enrichment fields grid (size, industry, tech stack) | HIGH — shows depth of AI analysis | LOW — render structured JSON fields | P1 |
| Loading/progress state | MEDIUM-HIGH — prevents "is it broken?" confusion | LOW — step list + polling | P1 |
| Demo pre-seeded leads | HIGH — recruiter won't wait 8 seconds to see anything | LOW — seed script | P1 |
| Copy buttons on emails | MEDIUM — polished UX signal | LOW — clipboard API | P1 |
| "Personalized for:" callout | MEDIUM — explainability UX | LOW — field in JSON response | P2 |
| Intent signals badges | MEDIUM — visual richness | MEDIUM — prompt engineering for reliable signals | P2 |
| Pain points bullet list | MEDIUM — enrichment depth | LOW — array field in JSON | P2 |
| Error/retry state | LOW-MEDIUM — robustness signal | LOW — status field + UI | P2 |

**Priority key:**
- P1: Must have for demo launch
- P2: Should have, add before portfolio integration
- P3: Nice to have, not needed for recruiter demo

---

## Competitor Feature Analysis

What Apollo.io, AiSDR, Instantly, and Clay do — and what we do differently for portfolio purposes.

| Feature | Apollo.io | AiSDR / Instantly | Our Approach |
|---------|-----------|-------------------|--------------|
| Lead score | Shown as a number in list view | Score + intent tier | Number + colored horizontal bar + label + collapsible reasoning |
| Email display | Template preview in sequence editor | Full email in outreach UI | Email card mimicking email client, subject prominent, personalization callout |
| Sequence display | List of steps with type icons | Step-by-step cadence builder | Vertical timeline with day labels; collapsed by default, expand per step |
| Enrichment display | Sidebar panel with fields | Card with key data points | Two-column property grid; tech stack as badge chips; pain points as bullets |
| AI transparency | None — score is a black box | Minimal | Full reasoning card showing matched/weak signals — portfolio differentiator |
| Demo experience | Requires sign-up | Requires trial | Pre-seeded demo, credentials on login page, zero friction |

---

## What Makes This Impressive to a Technical Recruiter

Ordered by recruiter signal strength:

1. **Structured Claude API output.** Not just calling Claude and dumping the response into a textarea. Designing a JSON schema, writing a prompt that reliably produces it, and rendering each field in the correct UI component. This signals senior-level AI integration skill.

2. **Reasoning transparency ("Why this score?").** Showing the AI's logic requires you to engineer the prompt to produce structured reasoning, not just a number. Explainable AI is a 2025 industry standard — building it into a portfolio demo shows awareness of production AI patterns.

3. **Async job architecture.** Lead enrichment takes 3–8 seconds. Handling this with a `status` field, polling (or SSE), and a multi-step progress UI shows event-driven architecture thinking — not just synchronous request/response.

4. **Pre-seeded demo with realistic data.** 5–8 varied leads with different scores, industries, and email styles shows understanding of edge cases and data variety. A single lead with a perfect score is a toy; a pipeline with 78/100, 52/100, 91/100, 34/100 leads looks like a real system.

5. **Email personalization that references specific company facts.** Claude emails that say "noticed you closed a Series A" or "your React + Stripe stack suggests..." — not generic templates. This requires prompt engineering with enrichment data injection.

---

## Sources

- [Apollo.io competitor analysis](https://www.uplead.com/clay-vs-apollo/) — enrichment field layout patterns
- [AiSDR review](https://www.dimmo.ai/products/ai-sdr) — email display and sequence UI patterns
- [Outreach.io sequence documentation](https://support.outreach.io/hc/en-us/articles/115005009048-How-To-Create-an-Outreach-Sequence) — sequence step UI patterns
- [SalesLoft vs Outreach UI comparison](https://www.avoma.com/blog/outreach-vs-salesloft) — cadence builder UX
- [Lead scoring display — Monday.com](https://monday.com/blog/crm-and-sales/lead-scoring-rules/) — 0-100 scoring visualization standards
- [ICP Fit Grade system — RollWorks](https://help.rollworks.com/hc/en-us/articles/360045715211-Account-scoring-Use-ICP-Fit-Grade-to-assess-fit) — A-F grade display, intent + fit combination
- [Instantly + Clay AI enrichment](https://instantly.ai/blog/instantly-clay-ai-powered-lead-enrichment-personalization/) — enrichment field depth, one-liner generation
- [AI Cards in CRM — SuperAGI](https://superagi.com/ai-cards-in-crm/) — "AI card" as bite-sized insight container pattern
- [Explainable AI 2025 trends — SuperAGI](https://superagi.com/mastering-explainable-ai-in-2025-a-beginners-guide-to-transparent-and-interpretable-models/) — YAI/XAI explainability UX, narrative-based reasoning display
- [AI-powered cold email personalization — Instantly](https://instantly.ai/blog/ai-powered-cold-email-personalization-safe-patterns-prompt-examples-workflow-for-founders/) — personalization token vs AI inference comparison
- [Sales cadence guide — Outreach](https://www.outreach.io/resources/blog/sales-cadence) — sequence step count, day spacing standards
- [Koala ICP scoring system](https://getkoala.com/university/lesson/koala-icp-scoring) — ICP score display with intent signals integration

---

*Feature research for: AI SDR Replacement System — v5.0 milestone*
*Researched: 2026-02-28*
