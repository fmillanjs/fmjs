import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLead } from '@/lib/api';
import { PipelineMonitor } from '@/components/leads/pipeline-monitor';
import type { QualifyOutput, EnrichOutput } from '@/lib/api';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  let lead;
  try {
    lead = await getLead(id);
  } catch {
    notFound();
  }

  // Find AI output records by step name (constants from Phase 43 pipeline.service.ts)
  const qualifyOutput = lead.aiOutputs.find((o) => o.step === 'qualify')?.content as QualifyOutput | undefined;
  const enrichOutput = lead.aiOutputs.find((o) => o.step === 'enrich')?.content as EnrichOutput | undefined;
  const personalizeOutput = lead.aiOutputs.find((o) => o.step === 'personalize')?.content as { email: string } | undefined;

  // CRITICAL: Only open SSE EventSource for 'pending' leads.
  // 'processing' = pipeline already running (refresh mid-run) — don't trigger again.
  // 'complete' | 'failed' = render static data only.
  const shouldStream = lead.status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/leads" className="hover:text-foreground">Leads</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{lead.name}</span>
        </nav>

        {/* Lead Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
          <p className="text-muted-foreground mt-1">{lead.companyName}</p>
          {lead.companyUrl && (
            <a
              href={lead.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {lead.companyUrl}
            </a>
          )}
        </div>

        {/* Pipeline Monitor — handles both streaming and static rendering */}
        {/* Plans 03 and 04 both render here: PipelineMonitor (03) + score/enrichment cards (04) */}
        <PipelineMonitor
          leadId={id}
          shouldStream={shouldStream}
          initialEmailText={personalizeOutput?.email}
        />

        {/* Plans 04 will add ScoreCard and EnrichmentCard here, below PipelineMonitor */}
        {/* Placeholder slots for Plan 04 components — rendered only for complete leads */}
        {lead.status === 'complete' && qualifyOutput && (
          <div id="score-section" className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">
              ICP Score: {qualifyOutput.icpScore} — Score details rendered in Plan 04
            </p>
          </div>
        )}

        {lead.status === 'complete' && enrichOutput && (
          <div id="enrich-section" className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">
              Enrichment: {enrichOutput.industry} — Enrichment card rendered in Plan 04
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
