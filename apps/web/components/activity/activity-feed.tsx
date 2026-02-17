'use client';

import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { ActivityItem } from './activity-item';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  timestamp: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ActivityFeedProps {
  projectId: string;
  initialActivities: AuditLogEntry[];
}

export function ActivityFeed({ projectId, initialActivities }: ActivityFeedProps) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<AuditLogEntry[]>(initialActivities);
  const [hasMore, setHasMore] = useState(initialActivities.length >= 20);
  const [offset, setOffset] = useState(20);

  const token = (session as any)?.accessToken;

  const loadMore = async () => {
    if (!token) return;

    try {
      const response = await api.get<{
        activities: AuditLogEntry[];
        total: number;
        offset: number;
        limit: number;
      }>(`/projects/${projectId}/activity?offset=${offset}&limit=20`, token);

      setActivities((prev) => [...prev, ...response.activities]);
      setOffset((prev) => prev + 20);
      setHasMore(response.activities.length >= 20);
    } catch (error) {
      console.error('Failed to load more activities:', error);
      setHasMore(false);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-card shadow rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-foreground">No activity yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start by creating tasks to see activity here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow rounded-lg">
      <InfiniteScroll
        dataLength={activities.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading more...</div>
          </div>
        }
        endMessage={
          <div className="text-center py-4 text-sm text-muted-foreground">
            You&apos;ve reached the beginning of this project&apos;s history
          </div>
        }
        className="divide-y divide-border"
      >
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </InfiniteScroll>
    </div>
  );
}
