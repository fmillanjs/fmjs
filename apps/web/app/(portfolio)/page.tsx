import type { Metadata } from 'next';
import { HeroSection } from '@/components/portfolio/hero-section';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fernando Millan - Full-Stack Engineer',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Featured Project Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Project
            </h2>
            <p className="text-lg text-muted-foreground">
              Real-time collaboration platform showcasing full-stack expertise
            </p>
          </div>

          {/* TeamFlow Card */}
          <div className="max-w-4xl mx-auto">
            <div className="border-2 border-primary rounded-lg p-8 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    TeamFlow
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Production-Ready SaaS Collaboration Platform
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  Featured
                </span>
              </div>

              <p className="text-foreground mb-6 leading-relaxed">
                A comprehensive team collaboration platform featuring real-time updates,
                role-based access control, task management with Kanban/List views,
                WebSocket-powered presence indicators, and complete audit logging.
                Built with Next.js 15, NestJS, PostgreSQL, Redis, and deployed with Docker.
              </p>

              {/* Tech Stack Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'Next.js',
                  'NestJS',
                  'TypeScript',
                  'WebSocket',
                  'PostgreSQL',
                  'Prisma',
                  'Redis',
                  'Docker',
                  'Tailwind',
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-md bg-muted text-muted-foreground text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="text-muted-foreground text-sm">
                Full case study coming soon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                30+
              </div>
              <div className="text-lg text-muted-foreground">
                Features Built
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                Real-Time
              </div>
              <div className="text-lg text-muted-foreground">
                Collaboration
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                Production
              </div>
              <div className="text-lg text-muted-foreground">
                Ready Code
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
