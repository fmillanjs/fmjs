import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/project-form';

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { teamId } = await params;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/teams/${teamId}/projects`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-card shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">New Project</h1>
        <ProjectForm mode="create" teamId={teamId} />
      </div>
    </div>
  );
}
