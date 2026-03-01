'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'running' | 'complete';

interface PipelineState {
  qualify: StepStatus;
  enrich: StepStatus;
  personalize: StepStatus;
  emailText: string;
  done: boolean;
  error: string | null;
}

const STEPS = [
  { key: 'qualify' as const, label: 'Qualify Lead', description: 'Calculating ICP score…' },
  { key: 'enrich' as const, label: 'Enrich CRM', description: 'Gathering company intelligence…' },
  { key: 'personalize' as const, label: 'Generate Email', description: 'Writing personalized outreach…' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PipelineMonitorProps {
  leadId: string;
  /** Only open EventSource when true (lead.status === 'pending') */
  shouldStream: boolean;
  /** Pre-loaded email text for complete leads (from aiOutputs) */
  initialEmailText?: string;
}

export function PipelineMonitor({
  leadId,
  shouldStream,
  initialEmailText,
}: PipelineMonitorProps) {
  const [state, setState] = useState<PipelineState>({
    qualify: shouldStream ? 'running' : 'complete',
    enrich: shouldStream ? 'pending' : 'complete',
    personalize: shouldStream ? 'pending' : 'complete',
    emailText: initialEmailText ?? '',
    done: !shouldStream,
    error: null,
  });

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // CRITICAL: Only open EventSource for pending leads (status === 'pending').
    // Opening for 'complete' or 'processing' leads would trigger duplicate pipeline runs.
    if (!shouldStream) return;

    const es = new EventSource(`${API_URL}/leads/${leadId}/stream`);
    esRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as {
        type: string;
        token?: string;
      };

      if (data.type === 'qualify-complete') {
        setState((prev) => ({ ...prev, qualify: 'complete', enrich: 'running' }));
      } else if (data.type === 'enrich-complete') {
        setState((prev) => ({ ...prev, enrich: 'complete', personalize: 'running' }));
      } else if (data.type === 'token' && data.token) {
        setState((prev) => ({ ...prev, emailText: prev.emailText + data.token }));
      } else if (data.type === 'personalize-complete') {
        setState((prev) => ({ ...prev, personalize: 'complete', done: true }));
        es.close();
      }
    };

    es.onerror = () => {
      // SSE timeout (30s) or pipeline failure — close and show error
      setState((prev) => ({
        ...prev,
        error: 'Pipeline timed out or encountered an error. Refresh to retry.',
      }));
      es.close();
    };

    return () => {
      // Cleanup on unmount — prevents memory leaks when navigating away mid-stream
      es.close();
    };
  }, [leadId, shouldStream]);

  return (
    <div className="space-y-6">
      {/* Step Progress Indicators — PIPE-07 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pipeline Progress</h3>
        <div className="space-y-2">
          {STEPS.map((step) => {
            const status = state[step.key];
            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  status === 'complete' && 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800',
                  status === 'running' && 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800',
                  status === 'pending' && 'border-border bg-muted/30',
                )}
              >
                <div className="flex-shrink-0">
                  {status === 'complete' && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  {status === 'running' && (
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                  {status === 'pending' && (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    status === 'complete' && 'text-green-700 dark:text-green-300',
                    status === 'running' && 'text-blue-700 dark:text-blue-300',
                    status === 'pending' && 'text-muted-foreground',
                  )}>
                    {step.label}
                  </p>
                  {status === 'running' && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        </div>
      )}

      {/* Email Preview — PIPE-06: streams token by token, then shows full email for complete leads */}
      {(state.emailText || state.personalize === 'running') && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Generated Email</h3>
          <div className="rounded-lg border border-border bg-card p-4">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {state.emailText}
              {state.personalize === 'running' && !state.done && (
                <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5" />
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
