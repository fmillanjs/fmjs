'use client';

import { ProjectCard } from './project-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string | Date;
  _count: {
    tasks: number;
  };
}

interface ProjectListProps {
  projects: Project[];
  teamId: string;
}

export function ProjectList({ projects, teamId }: ProjectListProps) {
  const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
  const archivedCount = projects.filter(p => p.status === 'ARCHIVED').length;

  return (
    <Tabs defaultValue="ACTIVE">
      <TabsList className="w-full justify-start rounded-none h-auto bg-transparent border-b px-0 gap-6">
        <TabsTrigger
          value="ACTIVE"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-2 px-1"
        >
          Active ({activeCount})
        </TabsTrigger>
        <TabsTrigger
          value="ARCHIVED"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-2 px-1"
        >
          Archived ({archivedCount})
        </TabsTrigger>
        <TabsTrigger
          value="ALL"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-2 px-1"
        >
          All ({projects.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ACTIVE" className="mt-4">
        {projects.filter(p => p.status === 'ACTIVE').length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground">No active projects. Create one to get started.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.filter(p => p.status === 'ACTIVE').map(project => <ProjectCard key={project.id} project={project} teamId={teamId} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="ARCHIVED" className="mt-4">
        {projects.filter(p => p.status === 'ARCHIVED').length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground">No archived projects.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.filter(p => p.status === 'ARCHIVED').map(project => <ProjectCard key={project.id} project={project} teamId={teamId} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="ALL" className="mt-4">
        {projects.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground">No projects found.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => <ProjectCard key={project.id} project={project} teamId={teamId} />)}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
