'use client';
import { useState, useEffect, useCallback } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export interface CommentNode {
  id: string;
  content: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  parentId: string | null;
  author: { id: string; name: string | null; email: string };
  reactions: Array<{ id: string; emoji: string; userId: string }>;
  replies: CommentNode[];
}

interface Props {
  workspaceSlug: string;
  postId?: string;
  snippetId?: string;
  currentUserId: string;
  initialComments?: CommentNode[];
}

export default function ThreadedComments({
  workspaceSlug,
  postId,
  snippetId,
  currentUserId,
  initialComments,
}: Props) {
  const [comments, setComments] = useState<CommentNode[]>(initialComments ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = postId ? `postId=${postId}` : `snippetId=${snippetId}`;
      const res = await fetch(`${API_URL}/workspaces/${workspaceSlug}/comments?${query}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setError('Failed to load comments');
        return;
      }
      const data: CommentNode[] = await res.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, postId, snippetId]);

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
    }
  }, [initialComments]);

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
        Discussion ({comments.length} comment{comments.length !== 1 ? 's' : ''})
      </h3>

      <CommentForm
        workspaceSlug={workspaceSlug}
        postId={postId}
        snippetId={snippetId}
        onSuccess={refresh}
        placeholder="Write a comment…"
      />

      {loading && <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading comments...</p>}
      {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          workspaceSlug={workspaceSlug}
          postId={postId}
          snippetId={snippetId}
          onRefresh={refresh}
        />
      ))}
    </section>
  );
}
