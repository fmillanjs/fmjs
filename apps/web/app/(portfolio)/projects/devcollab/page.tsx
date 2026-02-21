import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseStudySection } from '@/components/portfolio/case-study-section';
import { AnimateIn } from '@/components/portfolio/animate-in';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github } from 'lucide-react';

const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'https://devcollab.fernandomillan.me';

export const metadata: Metadata = {
  title: 'DevCollab - Case Study',
  description:
    'A developer collaboration platform combining GitHub-style technical content with workspace organization. Features full-text search, threaded discussions, emoji reactions, and role-based access control.',
  openGraph: {
    title: 'DevCollab Case Study - Fernando Millan',
    description:
      'A full-stack SaaS built with Next.js 15, NestJS 11, Postgres tsvector search, and real-time notifications demonstrating production-ready engineering patterns.',
    type: 'article',
  },
};

export default function DevCollabCaseStudy() {
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
          DevCollab
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          A developer collaboration platform for teams
        </p>

        <div className="flex gap-4">
          <Button asChild>
            <a
              href={`${DEVCOLLAB_URL}/w/devcollab-demo`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Demo
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/fmillanjs/fmjs/tree/devcollab"
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
          DevCollab is a developer collaboration platform that combines GitHub-style
          technical content (code snippets with syntax highlighting, Markdown posts)
          with Discord-style workspace organization. Built as the centerpiece of my
          portfolio, it demonstrates production-ready full-stack engineering across
          seven phases of development.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">v2.0</div>
            <div className="text-sm text-muted-foreground">Production Ready</div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">7</div>
            <div className="text-sm text-muted-foreground">Feature Phases</div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">3</div>
            <div className="text-sm text-muted-foreground">Demo Roles</div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="font-semibold text-[var(--green-11)]">Features delivered:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Workspace-scoped RBAC (Admin / Contributor / Viewer)</li>
            <li>Code snippets with Shiki syntax highlighting (20 languages)</li>
            <li>Markdown posts with Tiptap editor and Shiki server-side rendering</li>
            <li>Threaded discussions with @mention notifications</li>
            <li>Emoji reactions (thumbs up, heart, plus one, laugh)</li>
            <li>Real-time activity feed with cursor pagination</li>
            <li>Full-text search via Postgres tsvector (Cmd+K modal)</li>
            <li>Bell icon with unread badge and 60s notification polling</li>
          </ul>
        </div>
      </CaseStudySection>

      {/* Problem */}
      <CaseStudySection title="Problem">
        <p>
          Developer teams share code snippets and technical knowledge in scattered
          tools — GitHub Gists, Notion, Slack threads — with no unified workspace
          and no search across all content types. The challenge: build a cohesive
          platform that feels native to developers while demonstrating the full
          breadth of senior full-stack skills in a single deployed application.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
          <li>
            <strong>Code + prose in one place:</strong> Snippets need syntax highlighting
            and language selection; posts need rich Markdown rendering — different
            content types with different requirements.
          </li>
          <li>
            <strong>Workspace isolation:</strong> Teams must be hermetically isolated.
            Invites, role assignment, and content visibility must all be workspace-scoped.
          </li>
          <li>
            <strong>Search that works:</strong> Keyword search across snippets, posts,
            and titles without adding a second search service to the infrastructure.
          </li>
          <li>
            <strong>Recruiter demo UX:</strong> A recruiter visiting the live demo must
            immediately see realistic content, not an empty state.
          </li>
        </ul>
      </CaseStudySection>

      {/* Architecture */}
      <CaseStudySection title="Architecture">
        <p>
          DevCollab lives inside the same Turborepo monorepo as TeamFlow, sharing
          infrastructure tooling while maintaining complete isolation at the application
          level.
        </p>

        <div className="bg-muted border border-border rounded-lg p-6 my-6">
          <div className="font-mono text-sm space-y-2">
            <div>Browser (Next.js 15 Client)</div>
            <div className="ml-4">↓ HTTP (Cmd+K search, reactions, notifications)</div>
            <div>devcollab-web — Next.js 15 App Router (port 3002)</div>
            <div className="ml-4">↓ REST API (httpOnly cookie auth)</div>
            <div>devcollab-api — NestJS 11 (port 3003)</div>
            <div className="ml-4">↓ Prisma ORM</div>
            <div>devcollab-postgres — Postgres 16 (port 5435)</div>
            <div className="ml-8 text-muted-foreground">tsvector GIN indexes (FTS)</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <strong className="block mb-2">Monorepo Structure:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">apps/devcollab-web</code>
                {' '}— Next.js 15 frontend with App Router and Server Components
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">apps/devcollab-api</code>
                {' '}— NestJS 11 with CASL deny-by-default guard
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">packages/devcollab-database</code>
                {' '}— Isolated Prisma schema and generated client
              </li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Client isolation pattern:</strong>
            <p className="text-sm text-muted-foreground">
              The Prisma client outputs to{' '}
              <code className="bg-muted px-1 rounded">node_modules/.prisma/devcollab-client</code>
              {' '}— a completely separate path from TeamFlow&apos;s{' '}
              <code className="bg-muted px-1 rounded">@prisma/client</code>.
              Both apps can coexist in the same monorepo without client collision.
            </p>
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
                  <strong>Postgres tsvector over Meilisearch</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">for full-text search</span>
                </td>
                <td className="py-3 px-4">
                  Zero additional Docker service. Adequate at portfolio scale. The trigger
                  pattern (not GENERATED ALWAYS AS) eliminates Prisma migration drift —
                  a well-known pitfall. ts_headline() provides highlighted results for free.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Tiptap v3 with immediatelyRender: false</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">for Markdown editing</span>
                </td>
                <td className="py-3 px-4">
                  Tiptap v3 + Next.js 15 App Router SSR has hydration edge cases.
                  Setting immediatelyRender: false prevents mismatches. Validated with
                  next build + next start before merge — not just dev mode.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Dedicated migrate Docker service</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">vs. migrate-on-start</span>
                </td>
                <td className="py-3 px-4">
                  Running prisma migrate deploy inside the API container causes race
                  conditions when multiple replicas start simultaneously. A separate
                  one-shot service with service_completed_successfully dependency
                  guarantees exactly-once migration execution.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>CASL deny-by-default guard</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">as APP_GUARD</span>
                </td>
                <td className="py-3 px-4">
                  Installed before any feature controllers existed. Every new endpoint
                  starts locked until explicitly granted. Eliminates the &quot;forgot to
                  add auth&quot; class of security bugs at the architectural level.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Shiki server-side for published posts</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">vs. client highlight</span>
                </td>
                <td className="py-3 px-4">
                  MarkdownRenderer is a Server Component. Shiki runs server-side via a
                  singleton lazy-initialized highlighter. Zero client JS for code
                  highlighting on published post views — improves performance and
                  demonstrates SSR depth.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CaseStudySection>

      {/* Challenges & Solutions */}
      <CaseStudySection title="Challenges & Solutions">
        <div className="space-y-6">
          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 1: Prisma Migration Drift with tsvector
            </h3>
            <p className="mb-2">
              Using GENERATED ALWAYS AS on Prisma schema fields causes the migration
              engine to regenerate the column definition on every{' '}
              <code className="text-sm bg-muted px-1 rounded">prisma migrate dev</code> run,
              producing drift warnings that would corrupt the migration history on a team.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Store the tsvector column definition in a
              raw trigger function (not in the Prisma schema). The trigger maintains the
              column; Prisma simply ignores it. GIN indexes live in manual migration SQL.
              Verified with a x3 migrate dev ritual — zero drift on all three runs.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Postgres-specific features (tsvector, GIN) belong
              in manual migration SQL when using Prisma. The Prisma schema should only
              contain what Prisma natively understands.
            </p>
          </div>

          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 2: CASL Guard with Workspace-Scoped Routes
            </h3>
            <p className="mb-2">
              The deny-by-default CaslAuthGuard needs to extract the workspace slug
              from the request URL to build the correct CASL ability. Routes without
              a slug (like /health, /auth/login) must bypass the workspace-scoped check.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> The guard extracts :slug from request.params.
              If slug is absent, it falls through to the service layer for authorization.
              Workspace-scoped routes always include the slug as the first path segment:
              /workspaces/:slug/snippets.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Route design choices (slug in path vs. header)
              have downstream effects on the entire auth architecture. Making the
              decision early (Phase 14) kept all subsequent controllers consistent.
            </p>
          </div>

          <div className="border-l-4 border-[var(--matrix-green-border)] pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 3: Next.js Server Components and httpOnly Cookie Forwarding
            </h3>
            <p className="mb-2">
              Server Components cannot use credentials: &apos;include&apos; for cross-origin
              fetches — the browser is not involved in SSR. Cookies must be forwarded
              manually from the incoming request to the outgoing API call.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Server Components use{' '}
              <code className="text-sm bg-muted px-1 rounded">next/headers cookies()</code>{' '}
              to read the current request cookies and forward them in the Authorization
              or Cookie header of the API fetch. Client Components use{' '}
              <code className="text-sm bg-muted px-1 rounded">credentials: &apos;include&apos;</code>{' '}
              as usual.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> SSR authentication requires explicit cookie
              forwarding. The Next.js 15 App Router pattern is different enough from
              Pages Router that it warrants its own mental model.
            </p>
          </div>
        </div>
      </CaseStudySection>

      {/* Results */}
      <CaseStudySection title="Results">
        <div className="grid md:grid-cols-2 gap-6 mt-2">
          <div>
            <h3 className="font-semibold mb-3">Features Delivered</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>JWT auth with separate secret from TeamFlow</li>
              <li>Workspace CRUD + invite-link flow</li>
              <li>Admin / Contributor / Viewer RBAC</li>
              <li>Code snippets (20 languages, Shiki highlighting)</li>
              <li>Markdown posts (Tiptap editor + SSR rendering)</li>
              <li>Threaded comments on snippets and posts</li>
              <li>Emoji reactions with race condition guard</li>
              <li>@mention notifications with bell badge</li>
              <li>Activity feed with cursor pagination</li>
              <li>Full-text search with Cmd+K modal</li>
              <li>Deterministic seed data for demo workspace</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Technologies</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Next.js 15 App Router + Server Components</li>
              <li>NestJS 11 with CASL RBAC</li>
              <li>TypeScript full-stack</li>
              <li>PostgreSQL 16 + Prisma ORM</li>
              <li>Postgres tsvector full-text search</li>
              <li>Tiptap v3 rich text editor</li>
              <li>Shiki syntax highlighting</li>
              <li>Docker + Turborepo monorepo</li>
              <li>@faker-js/faker deterministic seed</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg">
          <h3 className="font-semibold mb-2">Try the Demo</h3>
          <p className="mb-4">
            The demo workspace is pre-seeded with realistic content. Log in with any
            of three role accounts to explore the full feature set:
          </p>
          <ul className="text-sm space-y-1 mb-4">
            <li>
              <strong>Admin:</strong>{' '}
              <code className="bg-card px-2 py-1 rounded">admin@demo.devcollab</code>
              {' '}/ <code className="bg-card px-2 py-1 rounded">Demo1234!</code>
            </li>
            <li>
              <strong>Contributor:</strong>{' '}
              <code className="bg-card px-2 py-1 rounded">contributor@demo.devcollab</code>
              {' '}/ <code className="bg-card px-2 py-1 rounded">Demo1234!</code>
            </li>
            <li>
              <strong>Viewer:</strong>{' '}
              <code className="bg-card px-2 py-1 rounded">viewer@demo.devcollab</code>
              {' '}/ <code className="bg-card px-2 py-1 rounded">Demo1234!</code>
            </li>
          </ul>
          <Button asChild>
            <a
              href={`${DEVCOLLAB_URL}/w/devcollab-demo`}
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
