import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProjectList } from '@/components/projects/project-list';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  _count: {
    tasks: number;
  };
}

async function getProjects(teamId: string, accessToken: string): Promise<Project[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/teams/${teamId}/projects`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch projects:', response.statusText);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const accessToken = (session as any)?.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const { teamId } = await params;
  const projects = await getProjects(teamId, accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage your team's projects and tasks
          </p>
        </div>
        <Link
          href={`/teams/${teamId}/projects/new`}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

      <ProjectList projects={projects} teamId={teamId} />
    </div>
  );
}
