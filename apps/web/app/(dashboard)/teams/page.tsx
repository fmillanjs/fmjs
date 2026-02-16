import { serverApi } from '@/lib/api';
import { validatedApi } from '@/lib/api';
import { OrganizationWithCountSchema } from '@/lib/validators/api-schemas';
import { z } from 'zod';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Type inferred from validated schema
type Team = z.infer<typeof OrganizationWithCountSchema>;

export default async function TeamsPage() {
  let teams: Team[] = [];

  try {
    // Get auth token for validated API call
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Use validatedApi with runtime schema validation
    teams = await validatedApi.get(
      '/api/teams',
      z.array(OrganizationWithCountSchema),
      token
    );
  } catch (error) {
    console.error('Failed to fetch teams:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your teams and collaborate with team members
          </p>
        </div>
        <Link
          href="/teams/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
            <path d="M12 4v16m8-8H4" />
          </svg>
          Create Team
        </Link>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-card dark:bg-gray-950 border border-border shadow rounded-lg p-12">
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Create your first team to get started with collaboration and organize your work."
            action={
              <Link
                href="/teams/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
              >
                Create Team
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Team</dt>
                      <dd className="text-lg font-semibold text-gray-900 truncate">
                        {team.name}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {team._count?.members || 1} member{team._count?.members !== 1 ? 's' : ''}
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <svg
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {team.createdAt.toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
