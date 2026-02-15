import { auth } from '@/lib/auth';
import { serverApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ActivityFeed } from '@/components/activity/activity-feed';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  timestamp: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { teamId, projectId } = await params;

  // Fetch project and initial activities
  const [project, activityResponse] = await Promise.all([
    serverApi.get<Project>(`/projects/${projectId}`).catch(() => null),
    serverApi
      .get<{
        activities: AuditLogEntry[];
        total: number;
        offset: number;
        limit: number;
      }>(`/projects/${projectId}/activity?offset=0&limit=20`)
      .catch(() => ({ activities: [], total: 0, offset: 0, limit: 20 })),
  ]);

  if (!project) {
    redirect(`/teams/${teamId}/projects`);
  }

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
        <Link
          href={`/teams/${teamId}/projects/${projectId}`}
          className="hover:text-gray-700"
        >
          {project.name}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Activity</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="mt-1 text-sm text-gray-500">
            Recent activity for {project.name}
          </p>
        </div>
        <Link
          href={`/teams/${teamId}/projects/${projectId}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Project
        </Link>
      </div>

      {/* Activity Feed */}
      <ActivityFeed projectId={projectId} initialActivities={activityResponse.activities} />
    </div>
  );
}
