import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getSnippets(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const res = await fetch(`${API_URL}/workspaces/${slug}/snippets`, {
    headers: token ? { Cookie: `devcollab_token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function SnippetsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snippets = await getSnippets(slug);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Snippets</h1>
        <a
          href={`/w/${slug}/snippets/new`}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          New Snippet
        </a>
      </div>

      {snippets.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No snippets yet. Create the first one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {snippets.map((snippet: { id: string; title: string; language: string; author: { name?: string; email: string }; createdAt: string }) => (
            <li
              key={snippet.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <a
                href={`/w/${slug}/snippets/${snippet.id}`}
                style={{ fontWeight: 600, textDecoration: 'none', color: '#111827' }}
              >
                {snippet.title}
              </a>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {snippet.language} · by {snippet.author?.name ?? snippet.author?.email} · {new Date(snippet.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
