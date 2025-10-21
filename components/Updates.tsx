'use client';

import { useState } from 'react';

interface Update {
  id: number;
  time: string;
  content: string;
  date: string;
  createdAt: Date | null;
}

interface UpdatesProps {
  updates: Update[];
}

export default function Updates({ updates }: UpdatesProps) {
  const [displayedUpdates, setDisplayedUpdates] = useState<Update[]>(() => {
    // Get today's date in the same format as stored in the database
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

    // Filter to show only today's updates
    return updates.filter(update => update.date === todayStr);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(() => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
    return updates.some(update => update.date !== todayStr);
  });

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/updates');
      const allUpdates: Update[] = await response.json();

      setDisplayedUpdates(allUpdates);
      setHasMore(false);
    } catch (error) {
      console.error('Failed to load more updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Daily Updates</h2>
      <p className="text-gray-600 text-sm mb-6">Raw, unfiltered progress</p>

      <div className="space-y-4">
        {displayedUpdates.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-base font-semibold mb-1">No updates yet</h3>
            <p className="text-gray-600 text-sm">First update coming at 6am...</p>
          </div>
        ) : (
          <>
            {displayedUpdates.map((update) => (
              <div
                key={update.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded">
                      {update.time}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed mb-1">{update.content}</p>
                    <span className="text-xs text-gray-500">{update.date}</span>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load More Updates'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
