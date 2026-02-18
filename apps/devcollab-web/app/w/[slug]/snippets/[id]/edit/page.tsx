'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LanguageSelector from '../../../../../../components/snippet/LanguageSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function EditSnippetPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/workspaces/${slug}/snippets/${id}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((s) => {
        setTitle(s.title);
        setLanguage(s.language);
        setCode(s.code);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [slug, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch(`${API_URL}/workspaces/${slug}/snippets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, language, code }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/w/${slug}/snippets/${id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Failed to update snippet');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this snippet?')) return;
    await fetch(`${API_URL}/workspaces/${slug}/snippets/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    router.push(`/w/${slug}/snippets`);
  };

  if (fetching) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Edit Snippet</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Language</label>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            rows={12}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}
          />
        </div>

        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <a
              href={`/w/${slug}/snippets/${id}`}
              style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151' }}
            >
              Cancel
            </a>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
