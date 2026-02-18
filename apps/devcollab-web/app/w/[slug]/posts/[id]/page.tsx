import MarkdownRenderer from '../../../../../components/post/MarkdownRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getPost(slug: string, id: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/posts/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const post = await getPost(slug, id);

  if (!post) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Post not found</h1>
        <a href={`/w/${slug}/posts`}>Back to posts</a>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{post.title}</h1>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              by {post.author?.name ?? post.author?.email} ·{' '}
              {post.publishedAt
                ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                : `Draft — ${new Date(post.createdAt).toLocaleDateString()}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href={`/w/${slug}/posts/${id}/edit`}
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}
            >
              Edit
            </a>
            <a
              href={`/w/${slug}/posts`}
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}
            >
              Back
            </a>
          </div>
        </div>
      </div>
      <hr style={{ marginBottom: '1.5rem', borderColor: '#e5e7eb' }} />
      <MarkdownRenderer content={post.content} />
    </div>
  );
}
