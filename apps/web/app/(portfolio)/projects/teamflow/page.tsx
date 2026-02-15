import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseStudySection } from '@/components/portfolio/case-study-section';
import { ExternalLink, Github } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TeamFlow - Case Study',
  description:
    'A production-ready work management SaaS demonstrating full-stack engineering skills with real-time collaboration, role-based access control, and modern architecture patterns.',
  openGraph: {
    title: 'TeamFlow Case Study - Fernando Millan',
    description:
      'A production-ready work management SaaS with real-time collaboration, RBAC, and WebSocket-based live updates.',
    type: 'article',
  },
};

export default function TeamFlowCaseStudy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <Link
          href="/projects"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
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

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          TeamFlow
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          A production-ready work management SaaS
        </p>

        <div className="flex gap-4">
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Demo
          </a>
          <a
            href="https://github.com/fernandomillan/teamflow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Github className="w-4 h-4" />
            View Source
          </a>
        </div>
      </div>

      {/* Overview */}
      <CaseStudySection title="Overview">
        <p>
          TeamFlow is a comprehensive work management platform built to demonstrate
          production-ready full-stack engineering skills. It combines real-time
          collaboration, role-based access control, and modern architectural patterns
          into a polished SaaS application.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              12+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Core Features
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              8
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Technologies
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              3 mos
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Development Timeline
            </div>
          </div>
        </div>

        <p className="mt-6">
          <strong>Key Features:</strong> JWT Authentication, Role-Based Access Control,
          Team & Project Management, Kanban & List Views, Real-time Updates via
          WebSockets, Live Presence Indicators, Audit Logging, Comment Threads,
          Optimistic UI Updates, Drag-and-Drop Task Management, Advanced Filtering,
          Demo Workspace with Seed Data
        </p>
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
          TeamFlow addresses these challenges by implementing a full-stack SaaS
          application from scratch, demonstrating production-level engineering
          patterns:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Real-time collaboration:</strong> WebSocket-based updates ensure all
            team members see changes instantly
          </li>
          <li>
            <strong>Three-tier RBAC:</strong> Admin, Manager, and Member roles with
            granular permissions using CASL
          </li>
          <li>
            <strong>Live presence indicators:</strong> See who&apos;s currently viewing each
            project in real-time
          </li>
          <li>
            <strong>Comprehensive audit logging:</strong> Every action is tracked with
            timestamp, user, and details
          </li>
          <li>
            <strong>Optimistic UI:</strong> Instant feedback with automatic rollback on
            errors for a polished UX
          </li>
          <li>
            <strong>Demo workspace:</strong> Pre-seeded data allows recruiters to explore
            immediately without setup
          </li>
        </ul>
      </CaseStudySection>

      {/* Architecture */}
      <CaseStudySection title="Architecture">
        <p>
          TeamFlow uses a modern, scalable monorepo architecture designed to showcase
          both frontend and backend expertise:
        </p>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 my-6">
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
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  apps/web
                </code>{' '}
                - Next.js 15 frontend with App Router and Server Components
              </li>
              <li>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  apps/api
                </code>{' '}
                - NestJS backend with modular architecture
              </li>
              <li>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  packages/database
                </code>{' '}
                - Shared Prisma schema and migrations
              </li>
              <li>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
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
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-semibold">Decision</th>
                <th className="text-left py-3 px-4 font-semibold">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              <tr>
                <td className="py-3 px-4 align-top">
                  <strong>Separate Next.js + NestJS</strong>
                  <br />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="border-l-4 border-blue-600 dark:border-blue-400 pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 1: WebSocket Authentication with JWT
            </h3>
            <p className="mb-2">
              WebSocket connections don&apos;t support standard HTTP headers, making JWT
              authentication tricky. Initial connections would authenticate but
              couldn&apos;t access user context for permission checks.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Implemented token-based handshake where clients
              send JWT in the connection payload. Backend validates the token, extracts
              user ID, and stores it in socket metadata. All subsequent events can
              access authenticated user context.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Learned:</strong> Real-time authentication requires different
              patterns than REST APIs. Understanding the WebSocket lifecycle is crucial
              for security.
            </p>
          </div>

          <div className="border-l-4 border-blue-600 dark:border-blue-400 pl-4">
            <h3 className="font-semibold text-lg mb-2">
              Challenge 2: Optimistic Concurrency with Real-time Updates
            </h3>
            <p className="mb-2">
              When multiple users edit the same task simultaneously, optimistic UI
              updates could overwrite each other&apos;s changes, causing data loss.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Added a version field to tasks and implemented
              optimistic concurrency control. Updates include the expected version; if
              it doesn&apos;t match (someone else updated), the request fails and UI
              reverts. WebSocket broadcasts ensure all clients refresh with latest data.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Learned:</strong> Real-time systems need conflict detection
              mechanisms. Optimistic UI is powerful but requires careful error handling.
            </p>
          </div>

          <div className="border-l-4 border-blue-600 dark:border-blue-400 pl-4">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <h3 className="font-semibold mb-3">Features Delivered</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Secure JWT authentication with password reset</li>
              <li>Role-based access control (Admin/Manager/Member)</li>
              <li>Team and project management</li>
              <li>Kanban board with drag-and-drop</li>
              <li>List view with sorting and filtering</li>
              <li>Real-time updates via WebSockets</li>
              <li>Live presence indicators</li>
              <li>Comment threads on tasks</li>
              <li>Comprehensive audit logging</li>
              <li>Optimistic UI with auto-rollback</li>
              <li>Demo workspace with seed data</li>
              <li>Responsive design with dark mode</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Technologies Demonstrated</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Next.js 15 App Router & Server Components</li>
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

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold mb-2">Try the Demo</h3>
          <p className="mb-4">
            Experience TeamFlow firsthand with the pre-seeded demo workspace. No signup
            required — just login and explore all features.
          </p>
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Launch Demo
          </a>
        </div>
      </CaseStudySection>
    </div>
  );
}
