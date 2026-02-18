'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  members: Array<{ role: string; userId: string }>;
}

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/workspaces`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setWorkspaces(data))
      .catch(() => {});
  }, []);

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
        const created = await res.json();
        setWorkspaces((prev) => [...prev, created]);
        setName('');
        setSlug('');
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
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Your Workspaces
        </h2>
        {workspaces.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No workspaces yet. Create one below.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {workspaces.map((ws) => (
              <li key={ws.id} style={{ marginBottom: '0.5rem' }}>
                <a
                  href={`/w/${ws.slug}`}
                  style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                >
                  {ws.name}
                </a>
                <span style={{ color: '#9ca3af', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                  /{ws.slug} · {ws.members?.length ?? 0} member
                  {(ws.members?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Create Workspace
        </h2>
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
      </section>

      <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <a href="/api/logout" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Log out
        </a>
      </div>
    </main>
  );
}
