import { auth } from '@/lib/auth';
import { serverApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/teams/${teamId}`} className="hover:text-foreground">
          Team
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}/projects`} className="hover:text-foreground">
          Projects
        </Link>
        <span>›</span>
        <Link
          href={`/teams/${teamId}/projects/${projectId}`}
          className="hover:text-foreground"
        >
          {project.name}
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">Activity</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent activity for {project.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/teams/${teamId}/projects/${projectId}`}>
            <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Back to Project
          </Link>
        </Button>
      </div>

      {/* Activity Feed */}
      <ActivityFeed projectId={projectId} initialActivities={activityResponse.activities} />
    </div>
  );
}
