'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConflictWarningProps {
  message: string;
  onRefresh: () => void;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export function ConflictWarning({
  message,
  onRefresh,
  onDismiss,
  autoHideDuration = 10000,
}: ConflictWarningProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleRefresh = () => {
    onRefresh();
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-up">
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Conflict Detected
            </h3>
            <p className="text-sm text-amber-800 mb-3">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium bg-white text-amber-900 border border-amber-300 rounded hover:bg-amber-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility to show conflict warning (for programmatic usage)
export function showConflictWarning(message: string, onRefresh: () => void) {
  // This is a helper that can be used with state management
  // In practice, you'd use React state to control this
  return {
    message,
    onRefresh,
  };
}
