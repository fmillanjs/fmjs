'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'board' | 'list';
  onChange: (view: 'board' | 'list') => void;
}

export function ViewToggle({ currentView, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
      <button
        onClick={() => onChange('board')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${
            currentView === 'board'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <LayoutGrid className="w-4 h-4" />
        Board
      </button>
      <button
        onClick={() => onChange('list')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${
            currentView === 'list'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <List className="w-4 h-4" />
        List
      </button>
    </div>
  );
}
