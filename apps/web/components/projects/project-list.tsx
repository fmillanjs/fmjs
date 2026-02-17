'use client';

import { useState } from 'react';
import { ProjectCard } from './project-card';

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

type FilterStatus = 'ALL' | 'ACTIVE' | 'ARCHIVED';

export function ProjectList({ projects, teamId }: ProjectListProps) {
  const [filter, setFilter] = useState<FilterStatus>('ACTIVE');

  const filteredProjects = projects.filter(project => {
    if (filter === 'ALL') return true;
    return project.status === filter;
  });

  const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
  const archivedCount = projects.filter(p => p.status === 'ARCHIVED').length;

  const emptyMessage = {
    ACTIVE: 'No active projects. Create one to get started.',
    ARCHIVED: 'No archived projects.',
    ALL: 'No projects found.',
  }[filter];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'ACTIVE'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('ARCHIVED')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'ARCHIVED'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Archived ({archivedCount})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'ALL'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            All ({projects.length})
          </button>
        </nav>
      </div>

      {/* Project grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
