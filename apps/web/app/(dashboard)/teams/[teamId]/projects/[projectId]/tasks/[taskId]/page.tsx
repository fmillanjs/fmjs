import { auth } from '@/lib/auth';
import { serverApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TaskDetail, LabelBase } from '@repo/shared/types';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';

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

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string; taskId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { teamId, projectId, taskId } = await params;

  // Fetch task detail, team members, and labels in parallel
  const [task, members, labels] = await Promise.all([
    serverApi.get<TaskDetail>(`/tasks/${taskId}`).catch(() => null),
    serverApi.get<TeamMember[]>(`/teams/${teamId}/members`).catch(() => []),
    serverApi.get<LabelBase[]>(`/teams/${teamId}/labels`).catch(() => []),
  ]);

  if (!task) {
    redirect(`/teams/${teamId}/projects/${projectId}`);
  }

  // Transform team members for dropdowns
  // Phase 07.1-03 Fix: Include email for fallback display when name is null
  const teamMembers = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email || `User ${m.user.id.slice(0, 8)}`,
    image: m.user.image,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
        <Link href={`/teams/${teamId}`} className="hover:text-gray-700">
          Team
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}/projects`} className="hover:text-gray-700">
          Projects
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}/projects/${projectId}`} className="hover:text-gray-700">
          Project
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{task.title}</span>
      </nav>

      {/* Back Button */}
      <Link
        href={`/teams/${teamId}/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Project
      </Link>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={task}
        teamMembers={teamMembers}
        labels={labels}
        teamId={teamId}
        projectId={projectId}
      />
    </div>
  );
}
