// WCAG Contrast Fix (Phase 07.1-03): Changed border-white to border-gray-200 for visibility on white backgrounds
'use client';

import { useProjectPresence } from '@/hooks/use-project-presence';

interface PresenceIndicatorProps {
  projectId: string;
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-orange-500'];

export function PresenceIndicator({ projectId }: PresenceIndicatorProps) {
  const { activeUsers, count } = useProjectPresence(projectId);

  // Don't show indicator if only 0 or 1 user (self only)
  if (count === 0 || count === 1) {
    return null;
  }

  // Show max 3 avatars, then "+N more" if more than 3
  const displayedUsers = activeUsers.slice(0, 3);
  const remainingCount = Math.max(0, count - 3);

  return (
    <div className="flex items-center gap-2">
      {/* Avatar circles */}
      <div className="flex -space-x-2">
        {displayedUsers.map((user, index) => {
          const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const initial = (user.name?.[0] || user.email[0] || '?').toUpperCase();
          const displayName = user.name || user.email;

          return (
            <div
              key={user.userId}
              className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-medium border-2 border-gray-200 dark:border-gray-700`}
              title={displayName}
            >
              {initial}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-gray-200 dark:border-gray-700"
            title={`${remainingCount} more ${remainingCount === 1 ? 'user' : 'users'}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* User count text */}
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {count} active {count === 1 ? 'user' : 'users'}
      </span>
    </div>
  );
}
