'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Icon */}
        <AlertTriangle className="w-24 h-24 mx-auto text-[var(--red-9)]" />

        {/* Error Heading */}
        <h1 className="text-3xl font-bold text-foreground">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
