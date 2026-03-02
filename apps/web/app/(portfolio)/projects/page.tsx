import type { Metadata } from 'next';
import { ProjectCard } from '@/components/portfolio/project-card';
import { AnimateIn } from '@/components/portfolio/animate-in';
import { StaggerContainer, StaggerItem } from '@/components/portfolio/stagger-container';

export const metadata: Metadata = {
  title: 'Projects',
};

export default function ProjectsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <AnimateIn className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Projects</h1>
        <p className="text-xl text-muted-foreground">Things I&apos;ve built</p>
      </AnimateIn>
      <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StaggerItem>
          <ProjectCard
            title="TeamFlow"
            description="A production-ready work management SaaS with real-time collaboration"
            techStack={['Next.js 15', 'NestJS', 'TypeScript', 'Socket.io', 'PostgreSQL', 'Redis', 'Prisma', 'Docker']}
            href="/projects/teamflow"
            featured
            screenshot={{ src: '/screenshots/teamflow-kanban.png', alt: 'TeamFlow Kanban board' }}
          />
        </StaggerItem>
        <StaggerItem>
          <ProjectCard
            title="DevCollab"
            description="A developer collaboration platform with code snippets, Markdown posts, full-text search, and role-based workspaces"
            techStack={['Next.js 15', 'NestJS', 'TypeScript', 'PostgreSQL', 'Prisma', 'react-markdown', 'Shiki', 'Docker']}
            href="/projects/devcollab"
            featured
            screenshot={{ src: '/screenshots/devcollab-workspace.png', alt: 'DevCollab workspace' }}
          />
        </StaggerItem>
        <StaggerItem>
          <ProjectCard
            title="AI SDR"
            description="An AI Sales Development Representative system using Claude for lead qualification, CRM enrichment, and personalized email generation with real-time SSE streaming"
            techStack={['Next.js 16', 'NestJS', 'TypeScript', 'Claude API', 'Prisma', 'PostgreSQL', 'SSE', 'Docker']}
            href="/projects/ai-sdr"
            featured
            screenshot={{ src: '/screenshots/ai-sdr-leads.png', alt: 'AI SDR CRM dashboard with lead scoring' }}
          />
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
