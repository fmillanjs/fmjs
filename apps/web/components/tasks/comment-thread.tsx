'use client';

import { useState } from 'react';
import { CommentWithAuthor } from '@repo/shared/types';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  taskId: string;
  onUpdate: () => void;
}

export function CommentThread({ comments, taskId, onUpdate }: CommentThreadProps) {
  const { data: session } = useSession();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  const token = (session as any)?.accessToken;
  const userId = session?.user?.id;

  const handleEditStart = (comment: CommentWithAuthor) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleEditSave = async (commentId: string) => {
    if (!token || !editedContent.trim()) return;

    try {
      await api.patch(`/comments/${commentId}`, { content: editedContent.trim() }, token);
      setEditingCommentId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`, token);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        No comments yet. Be the first to comment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isAuthor = userId === comment.authorId;
        const showActions = isAuthor && hoveredCommentId === comment.id;

        return (
          <div
            key={comment.id}
            className="flex gap-3 group"
            onMouseEnter={() => setHoveredCommentId(comment.id)}
            onMouseLeave={() => setHoveredCommentId(null)}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {comment.author.image ? (
                <img
                  src={comment.author.image}
                  alt={comment.author.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {comment.author.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {comment.author.name || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>

              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(comment.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</div>
              )}

              {/* Actions (Edit/Delete) - visible on hover */}
              {showActions && editingCommentId !== comment.id && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditStart(comment)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
