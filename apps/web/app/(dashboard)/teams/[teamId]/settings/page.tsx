import { serverApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { TeamMemberList } from '@/components/teams/team-member-list';
import { InviteMemberForm } from '@/components/teams/invite-member-form';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ChevronRight } from 'lucide-react';

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
      <Card className="p-8 text-center">
        <CardContent className="pt-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--red-9)]" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Error Loading Team</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error || 'Team not found'}</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/teams">Back to Teams</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
            <Link href="/teams" className="text-muted-foreground hover:text-foreground">
              <span className="text-sm font-medium">Teams</span>
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
              <Link
                href={`/teams/${team.id}`}
                className="ml-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {team.name}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
              <span className="ml-4 text-sm font-medium text-muted-foreground">Settings</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage team members and permissions
        </p>
      </div>

      {/* Member Management */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
            Invite Team Members
          </h3>
          <InviteMemberForm teamId={team.id} />
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
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
