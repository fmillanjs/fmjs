import { serverApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { TeamMemberList } from '@/components/teams/team-member-list';
import { InviteMemberForm } from '@/components/teams/invite-member-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FolderOpen,
  Settings,
  ClipboardList,
  Users,
  FolderOpen as FolderIcon,
  ClipboardCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

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
      <>
        <title>Team | TeamFlow</title>
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
      </>
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
      <title>{team.name} | TeamFlow</title>
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
              <span className="ml-4 text-sm font-medium text-foreground">{team.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Team created on {new Date(team.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {currentUserRole === 'ADMIN' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/teams/${team.id}/audit-log`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Audit Log
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teams/${team.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Members</dt>
                  <dd className="text-lg font-semibold text-foreground">{team.members.length}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 text-[var(--green-9)]" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Projects</dt>
                  <dd className="text-lg font-semibold text-foreground">{projects.length}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardCheck className="h-6 w-6 text-[var(--amber-9)]" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Tasks</dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {projects.reduce((sum, p) => sum + (p._count?.tasks ?? 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-foreground">Projects</h3>
          <Button size="sm" asChild>
            <Link href={`/teams/${team.id}/projects/new`}>New Project</Link>
          </Button>
        </div>
        {projects.length === 0 ? (
          <Card className="p-8">
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">No projects</p>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Create a project to start organizing work and managing tasks for this team.
                </p>
                <Button asChild>
                  <Link href={`/teams/${team.id}/projects/new`}>Create Project</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/teams/${team.id}/projects/${project.id}`} className="block group">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <h4 className="text-lg font-semibold text-foreground mb-1">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{project._count?.tasks ?? 0} tasks</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          project.status === 'ACTIVE'
                            ? 'bg-[var(--green-3)] text-[var(--green-11)]'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {projects.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              href={`/teams/${team.id}/projects`}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View all {projects.length} projects →
            </Link>
          </div>
        )}
      </div>

      {/* Invite Members (for Admin/Manager) */}
      {canInvite && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Invite Team Members</h3>
            <InviteMemberForm teamId={team.id} />
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Team Members</h3>
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
