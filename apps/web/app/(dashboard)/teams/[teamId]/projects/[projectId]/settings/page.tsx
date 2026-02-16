import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectActions } from '@/components/projects/project-actions';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  organizationId: string;
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

export default async function ProjectSettingsPage({
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

  const isAdmin = session.user.role === 'ADMIN';

  return (
    <div className="max-w-3xl space-y-6">
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
          {project.name}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Settings</span>
      </nav>

      {/* Back Link */}
      <div>
        <Link
          href={`/teams/${teamId}/projects/${projectId}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Project
        </Link>
      </div>

      {/* Edit Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Settings</h1>
        <ProjectForm
          mode="edit"
          projectId={projectId}
          teamId={teamId}
          defaultValues={{
            name: project.name,
            description: project.description || '',
          }}
        />
      </div>

      {/* Danger Zone */}
      <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
        <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
        <ProjectActions
          projectId={projectId}
          teamId={teamId}
          projectName={project.name}
          projectStatus={project.status}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
