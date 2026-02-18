import { cookies } from 'next/headers';
import SnippetCodeBlock from '../../../../../components/snippet/SnippetCodeBlock';
import ThreadedComments from '../../../../../components/discussion/ThreadedComments';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getSnippet(slug: string, id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const res = await fetch(`${API_URL}/workspaces/${slug}/snippets/${id}`, {
    headers: token ? { Cookie: `devcollab_token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `devcollab_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as { sub: string; email: string };
}

async function getComments(slug: string, snippetId: string, token?: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/comments?snippetId=${snippetId}`, {
    headers: token ? { Cookie: `devcollab_token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function SnippetDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const snippet = await getSnippet(slug, id);

  if (!snippet) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Snippet not found</h1>
        <a href={`/w/${slug}/snippets`}>Back to snippets</a>
      </div>
    );
  }

  const currentUser = token ? await getCurrentUser(token) : null;
  const initialComments = await getComments(slug, snippet.id, token);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{snippet.title}</h1>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {snippet.language} · by {snippet.author?.name ?? snippet.author?.email} · {new Date(snippet.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href={`/w/${slug}/snippets/${id}/edit`}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}
          >
            Edit
          </a>
          <a
            href={`/w/${slug}/snippets`}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}
          >
            Back
          </a>
        </div>
      </div>

      <SnippetCodeBlock code={snippet.code} lang={snippet.language} />
      <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        <ThreadedComments
          workspaceSlug={slug}
          snippetId={snippet.id}
          currentUserId={currentUser?.sub ?? ''}
          initialComments={initialComments}
        />
      </div>
    </div>
  );
}
