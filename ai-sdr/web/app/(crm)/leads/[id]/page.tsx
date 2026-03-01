import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLead } from '@/lib/api';
import { PipelineMonitor } from '@/components/leads/pipeline-monitor';
import { ScoreCard } from '@/components/leads/score-card';
import { WhyScoreCard } from '@/components/leads/why-score-card';
import { EnrichmentCard } from '@/components/leads/enrichment-card';
import { EmailPreview } from '@/components/leads/email-preview';
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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

        {/* Pipeline Monitor — step progress + streaming email (Plans 03 + 04) */}
        <PipelineMonitor
          leadId={id}
          shouldStream={shouldStream}
          initialEmailText={personalizeOutput?.email}
        />

        {/* Static AI output cards — only for complete leads */}
        {lead.status === 'complete' && (
          <div className="space-y-4">
            {/* ICP Score with colored bar — PIPE-02 */}
            {qualifyOutput && <ScoreCard qualify={qualifyOutput} />}

            {/* Why this score? collapsible — PIPE-03 */}
            {qualifyOutput && <WhyScoreCard qualify={qualifyOutput} />}

            {/* Enrichment card with intent signal badges — PIPE-05 */}
            {enrichOutput && <EnrichmentCard enrich={enrichOutput} />}

            {/* Email preview with copy button — PIPE-06 + PIPE-08 */}
            {personalizeOutput && (
              <EmailPreview emailText={personalizeOutput.email} />
            )}
          </div>
        )}

        {/* Failed state */}
        {lead.status === 'failed' && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              Pipeline failed for this lead. You can submit a new lead with the same details to retry.
            </p>
          </div>
        )}

        {/* Processing state — don't trigger SSE again, show wait message */}
        {lead.status === 'processing' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Pipeline is running — refresh in a moment to see results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
