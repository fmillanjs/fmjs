'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ConflictWarningProps {
  taskId: string;
  message: string;
  onReload: () => void;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export function ConflictWarning({
  taskId,
  message,
  onReload,
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
    onDismiss();
  };

  const handleReload = () => {
    onReload();
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
      <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        <p className="text-sm opacity-90">
          Choose to reload the latest version or keep your changes.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleReload}
          className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          aria-label="Reload task from server"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reload
        </button>
        <button
          onClick={handleDismiss}
          className="rounded border border-amber-300 px-3 py-1.5 text-sm font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          aria-label="Keep my changes and dismiss warning"
        >
          Keep My Changes
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded transition-colors"
        aria-label="Close conflict warning"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
