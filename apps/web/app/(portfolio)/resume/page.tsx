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
            Full-stack engineer with expertise in building production-ready SaaS applications.
            Specializing in modern web technologies including React, Next.js, Node.js, and
            TypeScript. Proven experience in architecting scalable systems with real-time
            collaboration, role-based access control, and modern DevOps practices.
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
                  Designed and built TeamFlow, a production-ready work management SaaS
                  with real-time collaboration
                </li>
                <li>
                  Implemented WebSocket-based live updates with Redis pub/sub for
                  horizontal scaling
                </li>
                <li>
                  Architected role-based access control system using CASL with
                  three-tier permissions
                </li>
                <li>
                  Built monorepo structure with Turborepo for shared types and unified
                  development workflow
                </li>
                <li>
                  Developed optimistic UI patterns with automatic rollback for polished
                  user experience
                </li>
              </ul>
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-xl text-foreground">
                    Software Developer
                  </h3>
                  <p className="text-muted-foreground">
                    Previous Experience (customizable)
                  </p>
                </div>
                <p className="text-muted-foreground">2020 - 2023</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  Built and maintained web applications using modern JavaScript frameworks
                </li>
                <li>Collaborated with cross-functional teams to deliver features</li>
                <li>Implemented responsive designs and ensured cross-browser compatibility</li>
                <li>Participated in code reviews and contributed to technical documentation</li>
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
                  University Name (customizable)
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

        {/* Note about PDF */}
        <div className="mt-12 p-4 bg-muted border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a customizable placeholder resume. To add your
            PDF resume, place{' '}
            <code className="text-sm bg-card px-1.5 py-0.5 rounded">
              resume.pdf
            </code>{' '}
            in the{' '}
            <code className="text-sm bg-card px-1.5 py-0.5 rounded">
              apps/web/public/
            </code>{' '}
            directory.
          </p>
        </div>
      </div>
    </div>
  );
}
