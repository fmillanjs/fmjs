'use client';
import { useState, useEffect, useRef } from 'react';
import SearchResults from './SearchResults';

type PostResult = {
  id: string;
  title: string;
  status: string;
  headline: string;
  workspaceId: string;
  authorId: string;
};

type SnippetResult = {
  id: string;
  title: string;
  language: string;
  headline: string;
  workspaceId: string;
  authorId: string;
};

type SearchResultsData = {
  posts: PostResult[];
  snippets: SnippetResult[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export default function SearchModal({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Prevents browser address bar from stealing focus
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when modal opens; reset when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  // Debounced search: 300ms after user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/workspaces/${slug}/search?q=${encodeURIComponent(query)}`,
          { credentials: 'include' },
        );
        if (res.ok) {
          setResults(await res.json());
        }
      } catch {
        // Network error — silently fail, results stay null
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, slug]);

  if (!open) return null;

  return (
    <>
      {/* mark tag styling — scoped to search modal */}
      <style>{`
        mark {
          background: #fef3c7;
          color: #92400e;
          padding: 0 2px;
          border-radius: 2px;
          font-style: normal;
        }
      `}</style>

      {/* Backdrop — click to close */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          maxWidth: '90vw',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
          zIndex: 101,
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts and snippets... (Esc to close)"
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            borderBottom: '1px solid #e5e7eb',
            boxSizing: 'border-box',
          }}
        />
        <SearchResults results={results} loading={loading} slug={slug} />
      </div>
    </>
  );
}
