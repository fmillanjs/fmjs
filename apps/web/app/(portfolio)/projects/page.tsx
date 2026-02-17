import type { Metadata } from 'next';
import { ProjectCard } from '@/components/portfolio/project-card';

export const metadata: Metadata = {
  title: 'Projects',
};

export default function ProjectsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Projects</h1>
        <p className="text-xl text-muted-foreground">Things I&apos;ve built</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ProjectCard
          title="TeamFlow"
          description="A production-ready work management SaaS with real-time collaboration"
          techStack={['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSocket']}
          href="/projects/teamflow"
          featured
        />
      </div>
    </div>
  );
}
