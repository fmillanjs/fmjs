'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      if (res.ok) {
        setName('');
        setSlug('');
        router.refresh(); // re-runs server component, re-fetches workspace list
      } else {
        const data = await res.json();
        setError(data.message ?? 'Failed to create workspace');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px' }}>
      <input
        type="text"
        placeholder="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
      />
      <input
        type="text"
        placeholder="Slug (optional, auto-generated)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
      />
      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
      <button
        type="submit"
        disabled={creating}
        style={{
          padding: '0.5rem 1rem',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: creating ? 'not-allowed' : 'pointer',
        }}
      >
        {creating ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
