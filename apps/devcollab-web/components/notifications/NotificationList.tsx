'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string | null; email: string };
  comment: { id: string; postId: string | null; snippetId: string | null } | null;
  workspace: { id: string; slug: string; name: string };
};

function notificationLink(n: NotificationItem): string {
  if (n.comment?.postId) return `/w/${n.workspace.slug}/posts/${n.comment.postId}`;
  if (n.comment?.snippetId) return `/w/${n.workspace.slug}/snippets/${n.comment.snippetId}`;
  return `/w/${n.workspace.slug}`;
}

export default function NotificationList({ onCountChange }: { onCountChange: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    onCountChange();
  };

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange();
  };

  if (loading) return <div style={{ padding: '1rem', fontSize: '14px' }}>Loading...</div>;
  if (notifications.length === 0) {
    return <div style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>No notifications</div>;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
          <button
            onClick={markAllRead}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#3b82f6',
              padding: 0,
            }}
          >
            Mark all read
          </button>
        </div>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '320px', overflowY: 'auto' }}>
        {notifications.map((n) => {
          const actor = n.actor.name ?? n.actor.email;
          return (
            <li
              key={n.id}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #f3f4f6',
                background: n.read ? 'white' : '#eff6ff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <div>
                <a
                  href={notificationLink(n)}
                  style={{ color: '#111827', textDecoration: 'none', fontSize: '13px' }}
                >
                  <strong>{actor}</strong> mentioned you
                </a>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#3b82f6',
                    whiteSpace: 'nowrap',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  Mark read
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
