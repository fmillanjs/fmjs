'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';

interface CommentFormProps {
  taskId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ taskId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = (session as any)?.accessToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/api/tasks/${taskId}/comments`, { content: content.trim() }, token);
      setContent('');
      onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border pt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
