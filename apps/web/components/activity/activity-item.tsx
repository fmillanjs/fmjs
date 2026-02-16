'use client';

import { formatDistanceToNow } from 'date-fns';

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

interface ActivityItemProps {
  activity: AuditLogEntry;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const formatActivityDescription = (entry: AuditLogEntry): string => {
    const action = entry.action.toLowerCase();

    // Task events
    if (entry.entityType === 'Task') {
      if (action.includes('created')) {
        return 'created task';
      }
      if (action.includes('deleted')) {
        return 'deleted task';
      }
      if (action.includes('status_changed')) {
        const changes = entry.changes;
        if (changes?.previousStatus && changes?.newStatus) {
          return `moved task from ${formatStatus(changes.previousStatus)} to ${formatStatus(changes.newStatus)}`;
        }
        return 'changed task status';
      }
      if (action.includes('updated')) {
        const changes = entry.changes;
        if (changes?.previous && changes?.current) {
          const fieldChanges: string[] = [];

          if (changes.previous.priority !== changes.current.priority) {
            fieldChanges.push('priority');
          }
          if (changes.previous.assigneeId !== changes.current.assigneeId) {
            fieldChanges.push('assignee');
          }
          if (changes.previous.dueDate !== changes.current.dueDate) {
            fieldChanges.push('due date');
          }
          if (changes.previous.title !== changes.current.title) {
            fieldChanges.push('title');
          }
          if (changes.previous.description !== changes.current.description) {
            fieldChanges.push('description');
          }

          if (fieldChanges.length > 0) {
            return `updated task ${fieldChanges.join(', ')}`;
          }
        }
        return 'updated task';
      }
    }

    // Comment events
    if (entry.entityType === 'Comment') {
      if (action.includes('created')) {
        return 'added a comment';
      }
      if (action.includes('updated')) {
        return 'updated a comment';
      }
      if (action.includes('deleted')) {
        return 'deleted a comment';
      }
    }

    // Project events
    if (entry.entityType === 'Project') {
      if (action.includes('created')) {
        return 'created project';
      }
      if (action.includes('updated')) {
        return 'updated project';
      }
      if (action.includes('archived')) {
        return 'archived project';
      }
      if (action.includes('deleted')) {
        return 'deleted project';
      }
    }

    // Organization/Membership events
    if (entry.entityType === 'Organization') {
      if (action.includes('created')) {
        return 'created team';
      }
      if (action.includes('updated')) {
        return 'updated team';
      }
    }

    if (entry.entityType === 'Membership') {
      if (action.includes('invited')) {
        return 'invited a member to the team';
      }
      if (action.includes('removed')) {
        return 'removed a member from the team';
      }
    }

    // Fallback
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

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {activity.actor.image ? (
          <img
            src={activity.actor.image}
            alt={activity.actor.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {activity.actor.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.actor.name || 'Unknown User'}</span>
          {' '}
          <span className="text-gray-600">{formatActivityDescription(activity)}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
