# Phase 46: Demo Seed + Portfolio Integration - Research

**Researched:** 2026-03-01
**Domain:** Prisma seed scripts, Docker Compose Coolify deployment, Next.js portfolio case study pages
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEMO-01 | App is pre-seeded with 6–8 fictional leads covering full ICP score spectrum (20–95) | Seed script writes directly to Lead + AIOutput + EmailSequence tables via Prisma. Uses upsert on Lead.id (fixed CUID per seed key) for idempotency. Data is hand-crafted — no live pipeline call. |
| DEMO-02 | Seeded leads span different industries with realistic enrichment and personalized emails | Seed data must include distinct industries, company-specific enrichment facts, and email copy that references real company details. Faker provides deterministic values; specific facts must be hand-authored for quality. |
| PORT-01 | Portfolio home page includes AI SDR as a third project card | `apps/web/app/(portfolio)/page.tsx` has a 2-column StaggerContainer grid with TeamFlow and DevCollab. Must add AI SDR card using the same EvervaultCard + Link pattern. Grid changes to 3-column or wraps. |
| PORT-02 | Case study page at `/projects/ai-sdr` with tech stack, architecture decisions, and screenshots | No `apps/web/app/(portfolio)/projects/ai-sdr/` directory exists yet. Must create it following the exact same pattern as `teamflow/page.tsx` — CaseStudySection, WalkthroughSection, AnimateIn, Button links. |
| PORT-03 | Portfolio project card links to the deployed live demo | The live URL (e.g. `https://ai-sdr.fernandomillan.me`) must be set in the case study's "View Live Demo" button and on the project card. Requires knowing the deployed URL before or during plan execution. |
</phase_requirements>

---

## Summary

Phase 46 has three distinct sub-problems: (1) a Prisma seed script that pre-populates 6-8 complete leads with all three AI output steps, (2) Coolify deployment via Docker Compose for the ai-sdr-api and ai-sdr-web services with X-Accel-Buffering confirmed for SSE, and (3) portfolio integration on `fernandomillan.me` adding AI SDR as a third project card and a full case study page.

The seed script is the most critical piece. The schema already has all tables (`Lead`, `AIOutput`, `EmailSequence`, `DemoLead`). The seed must write `Lead` records with `status: 'complete'` and populate `AIOutput` rows for all three steps (qualify, enrich, personalize) using the exact step constants `'qualify'`, `'enrich'`, `'personalize'` from `pipeline.service.ts`. Idempotency is handled by checking for an existing DemoLead record by `seedKey` before inserting — if it exists, the lead already exists. The `DemoLead` model has a `@unique seedKey` field designed exactly for this in Phase 41.

The Coolify deployment follows the exact same pattern already proven for DevCollab: build Docker images in CI, push to GHCR, trigger Coolify webhooks. The ai-sdr directory already has a complete `Dockerfile` for the NestJS API (multi-stage, `prisma migrate deploy` in CMD). A new `Dockerfile` for the Next.js web app needs to be created following the `output: 'standalone'` pattern that is already configured in `ai-sdr/web/next.config.ts`. The X-Accel-Buffering header is already set in `leads.controller.ts` — this is a verification task, not a code task.

The portfolio integration is pure Next.js content work on the `apps/web` side of the monorepo. The pattern is already proven (TeamFlow and DevCollab case studies exist). The AI SDR case study page needs screenshots, which requires taking them from the running app. Screenshots go into `apps/web/public/screenshots/` at 1280x800, and walkthrough data goes into `apps/web/src/data/walkthrough-data.ts` as a new exported constant.

**Primary recommendation:** Execute in three sequential plans: 46-01 (seed script + DemoLead idempotency + data verification), 46-02 (Docker images + Coolify deployment + SSE header end-to-end verification), 46-03 (portfolio card + case study page + screenshots).

---

## Standard Stack

### Core (all already installed — no new packages needed for seed or portfolio)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @prisma/client | ^5.22.0 | Prisma ORM for seed upserts | Already in ai-sdr package.json; PrismaService extends PrismaClient |
| prisma | ^5.22.0 | `prisma migrate deploy` in Docker CMD | Already in devDependencies |
| dotenv | ^17.3.1 | Load DATABASE_URL for seed script outside NestJS | Already in devDependencies |
| ts-node | ^10.9.0 | Run seed TypeScript script directly | Already in devDependencies |
| next | 16.1.6 | Next.js app for portfolio | Already installed in apps/web |

### Supporting (needed for seed quality data)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @faker-js/faker | ^9.x | Deterministic fake data with faker.seed(42) | Used in devcollab seed; install in ai-sdr scripts or seed file. NOT needed if data is fully hand-authored. |

**Decision on faker:** The DevCollab seed uses `faker.seed(42)` for deterministic data. For Phase 46, the seed data quality requirement (DEMO-02: company-specific facts, realistic enrichment) suggests hand-authored lead profiles are safer than faker-generated ones. Faker can generate names and URLs; the AI output content (qualify reasoning, enrich facts, personalized email) MUST be hand-authored to pass DEMO-02. Recommend hand-authored leads with faker only for contact names.

**Installation (only if faker chosen for names):**
```bash
cd /home/doctor/fernandomillan/ai-sdr && npm install --save-dev @faker-js/faker
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored seed data | Re-running the live pipeline | Live pipeline fails ~20-30% of sites, takes 45-90 seconds per lead, costs real Anthropic API credits, and produces non-deterministic output. The STATE.md architectural decision explicitly prohibits live scraping during recruiter sessions. |
| DemoLead idempotency check | Checking Lead by name/companyName | Lead has no unique constraint on name+companyName. DemoLead.seedKey is @unique by schema design (Phase 41 decision). Use DemoLead.findUnique({ where: { seedKey } }) as the guard. |
| Coolify Docker Compose (existing pattern) | Separate Coolify services | The existing deployment for TeamFlow and DevCollab uses the Docker Compose approach via coolify-compose.yml + GHCR images triggered by webhooks. Reuse the exact same pattern for ai-sdr. |

---

## Architecture Patterns

### Recommended Project Structure for Seed
```
ai-sdr/
├── prisma/
│   └── schema.prisma           # EXISTING — DemoLead model already defined
├── scripts/
│   └── seed.ts                 # NEW — standalone seed script (NOT in src/; outside NestJS)
├── package.json                # Add "db:seed" script pointing to scripts/seed.ts via ts-node
└── tsconfig.json               # Already has ts-node support in devDependencies
```

### Pattern 1: Seed Script Structure
**What:** Standalone TypeScript script run via `ts-node scripts/seed.ts`. Connects to Postgres via `DATABASE_URL` env var. Checks DemoLead.seedKey for idempotency before inserting.

**Key insight from codebase:** The `ai-sdr/prisma/validate-claude.ts` and `validate-pipeline.ts` scripts already exist in `/prisma/` and use ts-node. The pattern is established.

```typescript
// Source: ai-sdr pattern + DevCollab seed pattern (packages/devcollab-database/prisma/seed.ts)
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_LEADS = [
  {
    seedKey: 'demo-lead-01',
    name: 'Sarah Chen',
    companyName: 'Acme FinTech',
    companyUrl: 'https://acmefintech.com',
    icpScore: 87,
    industry: 'FinTech SaaS',
    companySize: '50-200 employees',
    qualify: { /* hand-authored QualifyOutput */ },
    enrich: { /* hand-authored EnrichOutput */ },
    email: '...hand-authored personalized email...',
  },
  // ... 5-7 more
];

async function main() {
  for (const lead of DEMO_LEADS) {
    // Idempotency: check DemoLead by seedKey
    const existing = await prisma.demoLead.findUnique({
      where: { seedKey: lead.seedKey },
    });
    if (existing) {
      console.log(`[${lead.seedKey}] already seeded — skipping`);
      continue;
    }

    // Create Lead record with complete status
    const created = await prisma.lead.create({
      data: {
        name: lead.name,
        companyName: lead.companyName,
        companyUrl: lead.companyUrl,
        status: 'complete',
        icpScore: lead.icpScore,
        industry: lead.industry,
        companySize: lead.companySize,
      },
    });

    // Create AIOutput rows — step constants must match EXACTLY
    await prisma.aIOutput.createMany({
      data: [
        { leadId: created.id, step: 'qualify', content: lead.qualify },
        { leadId: created.id, step: 'enrich', content: lead.enrich },
        { leadId: created.id, step: 'personalize', content: { email: lead.email } },
      ],
    });

    // Register in DemoLead for idempotency tracking
    await prisma.demoLead.create({
      data: {
        seedKey: lead.seedKey,
        name: lead.name,
        companyName: lead.companyName,
        companyUrl: lead.companyUrl,
      },
    });

    console.log(`[${lead.seedKey}] seeded — icpScore: ${lead.icpScore}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Pattern 2: Running the Seed
**In development (local):**
```bash
cd /home/doctor/fernandomillan/ai-sdr
DATABASE_URL=postgresql://aisdr:aisdr@localhost:5436/aisdr npx ts-node scripts/seed.ts
```

**In production Docker (via Coolify service):**
Add a `seed` service to `ai-sdr/docker-compose.yml` that depends on `api` being healthy and runs `npx ts-node scripts/seed.ts`. This is the exact DevCollab pattern (devcollab-seed service in coolify-compose.yml).

The seed container needs: Prisma schema, the seed script, ts-node, and dotenv. The existing api Dockerfile COPY pattern copies prisma/ — the seed Dockerfile must also copy `scripts/`.

### Pattern 3: ICP Score Spectrum for DEMO-01
**Goal:** 6-8 leads spanning 20-95 with clear industry variety.

Suggested distribution (all hand-authored):
| Seed Key | Industry | ICP Score | Persona |
|----------|----------|-----------|---------|
| demo-lead-01 | FinTech SaaS | 92 | VP Sales at 150-person series B |
| demo-lead-02 | Healthcare SaaS | 78 | Head of Revenue at 80-person startup |
| demo-lead-03 | E-commerce | 55 | Director of Growth at 300-person mid-market |
| demo-lead-04 | Enterprise HR Software | 43 | Sales Manager at 500-person established co |
| demo-lead-05 | Construction Tech | 31 | VP Operations at 200-person company |
| demo-lead-06 | Consumer Mobile App | 22 | Founder at 15-person early-stage |
| demo-lead-07 | B2B SaaS DevTools | 85 | CRO at 120-person growth-stage |
| demo-lead-08 | Logistics Tech | 67 | VP Business Dev at 250-person company |

This gives: 2 leads in 80-95 range, 2 in 65-78 range, 2 in 40-55 range, 2 in 20-31 range — full spectrum visible in the lead table.

### Pattern 4: Coolify Deployment via Docker Compose + GHCR
**What:** Follow the exact DevCollab CI/CD pattern.

Current deploy.yml jobs:
1. `test` — runs tests (currently only for teamflow/devcollab)
2. `build-and-push` — builds teamflow images to GHCR
3. `build-and-push-devcollab` — builds devcollab images to GHCR
4. `deploy` — triggers Coolify webhooks for teamflow
5. `deploy-devcollab` — triggers Coolify webhooks for devcollab

**Need to add:**
- `build-and-push-ai-sdr` job: builds `ai-sdr-api` and `ai-sdr-web` Docker images
- `deploy-ai-sdr` job: triggers Coolify webhooks

**ai-sdr-api Dockerfile:** ALREADY EXISTS at `ai-sdr/Dockerfile`. Works today.

**ai-sdr-web Dockerfile:** DOES NOT EXIST. Must create at `ai-sdr/web/Dockerfile`. Pattern: Next.js standalone output is already configured (`output: 'standalone'` in next.config.ts). Must copy `.next/standalone`, `.next/static`, and `public/`.

**ai-sdr-web Dockerfile pattern:**
```dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_API_URL must be set at build time for Client Components
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

**CRITICAL:** `NEXT_PUBLIC_API_URL` must be passed as a build ARG because it is baked into the client bundle at build time (used in `pipeline-monitor.tsx`). It cannot be set at runtime for Client Components.

### Pattern 5: X-Accel-Buffering Verification
**Status:** The header is ALREADY set in code at `ai-sdr/src/leads/leads.controller.ts` line 61:
```typescript
res.setHeader('X-Accel-Buffering', 'no');
```

**Verification task:** After deploying to Coolify, verify with curl:
```bash
curl -v https://ai-sdr-api.fernandomillan.me/leads/{leadId}/stream 2>&1 | grep -i "x-accel"
# Expected: < X-Accel-Buffering: no
```

Also verify that tokens arrive incrementally (not in bulk at end):
```bash
curl -N https://ai-sdr-api.fernandomillan.me/leads/{leadId}/stream
# Expected: events arrive one-by-one as pipeline runs, not all at once when complete
```

### Pattern 6: Portfolio Case Study Page
**What:** Create `apps/web/app/(portfolio)/projects/ai-sdr/page.tsx` following the exact same pattern as `teamflow/page.tsx`.

**Existing pattern verified:**
- Uses `CaseStudySection` component (accepts `title` + `children`, renders `AnimateIn` + `SectionLabel` + h2)
- Uses `WalkthroughSection` component (accepts `title` + `screenshots: WalkthroughScreenshot[]`)
- Walkthrough data lives in `apps/web/src/data/walkthrough-data.ts`
- Screenshots at 1280x800 in `apps/web/public/screenshots/`
- Back link to `/projects`, "View Live Demo" Button with ExternalLink icon, "View Source" Button with Github icon
- Tech stack: Next.js 16, NestJS 11, TypeScript, Anthropic Claude API, Prisma, PostgreSQL, Docker, Tailwind

**Key architectural decisions to document in case study (differentiating from TeamFlow/DevCollab):**
1. SSE streaming tokens instead of WebSockets — unidirectional pipeline events, not bidirectional collaboration
2. Structured outputs (Zod + zodOutputFormat) for qualify/enrich — temperature: 0 for determinism
3. Standalone repo (not Turborepo monorepo) — proves ability to architect either way
4. X-Accel-Buffering: no for Nginx SSE proxy — production deployment decision
5. Sequential pipeline steps (no Redis/BullMQ) — in-process callback bridges to SSE Observable
6. Pre-seeded demo data — live scraping fails 20-30% of sites, seed provides reliable recruiter experience

**Screenshots needed (take from running app):**
1. `ai-sdr-leads.png` — /leads page showing lead table with ICP score bars (seeded data)
2. `ai-sdr-pipeline.png` — /leads/:id page mid-pipeline, showing step progress indicators
3. `ai-sdr-score.png` — /leads/:id complete lead, showing ScoreCard + WhyScoreCard
4. `ai-sdr-email.png` — /leads/:id complete lead, showing EmailPreview with email copy

### Pattern 7: Portfolio Home Page — Third Project Card
**Current state:** `apps/web/app/(portfolio)/page.tsx` has a 2-column `StaggerContainer` grid with hardcoded TeamFlow and DevCollab cards. The description says "Two production-ready SaaS applications".

**Required changes:**
1. Change grid from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
2. Add AI SDR StaggerItem with Link card (same EvervaultCard pattern)
3. Update the paragraph copy from "Two production-ready..." to "Three production-ready..."

Also update `apps/web/app/(portfolio)/projects/page.tsx` (the `/projects` listing) to add the AI SDR ProjectCard using the `ProjectCard` component.

### Anti-Patterns to Avoid

- **Calling the live pipeline in the seed script:** The architectural decision from STATE.md explicitly prohibits live scraping during recruiter sessions. The seed must write pre-authored AI output directly to the database — never call `PipelineService`.
- **Using `optional()` in hand-authored JSON content:** The AIOutput.content field is `Json` in Prisma. The hand-authored qualify/enrich objects must match the exact Zod schemas (`QualifyOutput`, `EnrichOutput`) to avoid UI rendering errors on the detail page.
- **Missing `EmailSequence` records:** The schema has `EmailSequence` related to `Lead`. The UI does NOT render EmailSequence (it's v2). The seed does NOT need to create EmailSequence rows — skip them.
- **Not creating the DemoLead record:** The idempotency guard checks `DemoLead.seedKey`. If `demoLead.create` is skipped, re-running the seed will re-insert duplicate Lead records.
- **Wrong step constant values:** The step names must be exactly `'qualify'`, `'enrich'`, `'personalize'` (all lowercase, as defined in `STEP_QUALIFY`, `STEP_ENRICH`, `STEP_PERSONALIZE` constants in `pipeline.service.ts`). Wrong values silently break the UI (AIOutput.find returns undefined).
- **Building Next.js web without NEXT_PUBLIC_API_URL at build time:** This env var is embedded in the client bundle by Next.js during `npm run build`. Setting it only at runtime in Docker does nothing for Client Components. Must pass as Docker build ARG.
- **Purple in any design element:** Global constraint. The portfolio page and case study must use the existing Radix slate/blue/green/amber color system. No purple anywhere.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seed idempotency | Custom Lead query by name | DemoLead.findUnique({ where: { seedKey } }) | DemoLead.seedKey has @unique constraint by design — zero chance of false positive |
| Seed data for AI outputs | Running the actual Claude pipeline | Hand-authored JSON in seed script | Pipeline takes 45-90 seconds, costs API credits, produces non-deterministic output, fails on bad URLs |
| Portfolio case study layout | New custom layout component | CaseStudySection + WalkthroughSection (already built) | Pattern proven across TeamFlow and DevCollab case studies — consistent visual design |
| SSE buffering fix | Nginx config changes | X-Accel-Buffering: no header in NestJS | Nginx honors this response header per-connection without server config changes — already implemented |

---

## Common Pitfalls

### Pitfall 1: Seed Writes `pending` Status Leads
**What goes wrong:** The leads page (`/leads`) calls `GET /leads` which returns all leads including seeded ones. If seeded leads have `status: 'pending'`, clicking them triggers SSE and tries to run the pipeline — overwriting the pre-authored AI output.
**Why it happens:** Seed forgets to set `status: 'complete'` explicitly.
**How to avoid:** Always set `status: 'complete'` and `icpScore` on seed Lead records. The UI only renders the static AI output cards when `lead.status === 'complete'`. The SSE pipeline trigger fires only when `shouldStream = lead.status === 'pending'`.
**Warning signs:** Clicking a seeded lead on /leads/:id shows "Pipeline is running — refresh in a moment" instead of the static cards.

### Pitfall 2: Personalize Content Schema Mismatch
**What goes wrong:** The `EmailPreview` component reads `personalizeOutput.email` (a string). If the seed stores the personalize AIOutput.content as `{ body: '...' }` instead of `{ email: '...' }`, the email preview renders empty.
**Why it happens:** The pipeline stores personalize output as `{ email: emailBody }` (confirmed in `pipeline.service.ts` line 77). The seed must match this exact shape.
**How to avoid:** Verify the personalize content shape: `{ email: 'Dear ...' }` — field name is `email`, not `body` or `text`.
**Warning signs:** EmailPreview on a seeded lead shows no text even though the lead status is `complete`.

### Pitfall 3: NEXT_PUBLIC_API_URL Baked-In vs Runtime
**What goes wrong:** The Next.js web Dockerfile sets `NEXT_PUBLIC_API_URL` as a runtime ENV, but the pipeline-monitor.tsx client component uses it as `process.env.NEXT_PUBLIC_API_URL` — this only works if it was present at build time.
**Why it happens:** `NEXT_PUBLIC_` variables are statically replaced by Next.js compiler during `next build`. Runtime environment injection doesn't work for client-side code.
**How to avoid:** Pass `--build-arg NEXT_PUBLIC_API_URL=https://ai-sdr-api.fernandomillan.me` in the Docker build step. Add to GitHub Actions workflow.
**Warning signs:** SSE EventSource opens to wrong URL (empty string or undefined/leads/:id/stream).

### Pitfall 4: Seed Script Cannot Import from `src/` (No NestJS Runtime)
**What goes wrong:** The seed script uses the NestJS PrismaService import, which requires the NestJS DI container to be running.
**Why it happens:** `PrismaService` extends `PrismaClient` and is an `@Injectable()` — it cannot be instantiated outside NestJS context.
**How to avoid:** The seed script creates a raw `PrismaClient` instance directly: `const prisma = new PrismaClient()`. Do NOT import PrismaService. The DevCollab seed pattern confirms this: `import { prisma } from '../src/client'` where `src/client.ts` exports a raw `new PrismaClient()`.
**Warning signs:** `Cannot find module` or `Reflect.metadata is not defined` errors when running seed.

### Pitfall 5: DemoLead seedKey Idempotency Doesn't Cover Re-Seeding After Lead Deletion
**What goes wrong:** If a recruiter deletes a seeded lead (future feature) or leads are manually deleted from DB, the DemoLead record still exists so re-running seed skips it — lead is gone permanently.
**Why it happens:** DemoLead guards by seedKey but doesn't verify the Lead still exists.
**How to avoid:** For now this is acceptable behavior (deletion is not a v1 feature). Document in the plan that idempotency is one-way: seed once, stays. If re-seeding is needed, truncate DemoLead table first.
**Warning signs:** Seed reports "already seeded" but /leads shows no seeded leads.

### Pitfall 6: Portfolio Home Page Grid Wrapping on Medium Screens
**What goes wrong:** The third card forces an odd layout on tablet screens (2+1 instead of 3 equal columns).
**Why it happens:** `md:grid-cols-2` gives 2 cols on tablet, making the third card full-width on md screens.
**How to avoid:** Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — this gives 1 column on mobile, 2 on tablet (AI SDR wraps below), 3 on desktop. Alternatively use `md:grid-cols-3` to always go 3-column starting at tablet. Either is acceptable — align with existing card widths.
**Warning signs:** On tablet viewport, AI SDR card is twice the width of TeamFlow/DevCollab.

### Pitfall 7: Coolify compose service for ai-sdr missing WEB_URL for CORS
**What goes wrong:** NestJS CORS is configured with `origin: process.env.WEB_URL || 'http://localhost:3000'`. In production, if WEB_URL is not set in Coolify env vars, CORS blocks the browser's SSE connection.
**Why it happens:** `main.ts` sets CORS origin from `WEB_URL`. Without it, localhost:3000 is used — which will be blocked by the browser from a production domain.
**How to avoid:** Add `WEB_URL=https://ai-sdr.fernandomillan.me` to the Coolify environment for the api service.
**Warning signs:** Browser console shows CORS policy error on EventSource or fetch to the API.

---

## Code Examples

Verified patterns from codebase:

### Qualifying Lead Content Shape (matches QualifySchema)
```typescript
// Source: ai-sdr/src/claude/schemas/qualify.schema.ts
const qualifyContent = {
  icpScore: 87,
  reasoning: 'Acme FinTech is a 150-person Series B company selling to mid-market financial institutions, which maps strongly to our ICP of SaaS companies with 50-500 employees and revenue >$5M. Their primary pain points (manual reporting, compliance workflows) align directly with our automation capabilities.',
  matchedCriteria: [
    'SaaS business model',
    'Mid-market company size (50-500 employees)',
    'Active sales team (VP Sales role confirmed)',
    'Known pain point in workflow automation',
  ],
  weakCriteria: [
    'No clear data on current tech stack compatibility',
    'Regulatory compliance requirements may extend sales cycle',
  ],
};
```

### Enrichment Content Shape (matches EnrichSchema)
```typescript
// Source: ai-sdr/src/claude/schemas/enrich.schema.ts
const enrichContent = {
  companySize: '100-200 employees',
  industry: 'FinTech SaaS',
  techStack: ['Salesforce', 'HubSpot', 'AWS', 'React', 'Node.js'],
  painPoints: [
    'Manual compliance reporting consuming 20+ hours per week',
    'Sales CRM data hygiene requires dedicated ops resources',
    'Lack of automated lead scoring causing rep inefficiency',
  ],
};
```

### Personalize Email Content Shape (matches PipelineService output)
```typescript
// Source: ai-sdr/src/pipeline/pipeline.service.ts line 77
// Content stored as: { email: emailBody }
const personalizeContent = {
  email: `Hi Sarah,

I noticed Acme FinTech recently closed your Series B — congratulations on the milestone.

At companies your size in the FinTech space, we typically see two pain points emerge right after a funding round: the manual compliance reporting burden grows faster than headcount, and the sales team gets stuck doing their own lead research instead of closing deals.

I built an AI SDR tool that automates both: it qualifies leads against your ICP in seconds and generates personalized outreach that references company-specific context — not generic templates.

Worth a 20-minute conversation to see if there's a fit? I can show you how it handles FinTech compliance language specifically.

Best,
Fernando`,
};
```

### Seed Script Run Command (add to package.json)
```json
// ai-sdr/package.json scripts section
{
  "db:seed": "ts-node scripts/seed.ts"
}
```

### Portfolio Case Study WalkthroughScreenshot Data Pattern
```typescript
// Source: apps/web/src/data/walkthrough-data.ts pattern (TeamFlow + DevCollab)
export const AI_SDR_WALKTHROUGH_SCREENSHOTS: WalkthroughScreenshot[] = [
  {
    src: '/screenshots/ai-sdr-leads.png',
    width: 1280,
    height: 800,
    alt: 'AI SDR leads dashboard showing a table of 8 pre-seeded leads with ICP score bars ranging from 22 to 92',
    steps: [
      {
        label: 'ICP Score Bars',
        explanation: 'Color-coded bars show qualification fit at a glance — green (70+), amber (40-69), red (<40).',
      },
      {
        label: 'Pre-Seeded Leads',
        explanation: 'Demo leads span FinTech, Healthcare, DevTools, and Logistics — showing the full score spectrum immediately after login.',
      },
    ],
  },
  // ... more screenshots
];
```

### CI/CD Job for ai-sdr Images (deploy.yml extension)
```yaml
# Add to .github/workflows/deploy.yml
build-and-push-ai-sdr:
  name: Build and Push AI SDR Docker Images
  runs-on: ubuntu-latest
  needs: [test]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    - name: Login to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - name: Build and push ai-sdr-api image
      uses: docker/build-push-action@v5
      with:
        context: ./ai-sdr
        file: ./ai-sdr/Dockerfile
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/ai-sdr-api:latest
          ghcr.io/${{ github.repository }}/ai-sdr-api:${{ github.sha }}
        cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/ai-sdr-api:latest
        cache-to: type=inline
    - name: Build and push ai-sdr-web image
      uses: docker/build-push-action@v5
      with:
        context: ./ai-sdr/web
        file: ./ai-sdr/web/Dockerfile
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/ai-sdr-web:latest
          ghcr.io/${{ github.repository }}/ai-sdr-web:${{ github.sha }}
        build-args: |
          NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_AI_SDR_API_URL }}
        cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/ai-sdr-web:latest
        cache-to: type=inline

deploy-ai-sdr:
  name: Deploy AI SDR to Coolify
  runs-on: ubuntu-latest
  needs: build-and-push-ai-sdr
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Trigger AI SDR API deployment
      run: |
        curl --request GET "${{ secrets.COOLIFY_AI_SDR_API_WEBHOOK_URL }}" \
          --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
    - name: Trigger AI SDR Web deployment
      run: |
        curl --request GET "${{ secrets.COOLIFY_AI_SDR_WEB_WEBHOOK_URL }}" \
          --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Seed via `prisma db seed` (package.json prisma.seed field) | Standalone `ts-node scripts/seed.ts` invoked via npm script | DevCollab established this pattern | More explicit, controllable from Docker CMD, no Prisma CLI version coupling |
| X-Accel-Buffering set in Nginx config | X-Accel-Buffering: no response header set per-route in NestJS | Nginx 1.1.4+ | Per-response header overrides buffering without server config changes — zero-config Nginx |
| Next.js NEXT_PUBLIC_ vars at runtime | Next.js NEXT_PUBLIC_ vars at build time (baked into bundle) | Next.js 13+ | Static replacement in client bundle — must be Docker ARG during image build |
| monorepo Turborepo prune for Docker | Standalone directory Docker build (context: ./ai-sdr) | Phase 41 decision | ai-sdr is standalone (STATE.md decision 41-01) — no turbo prune needed, simpler Dockerfile |

---

## Open Questions

1. **What is the deployed domain for AI SDR?**
   - What we know: TeamFlow is at `teamflow.fernandomillan.me`, DevCollab is at a Coolify-managed domain. The pattern is `[project].fernandomillan.me`.
   - What's unclear: The exact subdomain for ai-sdr-api and ai-sdr-web haven't been set in Coolify yet.
   - Recommendation: Plan 46-02 assumes `ai-sdr.fernandomillan.me` (web) and `ai-sdr-api.fernandomillan.me` (api). These must be configured in Coolify before the portfolio `PORT-03` live demo link can be set in the case study page. PORT-03 depends on 46-02 completing successfully.

2. **Should the seed run in a one-shot Docker container like DevCollab, or via `prisma migrate deploy` script extension?**
   - What we know: DevCollab uses a separate `devcollab-seed` Docker service in `coolify-compose.yml` that runs after `devcollab-migrate` completes. The ai-sdr Dockerfile already runs `prisma migrate deploy` in CMD — the seed cannot be added there (blocking server start).
   - What's unclear: Whether to add a seed service to `ai-sdr/docker-compose.yml` or run seed as a post-deployment step via Coolify's "run before deploy" hooks.
   - Recommendation: Follow the DevCollab pattern — add an `ai-sdr-seed` service to the Coolify compose that depends on `api` being healthy. This is the cleanest separation. The seed service is `restart: "no"` so it runs once.

3. **Can the ai-sdr web Dockerfile use standalone mode without the turbo prune pattern?**
   - What we know: `ai-sdr/web` is a standalone Next.js app (not in a Turborepo workspace with other packages). `output: 'standalone'` is already configured in `next.config.ts`. The build context would be `./ai-sdr/web` — a self-contained directory.
   - What's unclear: Whether `COPY . .` in the Dockerfile will correctly handle all local dependencies.
   - Recommendation: HIGH confidence this works. The standalone app has its own `package.json` and `node_modules`. No turbo prune is needed. Build context is `./ai-sdr/web`.

4. **Does the `test` job in deploy.yml need updating for ai-sdr?**
   - What we know: The current `test` job runs TeamFlow-specific tests. It does not run ai-sdr tests. The `build-and-push-ai-sdr` job `needs: [test]` — it gates on test passing.
   - What's unclear: Whether a separate test step for ai-sdr should be added (there are no jest/vitest tests in ai-sdr currently — only validate scripts in prisma/).
   - Recommendation: The `build-and-push-ai-sdr` job can `needs: [test]` to inherit existing test gate, or it can run independently. Since ai-sdr has no automated tests yet, gating on the existing test job is acceptable — it validates the whole repo build passes before pushing ai-sdr images.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` (workflow has: research, plan_check, verifier). Skipping automated test mapping.

**Manual verification strategy:**
```bash
# DEMO-01 + DEMO-02: Verify seed data in Postgres
DATABASE_URL=postgresql://aisdr:aisdr@localhost:5436/aisdr \
  npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.lead.findMany({ include: { aiOutputs: true } }).then(leads => {
  console.log('Leads:', leads.length);
  leads.forEach(l => console.log(l.companyName, l.icpScore, l.status, l.aiOutputs.map(o => o.step)));
}).finally(() => p.\$disconnect());
"
# Expected: 6-8 leads, all status 'complete', each with 3 AIOutput rows (qualify, enrich, personalize)

# DEMO-01 score spectrum check
# Verify min score <= 22 and max score >= 87 across all seeded leads

# PORT-01: Portfolio home page shows AI SDR card
# Manual: Visit https://fernandomillan.me — confirm 3 project cards visible

# PORT-02: Case study page renders
# Manual: Visit https://fernandomillan.me/projects/ai-sdr — verify tech stack badges, architecture table, screenshots visible

# PORT-03: Live demo link works
# Manual: Click "View Live Demo" on /projects/ai-sdr — confirm it navigates to ai-sdr.fernandomillan.me/login

# SSE streaming in production (success criteria 3)
curl -v https://ai-sdr-api.fernandomillan.me/leads/{leadId}/stream 2>&1 | grep -i "x-accel"
# Expected: < x-accel-buffering: no
```

---

## Sources

### Primary (HIGH confidence)
- `/home/doctor/fernandomillan/ai-sdr/prisma/schema.prisma` — Lead, AIOutput, DemoLead, EmailSequence models verified directly. DemoLead.seedKey @unique confirmed. AIOutput.content is Json (accepts hand-authored objects). Lead.status enum has 'complete' value.
- `/home/doctor/fernandomillan/ai-sdr/src/pipeline/pipeline.service.ts` — Step constants: `STEP_QUALIFY = 'qualify'`, `STEP_ENRICH = 'enrich'`, `STEP_PERSONALIZE = 'personalize'`. Personalize output stored as `{ email: emailBody }` (line 77).
- `/home/doctor/fernandomillan/ai-sdr/src/claude/schemas/qualify.schema.ts` — QualifyOutput shape: icpScore (Int), reasoning (String), matchedCriteria (String[]), weakCriteria (String[]).
- `/home/doctor/fernandomillan/ai-sdr/src/claude/schemas/enrich.schema.ts` — EnrichOutput shape: companySize (String|null), industry (String|null), techStack (String[]), painPoints (String[]).
- `/home/doctor/fernandomillan/ai-sdr/src/leads/leads.controller.ts` — X-Accel-Buffering: no header confirmed set on line 61 of stream() method.
- `/home/doctor/fernandomillan/ai-sdr/web/next.config.ts` — `output: 'standalone'` confirmed. Enables standalone Docker pattern.
- `/home/doctor/fernandomillan/ai-sdr/web/lib/api.ts` — `API_URL` is server-side only. `NEXT_PUBLIC_API_URL` is the env var used in pipeline-monitor.tsx for client EventSource.
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/page.tsx` — Current 2-column grid pattern confirmed. Must add 3rd card (AI SDR).
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/teamflow/page.tsx` — Full case study pattern: CaseStudySection, WalkthroughSection, Button with ExternalLink, back link, tech stack, architecture decisions table, challenges section.
- `/home/doctor/fernandomillan/apps/web/src/data/walkthrough-data.ts` — WalkthroughScreenshot format confirmed. Pattern for AI_SDR_WALKTHROUGH_SCREENSHOTS is clear.
- `/home/doctor/fernandomillan/.github/workflows/deploy.yml` — Existing CI/CD pattern: test → build-and-push → deploy jobs. GHCR tags, Coolify webhook triggers. Pattern directly reusable for ai-sdr.
- `/home/doctor/fernandomillan/coolify-compose.yml` — DevCollab deployment pattern: separate seed service with `restart: "no"` depending on migrate service.
- `/home/doctor/fernandomillan/packages/devcollab-database/prisma/seed.ts` — Idempotency guard pattern: `findUnique({ where: { email } })` before inserting. Raw PrismaClient (not NestJS injectable).
- `.planning/STATE.md` — Key decisions: DemoLead.seedKey @unique, no live scraping in demo, X-Accel-Buffering: no required for Coolify SSE, screenshots in apps/web/public/screenshots at 1280x800.

### Secondary (MEDIUM confidence)
- DevCollab Dockerfile.seed pattern — Turbo prune + manual copy of seed package. For ai-sdr (standalone, no turbo), this is simpler: direct COPY of scripts/ directory.

### Tertiary (LOW confidence)
- Coolify domain naming convention `[project].fernandomillan.me` — inferred from TeamFlow URL in case study page. Actual subdomain for ai-sdr must be confirmed during plan execution.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in package.json, no new dependencies required (except optional faker)
- Architecture: HIGH — seed pattern verified against DevCollab seed, Prisma schema verified directly, portfolio pattern verified against existing case studies, Dockerfile standalone pattern confirmed via next.config.ts
- Pitfalls: HIGH — status/complete seed pitfall, NEXT_PUBLIC_ build-time pitfall, step constant names, and personalize content shape all verified against actual source files

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack: Prisma 5.x, Next.js 16.x, NestJS 11.x, Tailwind 4.x)
