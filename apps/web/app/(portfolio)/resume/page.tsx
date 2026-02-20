import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Resume',
  description: "Fernando Millan's resume - Full-stack Engineer",
};

export default function ResumePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header with Download Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="mb-6 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">
            Resume
          </h1>
          <p className="text-xl text-muted-foreground">
            Full-stack Engineer
          </p>
        </div>
        <Button asChild>
          <a href="/resume.pdf" download className="inline-flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download PDF
          </a>
        </Button>
      </div>

      {/* Inline Resume Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">
            Summary
          </h2>
          <p className="text-muted-foreground">
            Senior full-stack engineer who shipped two production SaaS applications (TeamFlow
            and DevCollab) from architecture to live deployment. Expert in Next.js 15, NestJS,
            TypeScript, PostgreSQL, Redis, and Docker. Proven track record of implementing
            real-time WebSocket systems, RBAC with CASL, CI/CD pipelines with GitHub Actions
            and GHCR, and self-hosted deployment on VPS with Traefik.
          </p>
        </section>

        {/* Technical Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                Frontend
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>React, Next.js, TypeScript</li>
                <li>Server Components, App Router</li>
                <li>Tailwind CSS, Responsive Design</li>
                <li>React Hook Form, TanStack Query</li>
                <li>WebSockets (Socket.io client)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                Backend
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Node.js, NestJS, Express</li>
                <li>PostgreSQL, Prisma ORM</li>
                <li>Redis, WebSocket servers</li>
                <li>JWT Authentication, RBAC</li>
                <li>RESTful APIs, OpenAPI/Swagger</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                Infrastructure
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Docker, Docker Compose</li>
                <li>Git, GitHub, CI/CD</li>
                <li>Turborepo, Monorepo patterns</li>
                <li>Database migrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                Tools &amp; Practices
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>TypeScript (strict mode)</li>
                <li>Zod validation</li>
                <li>CASL authorization</li>
                <li>ESLint, Prettier</li>
                <li>Optimistic UI patterns</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">
            Experience
          </h2>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-xl text-foreground">
                    Full-Stack Engineer
                  </h3>
                  <p className="text-muted-foreground">
                    Personal Projects &amp; Portfolio
                  </p>
                </div>
                <p className="text-muted-foreground">2023 - Present</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  Architected and deployed TeamFlow (work management SaaS) and DevCollab
                  (developer collaboration platform) &mdash; both live at HTTPS custom domains
                  with full CI/CD
                </li>
                <li>
                  Implemented real-time collaboration with WebSocket + Redis pub/sub for
                  horizontal scaling across both applications
                </li>
                <li>
                  Designed CASL RBAC with Admin/Contributor/Viewer roles, PATCH/DELETE
                  protected by server-side authorization guards
                </li>
                <li>
                  Built Turborepo monorepo with shared TypeScript packages, Docker multi-stage
                  builds, and GitHub Actions CI/CD deploying to self-hosted Coolify on a VPS
                </li>
                <li>
                  Shipped optimistic UI with automatic rollback, full-text search with
                  pg_trgm, and invite link flows
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* Education */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">
            Education
          </h2>
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-xl text-foreground">
                  Bachelor of Science in Computer Science
                </h3>
                <p className="text-muted-foreground">
                  Self-taught
                </p>
              </div>
              <p className="text-muted-foreground">Graduation Year</p>
            </div>
            <p className="text-muted-foreground">
              Relevant coursework in software engineering, data structures, algorithms,
              and web development.
            </p>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">
            Projects
          </h2>
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-xl text-foreground">
                  TeamFlow
                </h3>
                <p className="text-muted-foreground">
                  Work Management SaaS Application
                </p>
              </div>
              <Link
                href="/projects/teamflow"
                className="text-primary hover:underline"
              >
                View Case Study →
              </Link>
            </div>
            <p className="text-muted-foreground mb-2">
              A comprehensive work management platform demonstrating production-ready
              full-stack engineering skills.
            </p>
            <p className="text-muted-foreground">
              <strong>Technologies:</strong> Next.js 15, NestJS, TypeScript, PostgreSQL,
              Redis, WebSockets, Prisma, Docker, Tailwind CSS
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
