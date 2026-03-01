import Link from 'next/link';
import { ScoreBar } from './score-bar';
import type { LeadSummary } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  complete: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function LeadTable({ leads }: { leads: LeadSummary[] }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No leads yet. Submit your first lead above.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industry</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">ICP Score</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {lead.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{lead.companyName}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.industry ?? '—'}</td>
              <td className="px-4 py-3">
                {lead.icpScore !== null ? (
                  <ScoreBar score={lead.icpScore} />
                ) : (
                  <span className="text-muted-foreground text-xs">Pending</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] ?? ''}`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(lead.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
