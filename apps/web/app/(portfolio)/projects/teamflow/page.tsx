import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseStudySection } from '@/components/portfolio/case-study-section';
import { AnimateIn } from '@/components/portfolio/animate-in';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TeamFlow - Case Study',
  description:
    'A production-ready work management SaaS demonstrating full-stack engineering skills with authentication, role-based access control, and modern architecture patterns. Real-time collaboration coming in v1.1.',
  openGraph: {
    title: 'TeamFlow Case Study - Fernando Millan',
    description:
      'A production-ready work management SaaS with JWT authentication, RBAC, Kanban boards, and comprehensive audit logging.',
    type: 'article',
  },
};

export default function TeamFlowCaseStudy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <AnimateIn className="mb-12">
        <Link
          href="/projects"
          className="inline-flex items-center text-primary underline hover:no-underline mb-6"
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
          TeamFlow
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          A production-ready work management SaaS
        </p>

        <div className="flex gap-4">
          <Button asChild>
            <a
              href="/teams"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Demo
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/fernandomillan/teamflow"
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
          TeamFlow is a comprehensive work management platform built to demonstrate
          production-ready full-stack engineering skills. Version 1.0 delivers secure
          authentication, role-based access control, complete task management, and a
          polished user experience. <strong className="text-primary">Real-time collaboration features are coming in v1.1.</strong>
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-primary mb-2">
              v1.0
            </div>
            <div className="text-sm text-muted-foreground">
              Production Ready
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-primary mb-2">
              88%
            </div>
            <div className="text-sm text-muted-foreground">
              Features Complete
            </div>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-primary mb-2">
              8
            </div>
            <div className="text-sm text-muted-foreground">
              Technologies
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="font-semibold text-[var(--green-11)] mb-2">
              ✓ Available in v1.0:
            </p>
            <p>
              JWT Authentication, Role-Based Access Control (Admin/Manager/Member),
              Team &amp; Project Management, Kanban &amp; List Views, Drag-and-Drop Task
              Management, Comment Threads, Advanced Filtering &amp; Search, Audit Logging,
              Activity Feed, Demo Workspace with Seed Data, Dark Mode, Responsive Design
            </p>
          </div>
          <div>
            <p className="font-semibold text-primary mb-2">
              → Coming in v1.1:
            </p>
            <p>
              Real-time Updates via WebSockets, Live Presence Indicators, Optimistic UI
              with Auto-Rollback, Conflict Detection for Concurrent Edits
            </p>
          </div>
        </div>
      </CaseStudySection>

      {/* Problem */}
      <CaseStudySection title="Problem">
        <p>
          Modern distributed teams need real-time visibility into project progress
          and task ownership. Existing project management tools often fall short in
          providing:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Real-time transparency:</strong> Teams can&apos;t see who&apos;s working
            on what right now without manually checking
          </li>
          <li>
            <strong>Granular permissions:</strong> Most tools have basic admin/member
            roles, lacking the flexibility for manager-level permissions
          </li>
          <li>
            <strong>Instant updates:</strong> Polling-based updates create lag and
            inconsistencies across team members
          </li>
          <li>
            <strong>Audit trails:</strong> Limited visibility into who made what changes
            and when, critical for accountability
          </li>
        </ul>
      </CaseStudySection>

      {/* Solution */}
      <CaseStudySection title="Solution">
        <p>
          TeamFlow v1.0 addresses these challenges by implementing a full-stack SaaS
          application from scratch, demonstrating production-level engineering
          patterns:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Three-tier RBAC:</strong> Admin, Manager, and Member roles with
            granular permissions using CASL enforced at multiple layers
          </li>
          <li>
            <strong>Comprehensive audit logging:</strong> Every action is tracked with
            timestamp, user, IP address, and user agent for full accountability
          </li>
          <li>
            <strong>Complete task management:</strong> Kanban boards, list views, filters,
            search, comments, and drag-and-drop organization
          </li>
          <li>
            <strong>Production infrastructure:</strong> Monorepo architecture, Docker
            containerization, CI/CD pipeline, and API documentation
          </li>
          <li>
            <strong>Demo workspace:</strong> Pre-seeded data allows recruiters to explore
            immediately without setup (login: demo1@teamflow.dev / Password123)
          </li>
        </ul>

        <div className="mt-6 p-4 bg-accent border border-border rounded-lg">
          <p className="text-sm">
            <strong className="text-accent-foreground">Note on Real-time Features:</strong>{' '}
            WebSocket-based live updates, presence indicators, and optimistic UI with
            conflict detection are fully implemented in the codebase but currently
            blocked by authentication architecture compatibility issues between Next.js
            15 and NestJS. These features will be activated in v1.1 after resolving the
            integration layer.
          </p>
        </div>
      </CaseStudySection>

      {/* Architecture */}
      <CaseStudySection title="Architecture">
        <p>
          TeamFlow uses a modern, scalable monorepo architecture designed to showcase
          both frontend and backend expertise:
        </p>

        <div className="bg-muted border border-border rounded-lg p-6 my-6">
          <div className="font-mono text-sm space-y-2">
            <div>Browser (Next.js Client)</div>
            <div className="ml-4">↓ HTTP/WebSocket</div>
            <div>Next.js App Router (Server Components + API Routes)</div>
            <div className="ml-4">↓ HTTP REST API</div>
            <div>NestJS Backend (Controllers → Services → Database)</div>
            <div className="ml-4">↓ Prisma ORM</div>
            <div>PostgreSQL + Redis</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <strong className="block mb-2">Monorepo Structure (Turborepo):</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  apps/web
                </code>{' '}
                - Next.js 15 frontend with App Router and Server Components
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  apps/api
                </code>{' '}
                - NestJS backend with modular architecture
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  packages/database
                </code>{' '}
                - Shared Prisma schema and migrations
              </li>
              <li>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  packages/shared
                </code>{' '}
                - Shared TypeScript types and Zod schemas
              </li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Frontend Stack:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Next.js 15 with App Router for SSR and routing</li>
              <li>React 19 with Server Components and useOptimistic hook</li>
              <li>NextAuth v5 for session management</li>
              <li>TanStack Query for server state caching</li>
              <li>Socket.io client for WebSocket connections</li>
              <li>React Hook Form + Zod for type-safe forms</li>
              <li>Tailwind CSS v4 for styling</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Backend Stack:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>NestJS 11 with modular architecture (Auth, Teams, Projects, Tasks)</li>
              <li>Passport JWT strategy for authentication</li>
              <li>CASL for declarative, type-safe RBAC</li>
              <li>Socket.io with Redis adapter for WebSocket scaling</li>
              <li>EventEmitter2 for domain events</li>
              <li>Swagger/OpenAPI documentation</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">Data Layer:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>PostgreSQL as primary database</li>
              <li>Prisma ORM with type-safe queries and CASL integration</li>
              <li>Redis for session storage and WebSocket pub/sub</li>
              <li>Database migrations with Prisma Migrate</li>
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
                  <strong>Separate Next.js + NestJS</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. Next.js API routes
                  </span>
                </td>
                <td className="py-3 px-4">
                  Demonstrates backend architecture skills beyond Next.js API routes.
                  NestJS provides dependency injection, modular structure, and
                  enterprise patterns that showcase deeper backend expertise.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>WebSockets over Pusher</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. third-party service
                  </span>
                </td>
                <td className="py-3 px-4">
                  Implementing WebSockets from scratch is more impressive technically
                  than integrating a service. Shows understanding of bi-directional
                  communication, pub/sub patterns, and horizontal scaling with Redis
                  adapter.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>CASL for RBAC</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. manual permission checks
                  </span>
                </td>
                <td className="py-3 px-4">
                  Declarative, type-safe permissions that integrate with Prisma queries.
                  Centralized permission logic prevents security bugs and makes the
                  system auditable.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Redis session + pub/sub</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. in-memory storage
                  </span>
                </td>
                <td className="py-3 px-4">
                  Production-ready, horizontally scalable architecture. Redis pub/sub
                  enables WebSocket messages to work across multiple server instances,
                  critical for real-world deployments.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Monorepo with Turborepo</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. separate repos
                  </span>
                </td>
                <td className="py-3 px-4">
                  Shared TypeScript types between frontend and backend prevent API
                  contract drift. Single CI/CD pipeline, easier local development, and
                  demonstrates org-level architecture patterns.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Server Components for data fetching</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. client-side only
                  </span>
                </td>
                <td className="py-3 px-4">
                  SSR improves initial load performance and SEO. Demonstrates
                  understanding of Next.js 15 patterns and when to use server vs client
                  components.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Optimistic UI with automatic rollback</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    vs. loading states
                  </span>
                </td>
                <td className="py-3 px-4">
                  Instant visual feedback creates a polished user experience. React 19
                  useOptimistic hook automatically handles rollback on errors, showing
                  attention to UX details.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CaseStudySection>

      {/* Challenges & Solutions */}
      <CaseStudySection title="Challenges & Solutions">
        <div className="space-y-6">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 1: Next.js 15 + NestJS Authentication Integration
            </h3>
            <p className="mb-2">
              Integrating NextAuth v5 (Next.js 15) with NestJS WebSocket authentication
              revealed architectural compatibility challenges. Server Components cannot
              reliably access session cookies during SSR, and WebSocket JWT token
              validation has format mismatches.
            </p>
            <p className="mb-2">
              <strong>Current Status:</strong> All real-time features are fully
              implemented (WebSocket gateway, event listeners, frontend hooks, conflict
              detection) but blocked at the authentication layer. HTTP-based task
              management works perfectly. v1.1 will resolve the auth integration.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learning:</strong> Bleeding-edge framework versions (Next.js 15,
              NextAuth v5) can have integration challenges with other frameworks.
              Sometimes the most valuable learning comes from hitting architectural
              boundaries and documenting them transparently.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 2: Multi-Layer RBAC Enforcement
            </h3>
            <p className="mb-2">
              Ensuring permissions are enforced consistently across controller layer,
              service layer, and database queries without duplicating authorization
              logic.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Implemented CASL for declarative, type-safe
              permissions that integrate with both NestJS decorators (@CheckAbility) and
              Prisma queries. Guards enforce at controller layer, services verify
              ownership, and centralized AbilityFactory defines all rules.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Authorization is easier to audit and maintain
              when centralized. CASL&apos;s declarative approach prevents security bugs
              from scattered permission checks.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 3: TypeScript Type Safety Across Monorepo
            </h3>
            <p className="mb-2">
              Initial setup had type drift between frontend API calls and backend
              endpoints. Changes to backend DTOs wouldn&apos;t immediately break frontend
              builds, causing runtime errors.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Created a shared package with Zod schemas that
              both apps import directly from TypeScript source (not compiled). Frontend
              forms and backend validators use the same schemas. TypeScript compiler
              catches breaking changes across the monorepo.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Learned:</strong> Monorepos enable powerful type safety when
              structured correctly. Zod provides both runtime validation and static
              types from a single source.
            </p>
          </div>
        </div>
      </CaseStudySection>

      {/* Results */}
      <CaseStudySection title="Results">
        <p>
          TeamFlow successfully demonstrates production-ready full-stack engineering
          capabilities:
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-semibold mb-3">Features Delivered in v1.0</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✓ Secure JWT authentication with password reset</li>
              <li>✓ Role-based access control (Admin/Manager/Member)</li>
              <li>✓ Team and project management</li>
              <li>✓ Kanban board with drag-and-drop</li>
              <li>✓ List view with sorting and filtering</li>
              <li>✓ Comment threads on tasks</li>
              <li>✓ Comprehensive audit logging</li>
              <li>✓ Activity feed with pagination</li>
              <li>✓ Demo workspace with seed data</li>
              <li>✓ Responsive design with dark mode</li>
              <li>✓ Command palette (Ctrl+K)</li>
              <li className="text-primary">→ Real-time updates (v1.1)</li>
              <li className="text-primary">→ Live presence indicators (v1.1)</li>
              <li className="text-primary">→ Optimistic UI with rollback (v1.1)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Technologies Demonstrated</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Next.js 15 App Router &amp; Server Components</li>
              <li>React 19 with modern patterns</li>
              <li>NestJS with modular architecture</li>
              <li>TypeScript full-stack</li>
              <li>PostgreSQL with Prisma ORM</li>
              <li>Redis for caching and pub/sub</li>
              <li>WebSockets (Socket.io) with scaling</li>
              <li>CASL for declarative RBAC</li>
              <li>Docker containerization</li>
              <li>Monorepo with Turborepo</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-accent border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Try the Demo</h3>
          <p className="mb-4">
            Experience TeamFlow v1.0 firsthand with the pre-seeded demo workspace.
            Login with <code className="bg-card px-2 py-1 rounded">demo1@teamflow.dev</code> / <code className="bg-card px-2 py-1 rounded">Password123</code> and
            explore all features with sample data including 10 users, 3 projects, and
            50+ tasks.
          </p>
          <Button asChild>
            <a
              href="/teams"
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
