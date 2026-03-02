import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseStudySection } from '@/components/portfolio/case-study-section';
import { AnimateIn } from '@/components/portfolio/animate-in';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github } from 'lucide-react';
import { WalkthroughSection } from '@/components/portfolio/walkthrough-section';
import { AI_SDR_WALKTHROUGH_SCREENSHOTS } from '@/src/data/walkthrough-data';

export const metadata: Metadata = {
  title: 'AI SDR - Case Study',
  description:
    'A production-ready AI Sales Development Representative system using the Claude API for lead qualification, CRM enrichment, and personalized cold email generation with real-time SSE streaming.',
  openGraph: {
    title: 'AI SDR Case Study - Fernando Millan',
    description:
      'AI-powered lead qualification, CRM enrichment, and email personalization with Claude structured outputs and SSE token streaming.',
    type: 'article',
  },
};

export default function AiSdrCaseStudy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <AnimateIn className="mb-12">
        <Link
          href="/projects"
          className="inline-flex items-center text-[var(--matrix-green)] underline hover:no-underline mb-6"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          AI SDR
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          AI-powered lead qualification, enrichment, and personalized email generation with real-time SSE streaming
        </p>

        <div className="flex gap-4">
          <Button asChild>
            <a
              href="https://ai-sdr.fernandomillan.me/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Demo
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/fmillanjs/fmjs"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-4 h-4" />
              View Source
            </a>
          </Button>
        </div>
      </AnimateIn>

      {/* Overview */}
      <CaseStudySection title="Overview">
        <p>
          AI SDR is a production-ready AI Sales Development Representative system built to demonstrate full-stack AI engineering skills. It uses the Claude API to qualify leads against an ICP rubric, enrich company profiles from public data, and generate personalized cold emails — all streamed in real time via Server-Sent Events. Eight pre-seeded leads with hand-authored AI outputs let recruiters explore the full feature set immediately with no setup.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              3
            </div>
            <div className="text-sm text-muted-foreground">
              Pipeline Steps
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              ICP
            </div>
            <div className="text-sm text-muted-foreground">
              Scoring
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              Live
            </div>
            <div className="text-sm text-muted-foreground">
              Streaming
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-semibold text-[var(--green-11)] mb-2">Features delivered:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Lead intake form creating records in PostgreSQL via NestJS REST API</li>
            <li>Three-step AI pipeline: qualify (ICP scoring) → enrich (company research) → personalize (email generation)</li>
            <li>Real-time pipeline progress via Server-Sent Events (SSE) streamed from NestJS to Next.js</li>
            <li>ICP ScoreCard with color-coded horizontal bar (green / amber / red) and numeric score</li>
            <li>Why This Score accordion showing matched ICP criteria and weak criteria bullets</li>
            <li>Enrichment card surfacing company tech stack, funding stage, headcount, and pain points</li>
            <li>Streaming email preview — email tokens arrive in real time as Claude generates them</li>
            <li>One-click copy to clipboard for the generated cold email</li>
            <li>Pre-seeded demo with 8 hand-authored leads across FinTech, Healthcare, DevTools, and Logistics</li>
            <li>Global rate limiting (ThrottlerGuard) with per-endpoint overrides</li>
            <li>Docker + Coolify deployment with X-Accel-Buffering: no for SSE through Nginx</li>
          </ul>
        </div>

        <div className="mt-6">
          <p className="font-semibold text-[var(--green-11)] mb-3">Tech stack:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Next.js 16',
              'NestJS 11',
              'TypeScript',
              'Claude API',
              'Anthropic SDK',
              'Prisma',
              'PostgreSQL',
              'Docker',
              'Tailwind',
              'SSE',
            ].map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </CaseStudySection>

      {/* Problem */}
      <CaseStudySection title="Problem">
        <p>
          Sales Development Representatives spend the majority of their time on tasks that follow predictable patterns but require significant cognitive effort:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Manual lead qualification:</strong> Reps read every incoming lead against ICP criteria manually — a repeatable rubric that AI can apply consistently at scale.
          </li>
          <li>
            <strong>Company research overhead:</strong> Before writing an email, reps spend 15-30 minutes researching the company&apos;s funding stage, tech stack, and pain points across multiple sources.
          </li>
          <li>
            <strong>Generic outreach:</strong> Volume pressure leads to template-based emails that buyers ignore — personalization at scale is the core problem cold outreach has never solved well.
          </li>
          <li>
            <strong>Slow feedback loops:</strong> Reps submit leads and wait for batch processing results — no visibility into which step is running or how long it will take.
          </li>
        </ul>
      </CaseStudySection>

      {/* Solution */}
      <CaseStudySection title="Solution">
        <p>
          AI SDR replaces the three most time-consuming SDR tasks with a sequential AI pipeline that runs in real time and streams progress back to the user:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Qualify step:</strong> Claude scores the lead against a structured ICP rubric using Zod structured outputs at temperature 0 — deterministic, auditable scores every time.
          </li>
          <li>
            <strong>Enrich step:</strong> The pipeline scrapes the company website, extracts facts (tech stack, funding, headcount, pain points), and stores them as structured JSON for the next step.
          </li>
          <li>
            <strong>Personalize step:</strong> Claude writes a personalized cold email using enrichment context as input — company-specific facts, not templates. Email tokens stream to the UI in real time via SSE.
          </li>
          <li>
            <strong>Live progress indicators:</strong> Each step shows a spinner while running and a checkmark when complete — reps see exactly which step is in progress without polling.
          </li>
          <li>
            <strong>Pre-seeded demo data:</strong> Eight hand-authored leads with complete AI outputs load on first login so recruiters experience the full feature set instantly without waiting for live pipeline runs.
          </li>
        </ul>
      </CaseStudySection>

      {/* Architecture */}
      <CaseStudySection title="Architecture">
        <p>
          AI SDR uses a standalone two-app architecture — a Next.js 16 frontend and a NestJS 11 backend — deployed as separate Docker containers on Coolify. This proves the ability to architect either a standalone repo or a Turborepo monorepo depending on project requirements.
        </p>

        <div className="bg-muted border border-border rounded-lg p-6 my-6">
          <div className="font-mono text-sm space-y-2">
            <div>Browser (Next.js Client Components)</div>
            <div className="ml-4">↓ EventSource (SSE)</div>
            <div>Next.js App Router (RSC + Server Actions)</div>
            <div className="ml-4">↓ HTTP REST + SSE</div>
            <div>NestJS Backend (LeadsController → PipelineService)</div>
            <div className="ml-4">↓ Anthropic SDK</div>
            <div>Claude claude-sonnet-4-6 (qualify → enrich → personalize)</div>
            <div className="ml-4">↓ Prisma ORM</div>
            <div>PostgreSQL (Lead, AIOutput, DemoLead tables)</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <strong className="block mb-2">Standalone Repo Structure:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  ai-sdr/web/
                </code>{' '}
                — Next.js 16 frontend with App Router, Server Components, and Client Components for SSE
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  ai-sdr/api/
                </code>{' '}
                — NestJS 11 backend with modular architecture (LeadsModule, PipelineModule, ClaudeModule)
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  ai-sdr/api/prisma/
                </code>{' '}
                — Schema, migrations, and seed script — no shared packages required
              </li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Frontend Layer:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Next.js 16 App Router for SSR and routing</li>
              <li>Server Components for initial data fetch (leads list page)</li>
              <li>Client Components for SSE EventSource and clipboard API</li>
              <li>Server Actions for lead creation with revalidatePath</li>
              <li>Tailwind CSS with Radix Color tokens and Shadcn components</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Backend Layer:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>NestJS 11 with modular architecture (Auth, Leads, Pipeline, Claude)</li>
              <li>LeadsController: POST /leads (create), GET /leads (list), GET /leads/:id/pipeline (SSE)</li>
              <li>PipelineService: orchestrates qualify → enrich → personalize with StepCallback bridge</li>
              <li>ClaudeService: single abstraction for all Anthropic SDK calls (structured + streaming)</li>
              <li>Global ThrottlerGuard with per-route @Throttle decorators</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Data Layer:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>PostgreSQL on port 5436 (avoids conflict with teamflow:5434 and devcollab:5435)</li>
              <li>Prisma ORM with typed queries — Lead, AIOutput (step results), DemoLead (seed idempotency)</li>
              <li>DemoLead.seedKey @unique enables safe re-runs of the seed script without duplicates</li>
              <li>AIOutput stores step name + JSON result per lead — qualify and enrich use structured JSON, personalize stores email text</li>
            </ul>
          </div>
        </div>
      </CaseStudySection>

      {/* Key Technical Decisions */}
      <CaseStudySection title="Key Technical Decisions">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Decision</th>
                <th className="text-left py-3 px-4 font-semibold">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>SSE over WebSockets</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. bidirectional channel
                  </span>
                </td>
                <td className="py-3 px-4">
                  Unidirectional pipeline events (qualify→enrich→personalize) need no bidirectional channel. SSE is simpler, works through Nginx with X-Accel-Buffering: no, and has no reconnect complexity. Native browser EventSource handles reconnection automatically if needed.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Structured outputs (Zod + zodOutputFormat)</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. prompt-engineered JSON
                  </span>
                </td>
                <td className="py-3 px-4">
                  Qualify and enrich steps return typed JSON via Anthropic&apos;s native structured output. Temperature 0 ensures deterministic ICP scores across repeated calls for the same input — the ICP rubric is auditable and consistent.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Standalone repo (not Turborepo monorepo)</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. shared workspace packages
                  </span>
                </td>
                <td className="py-3 px-4">
                  AI SDR is fully self-contained to prove ability to architect either way. No shared packages, simpler Docker build context (<code className="text-sm bg-muted px-1 rounded">./ai-sdr</code>), and no turbo prune needed. Simpler CI/CD without workspace dependency graphs.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Pre-seeded demo data</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. live scraping on demand
                  </span>
                </td>
                <td className="py-3 px-4">
                  Live scraping fails 20-30% of sites and takes 45-90 seconds per lead. The seed script writes hand-authored AI outputs directly to Postgres so recruiters see a populated app immediately with zero latency and 100% reliability.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>In-process pipeline (no Redis/BullMQ)</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. distributed job queue
                  </span>
                </td>
                <td className="py-3 px-4">
                  Sequential steps (qualify → enrich → personalize) run synchronously in PipelineService. A callback bridge pattern connects StepCallback to an SSE Observable without any queue infrastructure — correct for single-user demo scale, simpler to reason about.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>NEXT_PUBLIC_API_URL as Docker build ARG</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. runtime ENV
                  </span>
                </td>
                <td className="py-3 px-4">
                  Next.js bakes <code className="text-sm bg-muted px-1 rounded">NEXT_PUBLIC_</code> variables into the client bundle during <code className="text-sm bg-muted px-1 rounded">next build</code>. Docker ARG passes the API URL at image build time — runtime ENV has no effect on client bundle, which would silently break the EventSource URL in Client Components.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CaseStudySection>

      {/* Challenges & Solutions */}
      <CaseStudySection title="Challenges &amp; Solutions">
        <div className="space-y-6">
          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 1: SSE Streaming Through Nginx Reverse Proxy
            </h3>
            <p className="mb-2">
              Nginx buffers SSE responses by default, delivering all tokens in a single batch at the end instead of incrementally. This breaks the real-time streaming experience — locally SSE appears to work (no proxy), but production fails silently.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Set <code className="bg-muted px-1.5 py-0.5 rounded text-sm">X-Accel-Buffering: no</code> as a per-request response header in NestJS (<code className="bg-muted px-1.5 py-0.5 rounded text-sm">leads.controller.ts</code>). Nginx 1.1.4+ honors this header per-connection without requiring server config changes — zero-config Coolify deployment.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Nginx buffering is silent — SSE appears to work locally but fails in production. The X-Accel-Buffering header is the correct solution; Nginx configuration changes would require Coolify infrastructure access that defeats the point of a managed platform.
            </p>
          </div>

          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 2: Observable/Callback Bridge for NestJS SSE
            </h3>
            <p className="mb-2">
              NestJS <code className="bg-muted px-1.5 py-0.5 rounded text-sm">@Sse()</code> expects an <code className="bg-muted px-1.5 py-0.5 rounded text-sm">Observable&lt;MessageEvent&gt;</code>, but the pipeline runs via async callbacks (StepCallback). Bridging the two without leaking Claude API connections on client disconnect was non-obvious.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Wrapped the pipeline in <code className="bg-muted px-1.5 py-0.5 rounded text-sm">new Observable&lt;MessageEvent&gt;(subscriber =&gt; ...)</code> and used a <code className="bg-muted px-1.5 py-0.5 rounded text-sm">closed</code> boolean flag plus <code className="bg-muted px-1.5 py-0.5 rounded text-sm">subscriber.closed</code> guard in the onStep callback to prevent &quot;Cannot call next on closed subscriber&quot; errors. Added <code className="bg-muted px-1.5 py-0.5 rounded text-sm">res.on(&apos;close&apos;, () =&gt; closed = true)</code> for explicit disconnect detection.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> The Observable/callback bridge pattern is the cleanest way to connect imperative async code to reactive streams in NestJS. The <code className="bg-muted px-1 rounded text-xs">closed</code> flag is essential — without it, a client disconnect during the email streaming step causes an unhandled error.
            </p>
          </div>

          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 3: Zod v4 + Anthropic Structured Outputs
            </h3>
            <p className="mb-2">
              The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">@anthropic-ai/sdk</code>&apos;s <code className="bg-muted px-1.5 py-0.5 rounded text-sm">zodOutputFormat()</code> calls <code className="bg-muted px-1.5 py-0.5 rounded text-sm">z.toJSONSchema()</code> which only exists in Zod v4+. Zod v3 (default install) causes a silent failure where the structured output schema is undefined, and the API call silently returns unstructured text.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Upgraded to <code className="bg-muted px-1.5 py-0.5 rounded text-sm">zod@4.3.6</code>. Also confirmed that <code className="bg-muted px-1.5 py-0.5 rounded text-sm">nullable()</code> (not <code className="bg-muted px-1.5 py-0.5 rounded text-sm">optional()</code>) must be used for optional EnrichOutput fields — Anthropic structured outputs require all fields in the JSON schema&apos;s <code className="bg-muted px-1.5 py-0.5 rounded text-sm">required</code> array; <code className="bg-muted px-1.5 py-0.5 rounded text-sm">optional()</code> would cause the API to reject the schema.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Structured output schema compatibility is fragile when mixing Zod versions. Pinning to <code className="bg-muted px-1 rounded text-xs">zod@^4.x</code> in package.json prevents silent schema failures. The <code className="bg-muted px-1 rounded text-xs">nullable()</code> vs <code className="bg-muted px-1 rounded text-xs">optional()</code> distinction is a non-obvious Anthropic API constraint.
            </p>
          </div>
        </div>
      </CaseStudySection>

      {/* App Walkthrough */}
      <WalkthroughSection title="App Walkthrough" screenshots={AI_SDR_WALKTHROUGH_SCREENSHOTS} />

      {/* Results */}
      <CaseStudySection title="Results">
        <p>
          AI SDR successfully demonstrates production-ready AI engineering capabilities across backend pipeline design, Claude API integration, and real-time streaming UX:
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              3
            </div>
            <div className="text-sm text-muted-foreground">
              Pipeline Steps (qualify → enrich → personalize)
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              Real-Time
            </div>
            <div className="text-sm text-muted-foreground">
              Response Time (SSE streaming)
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">
              Production
            </div>
            <div className="text-sm text-muted-foreground">
              Deployment
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg">
          <h3 className="font-semibold mb-2">Try the Demo</h3>
          <p className="mb-4">
            Demo credentials are shown on the login page. Log in to see 8 pre-seeded leads with ICP scores across industries. Submit a new lead to watch Claude qualify, enrich, and write a personalized email in real time.
          </p>
          <Button asChild>
            <a
              href="https://ai-sdr.fernandomillan.me/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Launch Demo
            </a>
          </Button>
        </div>
      </CaseStudySection>
    </div>
  );
}
