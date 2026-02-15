import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

interface Task {
  id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
}

async function getProject(projectId: string): Promise<Project | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/projects/${projectId}`, {
      cache: 'no-store',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

async function getProjectTasks(projectId: string): Promise<Task[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/projects/${projectId}/tasks`, {
      cache: 'no-store',
      credentials: 'include',
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { teamId, projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    redirect(`/teams/${teamId}/projects`);
  }

  const tasks = await getProjectTasks(projectId);

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    blocked: tasks.filter(t => t.status === 'BLOCKED').length,
  };

  const statusColor = project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href={`/teams/${teamId}`} className="hover:text-gray-700">
          Team
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}/projects`} className="hover:text-gray-700">
          Projects
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded ${statusColor}`}>
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>
          <Link
            href={`/teams/${teamId}/projects/${projectId}/settings`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{taskStats.todo}</div>
            <div className="text-sm text-blue-600">To Do</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">{taskStats.inProgress}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{taskStats.done}</div>
            <div className="text-sm text-green-600">Done</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-900">{taskStats.blocked}</div>
            <div className="text-sm text-red-600">Blocked</div>
          </div>
        </div>
      </div>

      {/* Task Views Placeholder */}
      <div className="bg-white shadow rounded-lg p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Task views coming in Plan 07</h3>
          <p className="mt-1 text-sm text-gray-500">
            Kanban board and list view will be available here once implemented
          </p>
        </div>
      </div>
    </div>
  );
}
