import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import Link from 'next/link';

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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">
            Resume
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-600 dark:text-gray-300">
            Full-stack Engineer
          </p>
        </div>
        <a
          href="/resume.pdf"
          download
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Download PDF
        </a>
      </div>

      {/* Inline Resume Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Full-stack engineer with expertise in building production-ready SaaS applications.
            Specializing in modern web technologies including React, Next.js, Node.js, and
            TypeScript. Proven experience in architecting scalable systems with real-time
            collaboration, role-based access control, and modern DevOps practices.
          </p>
        </section>

        {/* Technical Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Frontend
              </h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>React, Next.js, TypeScript</li>
                <li>Server Components, App Router</li>
                <li>Tailwind CSS, Responsive Design</li>
                <li>React Hook Form, TanStack Query</li>
                <li>WebSockets (Socket.io client)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Backend
              </h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>Node.js, NestJS, Express</li>
                <li>PostgreSQL, Prisma ORM</li>
                <li>Redis, WebSocket servers</li>
                <li>JWT Authentication, RBAC</li>
                <li>RESTful APIs, OpenAPI/Swagger</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Infrastructure
              </h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>Docker, Docker Compose</li>
                <li>Git, GitHub, CI/CD</li>
                <li>Turborepo, Monorepo patterns</li>
                <li>Database migrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Tools & Practices
              </h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
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
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Experience
          </h2>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                    Full-Stack Engineer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-600 dark:text-gray-300">
                    Personal Projects & Portfolio
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300">2023 - Present</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
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
                  <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                    Software Developer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-600 dark:text-gray-300">
                    Previous Experience (customizable)
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300">2020 - 2023</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
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
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Education
          </h2>
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                  Bachelor of Science in Computer Science
                </h3>
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-300">
                  University Name (customizable)
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300">Graduation Year</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Relevant coursework in software engineering, data structures, algorithms,
              and web development.
            </p>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Projects
          </h2>
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                  TeamFlow
                </h3>
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-300">
                  Work Management SaaS Application
                </p>
              </div>
              <Link
                href="/projects/teamflow"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Case Study →
              </Link>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              A comprehensive work management platform demonstrating production-ready
              full-stack engineering skills.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Technologies:</strong> Next.js 15, NestJS, TypeScript, PostgreSQL,
              Redis, WebSockets, Prisma, Docker, Tailwind CSS
            </p>
          </div>
        </section>

        {/* Note about PDF */}
        <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-600 dark:text-gray-300">
            <strong>Note:</strong> This is a customizable placeholder resume. To add your
            PDF resume, place{' '}
            <code className="text-sm bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              resume.pdf
            </code>{' '}
            in the{' '}
            <code className="text-sm bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              apps/web/public/
            </code>{' '}
            directory.
          </p>
        </div>
      </div>
    </div>
  );
}
