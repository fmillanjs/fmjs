'use client';
import { useState, useEffect, useCallback } from 'react';
import NotificationList from './NotificationList';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
const POLL_INTERVAL_MS = 60_000;

export default function BellIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // Network error — keep last known count
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(id); // REQUIRED: cleanup prevents interval leak on remount
  }, [fetchUnreadCount]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '4px',
        }}
      >
        {'\uD83D\uDD14'}
      </button>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '999px',
            fontSize: '11px',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            pointerEvents: 'none',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Notifications</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}
            >
              x
            </button>
          </div>
          <NotificationList onCountChange={fetchUnreadCount} />
        </div>
      )}
    </div>
  );
}
