import { serverApi } from '@/lib/api';
import { validatedApi } from '@/lib/api';
import { OrganizationWithCountSchema } from '@/lib/validators/api-schemas';
import { z } from 'zod';
import Link from 'next/link';
import { Users, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your teams and collaborate with team members
          </p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Create Team
          </Link>
        </Button>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-card border border-border shadow rounded-lg p-12">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No teams yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Create your first team to get started with collaboration and organize your work.
            </p>
            <Button asChild>
              <Link href="/teams/new">Create Team</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-card overflow-hidden shadow rounded-lg hover:shadow-md transition"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Team</dt>
                      <dd className="text-lg font-semibold text-foreground truncate">
                        {team.name}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
                  {team._count?.members || 1} member{team._count?.members !== 1 ? 's' : ''}
                </div>
                <div className="mt-1 flex items-center text-sm text-muted-foreground">
                  <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
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
