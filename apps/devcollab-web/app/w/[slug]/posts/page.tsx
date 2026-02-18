import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getPosts(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const res = await fetch(`${API_URL}/workspaces/${slug}/posts`, {
    headers: token ? { Cookie: `devcollab_token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPosts(slug);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Posts</h1>
        <a
          href={`/w/${slug}/posts/new`}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          New Post
        </a>
      </div>

      {posts.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No posts yet. Write the first one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map((post: { id: string; title: string; status: string; author: { name?: string; email: string }; createdAt: string }) => (
            <li
              key={post.id}
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <a
                  href={`/w/${slug}/posts/${post.id}`}
                  style={{ fontWeight: 600, textDecoration: 'none', color: '#111827' }}
                >
                  {post.title}
                </a>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: post.status === 'Published' ? '#dcfce7' : '#f3f4f6',
                    color: post.status === 'Published' ? '#166534' : '#6b7280',
                  }}
                >
                  {post.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                by {post.author?.name ?? post.author?.email} · {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
