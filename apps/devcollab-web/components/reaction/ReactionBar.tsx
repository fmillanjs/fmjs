'use client';
import { useState } from 'react';

const EMOJI_MAP: Record<string, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  plus_one: '+1',
  laugh: '😄',
};

interface Reaction { emoji: string; userId: string; }

interface Props {
  postId?: string;
  commentId?: string;
  initialReactions: Reaction[];
  currentUserId: string;
  workspaceSlug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

export default function ReactionBar({ postId, commentId, initialReactions, currentUserId, workspaceSlug }: Props) {
  const [reactions, setReactions] = useState(initialReactions);
  const [pending, setPending] = useState<string | null>(null);

  const toggle = async (emoji: string) => {
    if (pending) return; // debounce: ignore while a request is in-flight
    setPending(emoji);
    const alreadyReacted = reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
    setReactions(prev =>
      alreadyReacted
        ? prev.filter(r => !(r.emoji === emoji && r.userId === currentUserId))
        : [...prev, { emoji, userId: currentUserId }]
    );
    try {
      await fetch(`${API_URL}/workspaces/${workspaceSlug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji, postId, commentId }),
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
      {Object.entries(EMOJI_MAP).map(([key, emoji]) => {
        const count = reactions.filter(r => r.emoji === key).length;
        const active = reactions.some(r => r.emoji === key && r.userId === currentUserId);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            disabled={pending === key}
            style={{
              padding: '4px 10px',
              border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '999px',
              background: active ? '#eff6ff' : 'white',
              cursor: pending ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: pending === key ? 0.6 : 1,
            }}
          >
            {emoji} {count > 0 ? count : ''}
          </button>
        );
      })}
    </div>
  );
}
