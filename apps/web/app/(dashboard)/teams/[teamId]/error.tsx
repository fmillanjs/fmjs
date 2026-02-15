'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Team page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="max-w-md w-full bg-card dark:bg-gray-950 border border-border rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Failed to load team</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'An unexpected error occurred while loading this team.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/teams"
            className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
          >
            Back to Teams
          </Link>
        </div>
      </div>
    </div>
  );
}
