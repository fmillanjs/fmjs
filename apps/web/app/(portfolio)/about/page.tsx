import type { Metadata } from 'next';
import { TechStack } from '@/components/portfolio/tech-stack';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Senior Full-Stack Engineer with a passion for building exceptional software
          </p>
        </div>

        {/* Bio Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Professional Summary
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300 space-y-4">
            <p>
              I'm a senior full-stack engineer specializing in building production-ready
              SaaS applications with modern JavaScript/TypeScript stacks. My expertise
              spans the entire development lifecycle, from architecture design and database
              modeling to real-time features and deployment automation.
            </p>
            <p>
              My approach focuses on clean architecture, type safety, and developer experience.
              I believe great software emerges from the intersection of thoughtful design,
              rigorous testing, and continuous iteration. Every line of code I write is
              production-grade, maintainable, and built to scale.
            </p>
            <p>
              With deep experience in Next.js, NestJS, PostgreSQL, and modern DevOps tooling,
              I build systems that recruiters and users can interact with immediately.
              I'm currently seeking opportunities to apply my skills in a senior engineering
              role where I can contribute to complex technical challenges and mentor growing teams.
            </p>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Technology Stack
          </h2>
          <TechStack />
        </section>

        {/* What I Value Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            What I Value
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Clean Architecture
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Well-structured codebases with clear separation of concerns, making systems
                maintainable and extensible over time.
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Type Safety
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Leveraging TypeScript's type system to catch errors early and provide
                excellent developer experience with autocomplete and refactoring.
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Production Readiness
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Building with security, performance, monitoring, and error handling in mind
                from day one, not as afterthoughts.
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Developer Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Creating tools, documentation, and workflows that make the team productive
                and the codebase a joy to work with.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Interested in working together?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            I'm currently open to senior full-stack engineering opportunities.
          </p>
          <a
            href="mailto:hello@fernandomillan.dev"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get in Touch
          </a>
        </section>
      </div>
    </div>
  );
}
