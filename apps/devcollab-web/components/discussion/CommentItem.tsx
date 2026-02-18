'use client';
import { useState } from 'react';
import ReactionBar from '../reaction/ReactionBar';
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
  comment: CommentNode;
  currentUserId: string;
  workspaceSlug: string;
  postId?: string;
  snippetId?: string;
  onRefresh: () => void;
}

export default function CommentItem({
  comment,
  currentUserId,
  workspaceSlug,
  postId,
  snippetId,
  onRefresh,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDeleted = comment.deletedAt !== null || comment.content === '[deleted]';
  const isOwner = comment.authorId === currentUserId;
  const isEdited = comment.updatedAt !== comment.createdAt;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/workspaces/${workspaceSlug}/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/workspaces/${workspaceSlug}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setIsEditing(false);
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem', paddingLeft: comment.parentId ? '1.5rem' : '0', borderLeft: comment.parentId ? '2px solid #e5e7eb' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {comment.author?.name ?? comment.author?.email}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {new Date(comment.createdAt).toLocaleDateString()}
          {isEdited && !isDeleted && (
            <span style={{ marginLeft: '4px' }}>(edited)</span>
          )}
        </span>
      </div>

      {isDeleted ? (
        <em style={{ color: '#9ca3af' }}>[deleted]</em>
      ) : isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
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
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleSaveEdit}
              disabled={loading || !editContent.trim()}
              style={{
                padding: '4px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '4px 12px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 4px 0' }}>{comment.content}</p>
      )}

      {!isDeleted && (
        <ReactionBar
          commentId={comment.id}
          initialReactions={comment.reactions}
          currentUserId={currentUserId}
          workspaceSlug={workspaceSlug}
        />
      )}

      {!isDeleted && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '6px' }}>
          {comment.parentId === null && (
            <button
              onClick={() => setShowReplyForm(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '2px 0',
              }}
            >
              {showReplyForm ? 'Cancel reply' : 'Reply'}
            </button>
          )}
          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  padding: '2px 0',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {showReplyForm && comment.parentId === null && (
        <div style={{ marginTop: '0.5rem' }}>
          <CommentForm
            workspaceSlug={workspaceSlug}
            postId={postId}
            snippetId={snippetId}
            parentId={comment.id}
            onSuccess={() => {
              setShowReplyForm(false);
              onRefresh();
            }}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply…"
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              workspaceSlug={workspaceSlug}
              postId={postId}
              snippetId={snippetId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
