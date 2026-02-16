import { auth } from '@/lib/auth';
import { serverApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuditLogTable } from '@/components/activity/audit-log-table';
import { AuditOutcome } from '@repo/shared/types';

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
        <nav className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
          <Link href="/teams" className="hover:text-gray-700">
            Teams
          </Link>
          <span>›</span>
          <Link href={`/teams/${teamId}`} className="hover:text-gray-700">
            {team.name}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Audit Log</span>
        </nav>

        {/* Access Denied */}
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Only administrators can access the audit log.
          </p>
          <div className="mt-6">
            <Link
              href={`/teams/${teamId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Team
            </Link>
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
      <nav className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
        <Link href="/teams" className="hover:text-gray-700">
          Teams
        </Link>
        <span>›</span>
        <Link href={`/teams/${teamId}`} className="hover:text-gray-700">
          {team.name}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Audit Log</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Admin Only
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Organization-wide audit trail for {team.name}
          </p>
        </div>
        <Link
          href={`/teams/${teamId}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Team
        </Link>
      </div>

      {/* Audit Log Table */}
      <AuditLogTable teamId={teamId} initialEntries={auditResponse.logs} totalCount={auditResponse.total} />
    </div>
  );
}
