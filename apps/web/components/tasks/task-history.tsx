'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';

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

interface TaskHistoryProps {
  taskId: string;
  projectId: string;
}

export function TaskHistory({ taskId, projectId }: TaskHistoryProps) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const token = (session as any)?.accessToken;

  useEffect(() => {
    if (!token) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project activity and filter for this task
        const response = await api.get<{
          activities: AuditLogEntry[];
          total: number;
          offset: number;
          limit: number;
        }>(
          `/projects/${projectId}/activity?offset=${offset}&limit=20&entityType=Task&entityType=Comment`,
          token
        );

        // Filter activities to only show events for this task
        const taskActivities = response.activities.filter((activity) => {
          if (activity.entityType === 'Task') {
            return activity.entityId === taskId;
          }
          // For comments, we need to check if the comment belongs to this task
          // The API should ideally handle this, but we'll filter client-side for now
          return activity.entityType === 'Comment';
        });

        setHistory((prev) => (offset === 0 ? taskActivities : [...prev, ...taskActivities]));
        setHasMore(response.activities.length === 20);
      } catch (err) {
        console.error('Failed to fetch task history:', err);
        setError('Failed to load task history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [token, projectId, taskId, offset]);

  const formatActivityDescription = (entry: AuditLogEntry): string => {
    const action = entry.action.toLowerCase();

    if (action.includes('created')) {
      if (entry.entityType === 'Task') {
        return 'Created this task';
      } else if (entry.entityType === 'Comment') {
        return 'Added a comment';
      }
      return `Created ${entry.entityType.toLowerCase()}`;
    }

    if (action.includes('deleted')) {
      if (entry.entityType === 'Comment') {
        return 'Deleted a comment';
      }
      return `Deleted ${entry.entityType.toLowerCase()}`;
    }

    if (action.includes('status_changed')) {
      const changes = entry.changes;
      if (changes?.previousStatus && changes?.newStatus) {
        return `Changed status from ${formatStatus(changes.previousStatus)} to ${formatStatus(changes.newStatus)}`;
      }
      return 'Changed status';
    }

    if (action.includes('updated')) {
      if (entry.entityType === 'Comment') {
        return 'Updated a comment';
      }

      const changes = entry.changes;
      if (changes?.previous && changes?.current) {
        const fieldChanges: string[] = [];

        // Detect which fields changed
        if (changes.previous.priority !== changes.current.priority) {
          fieldChanges.push(
            `priority from ${formatPriority(changes.previous.priority)} to ${formatPriority(changes.current.priority)}`
          );
        }

        if (changes.previous.assigneeId !== changes.current.assigneeId) {
          if (!changes.current.assigneeId) {
            fieldChanges.push('unassigned the task');
          } else if (!changes.previous.assigneeId) {
            fieldChanges.push('assigned the task');
          } else {
            fieldChanges.push('changed assignee');
          }
        }

        if (changes.previous.dueDate !== changes.current.dueDate) {
          if (!changes.current.dueDate) {
            fieldChanges.push('removed due date');
          } else if (!changes.previous.dueDate) {
            fieldChanges.push('set due date');
          } else {
            fieldChanges.push('changed due date');
          }
        }

        if (changes.previous.title !== changes.current.title) {
          fieldChanges.push('changed title');
        }

        if (changes.previous.description !== changes.current.description) {
          fieldChanges.push('updated description');
        }

        if (fieldChanges.length > 0) {
          return `Changed ${fieldChanges.join(', ')}`;
        }
      }

      return 'Updated task';
    }

    return entry.action.replace(/_/g, ' ').toLowerCase();
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      DONE: 'Done',
      BLOCKED: 'Blocked',
    };
    return statusMap[status] || status;
  };

  const formatPriority = (priority: string): string => {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + 20);
  };

  if (isLoading && offset === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground italic">
        No history yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline entries */}
        <div className="space-y-6">
          {history.map((entry) => (
            <div key={entry.id} className="flex gap-4 relative">
              {/* Avatar/Icon */}
              {/* WCAG Contrast Fix (Phase 07.1-03): Changed border-white to border-gray-200 for visibility */}
              <div className="flex-shrink-0 z-10">
                {entry.actor.image ? (
                  <img
                    src={entry.actor.image}
                    alt={entry.actor.name || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium border-2 border-border">
                    {entry.actor.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="text-sm text-foreground">
                  <span className="font-medium">{entry.actor.name || 'Unknown User'}</span>
                  {' '}
                  <span className="text-muted-foreground">{formatActivityDescription(entry)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-muted-foreground"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
