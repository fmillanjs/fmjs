'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Props {
  workspaceSlug: string;
  postId?: string;
  snippetId?: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  workspaceSlug,
  postId,
  snippetId,
  parentId,
  onSuccess,
  onCancel,
  placeholder,
}: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body: Record<string, string> = { content };
    if (postId) body.postId = postId;
    if (snippetId) body.snippetId = snippetId;
    if (parentId) body.parentId = parentId;

    try {
      const res = await fetch(`${API_URL}/workspaces/${workspaceSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError(res.statusText || 'Failed to post comment');
        setLoading(false);
        return;
      }

      setContent('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder ?? 'Write a comment…'}
        rows={3}
        disabled={loading}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            padding: '6px 14px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !content.trim() ? 0.6 : 1,
          }}
        >
          {parentId ? 'Reply' : 'Post comment'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
