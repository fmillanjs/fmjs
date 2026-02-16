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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Icon */}
        <AlertTriangle className="w-24 h-24 mx-auto text-red-600 dark:text-red-400" />

        {/* Error Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-600 dark:text-gray-300">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
