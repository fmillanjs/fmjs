'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { TaskViews } from '@/components/tasks/task-views';
import { ProjectHeaderClient } from '@/components/project/project-header-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Settings } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  organizationId: string;
  _count: {
    tasks: number;
  };
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function ClientProjectPage({
  teamId,
  projectId,
  searchParams,
}: {
  teamId: string;
  projectId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [labels, setLabels] = useState<LabelBase[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for session to finish loading before acting — on page refresh useSession()
      // briefly returns null while hydrating, which would incorrectly redirect to login
      if (status === 'loading') return;
      if (!session?.accessToken) {
        router.push('/login');
        return;
      }

      const accessToken = (session as any).accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Build query string
      const queryParams = new URLSearchParams();
      if (searchParams.status) {
        const statuses = Array.isArray(searchParams.status) ? searchParams.status : [searchParams.status];
        statuses.forEach((s) => queryParams.append('status', s));
      }
      if (searchParams.priority) {
        const priorities = Array.isArray(searchParams.priority) ? searchParams.priority : [searchParams.priority];
        priorities.forEach((p) => queryParams.append('priority', p));
      }
      if (searchParams.assignee) {
        queryParams.set('assigneeId', searchParams.assignee as string);
      }
      if (searchParams.labels) {
        const labelIds = Array.isArray(searchParams.labels) ? searchParams.labels : [searchParams.labels];
        labelIds.forEach((l) => queryParams.append('labelId', l));
      }
      if (searchParams.search) {
        queryParams.set('search', searchParams.search as string);
      }
      if (searchParams.sortBy) {
        queryParams.set('sortBy', searchParams.sortBy as string);
      }
      if (searchParams.sortOrder) {
        queryParams.set('sortOrder', searchParams.sortOrder as string);
      }

      const queryString = queryParams.toString();
      const tasksUrl = queryString
        ? `${apiUrl}/api/projects/${projectId}/tasks?${queryString}`
        : `${apiUrl}/api/projects/${projectId}/tasks`;

      try {
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
        };

        const [projectRes, tasksRes, membersRes, labelsRes] = await Promise.all([
          fetch(`${apiUrl}/api/projects/${projectId}`, { headers }),
          fetch(tasksUrl, { headers }),
          fetch(`${apiUrl}/api/teams/${teamId}/members`, { headers }),
          fetch(`${apiUrl}/api/teams/${teamId}/labels`, { headers }),
        ]);

        if (!projectRes.ok) {
          router.push(`/teams/${teamId}/projects`);
          return;
        }

        const [projectData, tasksData, membersData, labelsData] = await Promise.all([
          projectRes.json(),
          tasksRes.json(),
          membersRes.json(),
          labelsRes.json(),
        ]);

        setProject(projectData);
        setTasks(tasksData);
        setMembers(membersData);
        setLabels(labelsData);
      } catch (error) {
        console.error('Error fetching project data:', error);
        router.push(`/teams/${teamId}/projects`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, projectId, teamId, router, searchParams]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  // Phase 07.1-03 Fix: Include email for fallback display when name is null
  const teamMembers = members.map((m) => ({
    id: m.user?.id || m.userId,
    name: m.user?.name || null,
    email: m.user?.email || `User ${m.userId.slice(0, 8)}`,
    image: m.user?.image || null,
  }));

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
  };

  const statusColor =
    project.status === 'ACTIVE'
      ? 'bg-[var(--green-3)] text-[var(--green-11)]'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/teams/${teamId}`} className="hover:text-foreground">
          Team
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}/projects`} className="hover:text-foreground">
          Projects
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusColor}`}>
                  {project.status}
                </span>
                <ProjectHeaderClient projectId={projectId} />
              </div>
              {project.description && <p className="text-muted-foreground">{project.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/teams/${teamId}/projects/${projectId}/activity`}>
                  <Clock className="mr-2 h-4 w-4" />
                  Activity
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/teams/${teamId}/projects/${projectId}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-foreground">{taskStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="bg-[var(--blue-3)] rounded-lg p-4">
              <div className="text-2xl font-bold text-[var(--blue-12)]">{taskStats.todo}</div>
              <div className="text-sm text-[var(--blue-11)]">To Do</div>
            </div>
            <div className="bg-[var(--amber-3)] rounded-lg p-4">
              <div className="text-2xl font-bold text-[var(--amber-12)]">{taskStats.inProgress}</div>
              <div className="text-sm text-[var(--amber-11)]">In Progress</div>
            </div>
            <div className="bg-[var(--green-3)] rounded-lg p-4">
              <div className="text-2xl font-bold text-[var(--green-12)]">{taskStats.done}</div>
              <div className="text-sm text-[var(--green-11)]">Done</div>
            </div>
            <div className="bg-[var(--red-3)] rounded-lg p-4">
              <div className="text-2xl font-bold text-[var(--red-12)]">{taskStats.blocked}</div>
              <div className="text-sm text-[var(--red-11)]">Blocked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      <TaskViews
        initialTasks={tasks}
        projectId={projectId}
        orgSlug={teamId}
        teamMembers={teamMembers}
        labels={labels}
      />
    </div>
  );
}
