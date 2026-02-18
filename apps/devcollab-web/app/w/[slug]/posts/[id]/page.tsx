import { cookies } from 'next/headers';
import MarkdownRenderer from '../../../../../components/post/MarkdownRenderer';
import ThreadedComments from '../../../../../components/discussion/ThreadedComments';
import ReactionBar from '../../../../../components/reaction/ReactionBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getPost(slug: string, id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const res = await fetch(`${API_URL}/workspaces/${slug}/posts/${id}`, {
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

async function getComments(slug: string, postId: string, token?: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/comments?postId=${postId}`, {
    headers: token ? { Cookie: `devcollab_token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  const post = await getPost(slug, id);

  if (!post) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Post not found</h1>
        <a href={`/w/${slug}/posts`}>Back to posts</a>
      </div>
    );
  }

  const currentUser = token ? await getCurrentUser(token) : null;
  const initialComments = await getComments(slug, post.id, token);

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
      <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        <ReactionBar
          postId={post.id}
          initialReactions={post.reactions ?? []}
          currentUserId={currentUser?.sub ?? ''}
          workspaceSlug={slug}
        />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <ThreadedComments
          workspaceSlug={slug}
          postId={post.id}
          currentUserId={currentUser?.sub ?? ''}
          initialComments={initialComments}
        />
      </div>
    </div>
  );
}
