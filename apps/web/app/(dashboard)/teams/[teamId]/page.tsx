import { serverApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { TeamMemberList } from '@/components/teams/team-member-list';
import { InviteMemberForm } from '@/components/teams/invite-member-form';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderOpen } from 'lucide-react';

interface TeamMember {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  _count: {
    tasks: number;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: TeamMember[];
}

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  const { teamId } = await params;

  let team: Team | null = null;
  let projects: Project[] = [];
  let error: string | null = null;

  try {
    const [teamData, projectsData] = await Promise.all([
      serverApi.get<Team>(`/api/teams/${teamId}`),
      serverApi.get<Project[]>(`/api/teams/${teamId}/projects`).catch(() => []),
    ]);
    team = teamData;
    projects = projectsData;
  } catch (err) {
    console.error('Failed to fetch team:', err);
    error = err instanceof Error ? err.message : 'Failed to load team';
  }

  if (error || !team) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Team</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error || 'Team not found'}</p>
        <div className="mt-6">
          <Link
            href="/teams"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  // Find current user's membership
  const currentUserMembership = team.members.find(
    (m) => m.userId === session?.user?.id
  );
  const currentUserRole = currentUserMembership?.role || 'MEMBER';
  const canInvite = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/teams" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <span className="text-sm font-medium">Teams</span>
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 h-5 w-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-900 dark:text-white dark:text-white">{team.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Team created on {new Date(team.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {currentUserRole === 'ADMIN' && (
            <Link
              href={`/teams/${team.id}/audit-log`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Audit Log
            </Link>
          )}
          <Link
            href={`/teams/${team.id}/settings`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Members</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">{team.members.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Projects</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Tasks</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Projects</h3>
          <Link
            href={`/teams/${team.id}/projects/new`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            New Project
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8">
            <EmptyState
              icon={FolderOpen}
              title="No projects"
              description="Create a project to start organizing work and managing tasks for this team."
              action={
                <Link
                  href={`/teams/${team.id}/projects/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Project
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/teams/${team.id}/projects/${project.id}`}
                className="bg-white shadow rounded-lg p-5 hover:shadow-md transition"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h4>
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{project._count?.tasks ?? 0} tasks</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {projects.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              href={`/teams/${team.id}/projects`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all {projects.length} projects →
            </Link>
          </div>
        )}
      </div>

      {/* Invite Members (for Admin/Manager) */}
      {canInvite && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Invite Team Members
            </h3>
            <InviteMemberForm teamId={team.id} />
          </div>
        </div>
      )}

      {/* Team Members */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Team Members</h3>
        <TeamMemberList
          teamId={team.id}
          members={team.members}
          currentUserRole={currentUserRole}
          currentUserId={session?.user?.id || ''}
        />
      </div>
    </div>
  );
}
