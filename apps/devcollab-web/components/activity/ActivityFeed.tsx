'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
const REFRESH_INTERVAL_MS = 30_000;

type ActivityEvent = {
  id: string;
  type: string;
  entityId: string;
  entityType: string;
  createdAt: string;
  workspaceSlug?: string;
  actor: { id: string; name: string | null; email: string };
};

function activityLabel(event: ActivityEvent): string {
  const actor = event.actor.name ?? event.actor.email;
  switch (event.type) {
    case 'MemberJoined':   return `${actor} joined the workspace`;
    case 'PostCreated':    return `${actor} created a post`;
    case 'PostUpdated':    return `${actor} updated a post`;
    case 'SnippetCreated': return `${actor} created a snippet`;
    case 'SnippetUpdated': return `${actor} updated a snippet`;
    default:               return `${actor} performed an action`;
  }
}

function entityLink(event: ActivityEvent, slug: string): string | null {
  if (event.entityType === 'Post') return `/w/${slug}/posts/${event.entityId}`;
  if (event.entityType === 'Snippet') return `/w/${slug}/snippets/${event.entityId}`;
  return null;
}

export default function ActivityFeed({
  slug,
  initialEvents,
  initialNextCursor,
}: {
  slug: string;
  initialEvents: ActivityEvent[];
  initialNextCursor: string | null;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFirstPage = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/activity`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        // MERGE new events at top — do NOT replace existing list (prevents Load More collapse)
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = (data.events as ActivityEvent[]).filter(
            (e) => !existingIds.has(e.id),
          );
          return newEvents.length > 0 ? [...newEvents, ...prev] : prev;
        });
        // Do NOT update nextCursor on a refresh poll — keep the existing pagination cursor
      }
    } catch {
      // Network error — keep current list
    }
  }, [slug]);

  // 30-second refresh poll for new events at the top
  useEffect(() => {
    const id = setInterval(fetchFirstPage, REFRESH_INTERVAL_MS);
    return () => clearInterval(id); // REQUIRED: cleanup on unmount
  }, [fetchFirstPage]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const url = `${API_URL}/workspaces/${slug}/activity?cursor=${encodeURIComponent(nextCursor)}`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => [...prev, ...(data.events as ActivityEvent[])]);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  if (events.length === 0) {
    return (
      <p style={{ color: '#6b7280', fontSize: '14px' }}>
        No activity yet. Create posts, snippets, or invite members to see events here.
      </p>
    );
  }

  return (
    <div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {events.map((event) => {
          const link = entityLink(event, slug);
          return (
            <li
              key={event.id}
              style={{
                padding: '0.75rem 0',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '14px', color: '#111827' }}>
                  {link ? (
                    <a href={link} style={{ color: '#111827', textDecoration: 'none' }}>
                      {activityLabel(event)}
                    </a>
                  ) : (
                    activityLabel(event)
                  )}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
      {nextCursor && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '0.5rem 1.5rem',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#374151',
            }}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
