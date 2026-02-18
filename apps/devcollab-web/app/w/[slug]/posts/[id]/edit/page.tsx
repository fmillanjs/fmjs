'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostEditor from '../../../../../../components/post/PostEditor';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function EditPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const router = useRouter();

  const [post, setPost] = useState<{ title: string; content: string; status: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/workspaces/${slug}/posts/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => {
        setPost(p);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [slug, id]);

  const handleSave = async (title: string, content: string, status: 'Draft' | 'Published') => {
    setSaving(true);
    setError('');

    // Update content
    const updateRes = await fetch(`${API_URL}/workspaces/${slug}/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content }),
    });

    if (!updateRes.ok) {
      const data = await updateRes.json().catch(() => ({}));
      setError(data.message ?? 'Failed to update post');
      setSaving(false);
      return;
    }

    // Set status if changed
    if (status !== post?.status) {
      await fetch(`${API_URL}/workspaces/${slug}/posts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
    }

    setSaving(false);
    router.push(`/w/${slug}/posts/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API_URL}/workspaces/${slug}/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    router.push(`/w/${slug}/posts`);
  };

  if (fetching) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!post) return <div style={{ padding: '2rem' }}>Post not found.</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Post</h1>
        <button
          onClick={handleDelete}
          style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
        >
          Delete Post
        </button>
      </div>
      <PostEditor
        initialTitle={post.title}
        initialContent={post.content}
        onSave={handleSave}
        saving={saving}
        error={error}
      />
    </div>
  );
}
