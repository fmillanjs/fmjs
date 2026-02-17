import { serverApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { TeamMemberList } from '@/components/teams/team-member-list';
import { InviteMemberForm } from '@/components/teams/invite-member-form';
import { redirect } from 'next/navigation';

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

interface Team {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: TeamMember[];
}

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  const { teamId } = await params;

  let team: Team | null = null;
  let error: string | null = null;

  try {
    team = await serverApi.get<Team>(`/api/teams/${teamId}`);
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

  // Only admins can access settings
  if (currentUserRole !== 'ADMIN') {
    redirect(`/teams/${team.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/teams" className="text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:text-gray-300">
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
              <Link
                href={`/teams/${team.id}`}
                className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:text-gray-300"
              >
                {team.name}
              </Link>
            </div>
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
              <span className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-300">Settings</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Manage team members and permissions
        </p>
      </div>

      {/* Member Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Invite Team Members
          </h3>
          <InviteMemberForm teamId={team.id} />
        </div>
      </div>

      {/* Team Members List */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          Team Members ({team.members.length})
        </h3>
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
