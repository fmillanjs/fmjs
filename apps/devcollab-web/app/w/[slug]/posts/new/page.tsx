'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostEditor from '../../../../../components/post/PostEditor';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function NewPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (title: string, content: string, status: 'Draft' | 'Published') => {
    setSaving(true);
    setError('');

    const res = await fetch(`${API_URL}/workspaces/${slug}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Failed to create post');
      setSaving(false);
      return;
    }

    const post = await res.json();

    // If Published, set the status after creation (posts default to Draft)
    if (status === 'Published') {
      await fetch(`${API_URL}/workspaces/${slug}/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Published' }),
      });
    }

    setSaving(false);
    router.push(`/w/${slug}/posts/${post.id}`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>New Post</h1>
      <PostEditor onSave={handleSave} saving={saving} error={error} />
    </div>
  );
}
