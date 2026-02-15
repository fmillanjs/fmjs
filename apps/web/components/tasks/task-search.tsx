'use client';

import { useTransition, useEffect, useState } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Search, X } from 'lucide-react';

export function TaskSearch() {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [inputValue, setInputValue] = useState(search);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setSearch(inputValue || null);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, setSearch]);

  // Sync input with URL on mount
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleClear = () => {
    setInputValue('');
    startTransition(() => {
      setSearch(null);
    });
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search tasks..."
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
