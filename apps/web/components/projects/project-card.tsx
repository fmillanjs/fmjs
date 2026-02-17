'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

interface ProjectCardProps {
  project: Project;
  teamId: string;
}

export function ProjectCard({ project, teamId }: ProjectCardProps) {
  const statusColor = project.status === 'ACTIVE' ? 'bg-[var(--green-3)] text-[var(--green-11)]' : 'bg-muted text-muted-foreground';

  return (
    <Link
      href={`/teams/${teamId}/projects/${project.id}`}
      className="block p-6 bg-card rounded-lg border border-border hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground line-clamp-1">
          {project.name}
        </h3>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColor}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {project._count?.tasks ?? 0} {(project._count?.tasks ?? 0) === 1 ? 'task' : 'tasks'}
        </span>
        <span>
          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
