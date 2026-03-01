import { getLeads, type LeadSummary } from '@/lib/api';
import { LeadTable } from '@/components/leads/lead-table';
import { LeadInputForm } from '@/components/leads/lead-input-form';

export default async function LeadsPage() {
  let leads: LeadSummary[] = [];
  try {
    leads = await getLeads();
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    // Render empty table rather than crashing — NestJS may not be running in build
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Intelligence</h1>
          <p className="text-muted-foreground mt-1">Submit a lead to run the AI qualification pipeline</p>
        </div>

        {/* Lead input form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">New Lead</h2>
          <LeadInputForm />
        </div>

        {/* Lead list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">All Leads</h2>
          <LeadTable leads={leads} />
        </div>
      </div>
    </div>
  );
}
