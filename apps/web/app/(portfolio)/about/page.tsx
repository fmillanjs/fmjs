import type { Metadata } from 'next';
import { TechStack } from '@/components/portfolio/tech-stack';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ParallaxDivider } from '@/components/portfolio/parallax-divider';

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
          <p className="text-xl text-muted-foreground">
            Senior Full-Stack Engineer with a passion for building exceptional software
          </p>
        </div>

        {/* Bio Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Professional Summary
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              I&apos;m a senior full-stack engineer who shipped two production SaaS applications
              &mdash; TeamFlow (work management with real-time collaboration) and DevCollab
              (developer workspace platform) &mdash; from zero to deployed on a self-hosted VPS
              with Traefik, Docker, GHCR CI/CD, and PostgreSQL in under a week.
            </p>
            <p>
              My stack is Next.js 15, NestJS, TypeScript, PostgreSQL, and Redis. I use CASL
              for fine-grained RBAC, Prisma for type-safe database access, and Turborepo for
              monorepo orchestration. Both applications are live with HTTPS at custom domains
              &mdash; you can register, create workspaces, and explore the features right now.
            </p>
            <p>
              I&apos;m actively seeking a senior full-stack engineering role where I can apply
              these skills to production systems with real users. I value clean architecture,
              type safety, and shipping working software over perfect plans.
            </p>
          </div>
        </section>

        <ParallaxDivider />

        {/* Tech Stack Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Technology Stack
          </h2>
          <TechStack />
        </section>

        <ParallaxDivider />

        {/* What I Value Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            What I Value
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>Clean Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Well-structured codebases with clear separation of concerns, making systems
                  maintainable and extensible over time.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>Type Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Leveraging TypeScript&apos;s type system to catch errors early and provide
                  excellent developer experience with autocomplete and refactoring.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>Production Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Building with security, performance, monitoring, and error handling in mind
                  from day one, not as afterthoughts.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>Developer Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Creating tools, documentation, and workflows that make the team productive
                  and the codebase a joy to work with.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Interested in working together?
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            I&apos;m currently open to senior full-stack engineering opportunities.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Get In Touch</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
