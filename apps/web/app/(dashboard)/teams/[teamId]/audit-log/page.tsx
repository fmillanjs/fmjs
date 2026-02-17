import { auth } from '@/lib/auth';
import { serverApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuditLogTable } from '@/components/activity/audit-log-table';
import { AuditOutcome } from '@repo/shared/types';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Team {
  id: string;
  name: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: AuditOutcome;
  changes: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  timestamp: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface TeamMember {
  id: string;
  role: string;
  userId: string;
}

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { teamId } = await params;

  // Fetch team to get name and verify access
  const team = await serverApi.get<Team & { members: TeamMember[] }>(`/api/teams/${teamId}`).catch(() => null);

  if (!team) {
    redirect('/teams');
  }

  // Check if user is ADMIN
  const currentUserMembership = team.members.find((m) => m.userId === session.user.id);
  const currentUserRole = currentUserMembership?.role || 'MEMBER';

  if (currentUserRole !== 'ADMIN') {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/teams" className="hover:text-foreground">
            Teams
          </Link>
          <span>›</span>
          <Link href={`/teams/${teamId}`} className="hover:text-foreground">
            {team.name}
          </Link>
          <span>›</span>
          <span className="text-foreground font-medium">Audit Log</span>
        </nav>

        {/* Access Denied */}
        <div className="bg-card shadow rounded-lg p-12 text-center">
          <Lock
            className="mx-auto h-12 w-12 text-[var(--red-9)]"
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-lg font-medium text-foreground">Access Denied</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can access the audit log.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href={`/teams/${teamId}`}>Back to Team</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch initial audit log data
  const auditResponse = await serverApi
    .get<{
      logs: AuditLogEntry[];
      total: number;
      offset: number;
      limit: number;
    }>(`/teams/${teamId}/audit-log?offset=0&limit=25`)
    .catch(() => ({ logs: [], total: 0, offset: 0, limit: 25 }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/teams" className="hover:text-foreground">
          Teams
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}`} className="hover:text-foreground">
          {team.name}
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">Audit Log</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <span className="px-2 py-1 text-xs font-medium bg-[var(--red-3)] text-[var(--red-11)] rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Admin Only
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization-wide audit trail for {team.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Back to Team
          </Link>
        </Button>
      </div>

      {/* Audit Log Table */}
      <AuditLogTable teamId={teamId} initialEntries={auditResponse.logs} totalCount={auditResponse.total} />
    </div>
  );
}
