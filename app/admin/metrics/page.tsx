'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalViews: number;
  recentViews: number;
  monthViews: number;
  topPages: Array<{ page: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  dailyViews: Array<{ date: string; count: number }>;
  latestViews: Array<{
    id: number;
    page: string;
    referrer: string | null;
    country: string | null;
    city: string | null;
    userAgent: string | null;
    visitedAt: string;
  }>;
}

export default function MetricsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Analytics & Metrics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Views</p>
          <p className="text-4xl font-bold">{analytics.totalViews}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Last 7 Days</p>
          <p className="text-4xl font-bold text-blue-600">{analytics.recentViews}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Last 30 Days</p>
          <p className="text-4xl font-bold text-green-600">{analytics.monthViews}</p>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Top Pages</h2>
        {analytics.topPages.length === 0 ? (
          <p className="text-gray-600">No page data yet</p>
        ) : (
          <div className="space-y-2">
            {analytics.topPages.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
              >
                <span className="font-medium">{item.page}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">
                  {item.count} views
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Countries & Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Countries */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Top Countries</h2>
          {analytics.topCountries.length === 0 ? (
            <p className="text-gray-600">No location data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.topCountries.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium">{item.country}</span>
                  <span className="text-gray-600 text-sm">{item.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrers */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Top Referrers</h2>
          {analytics.topReferrers.length === 0 ? (
            <p className="text-gray-600">No referrer data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.topReferrers.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium truncate max-w-[70%]">
                    {item.referrer === 'Direct' ? 'Direct / None' : item.referrer}
                  </span>
                  <span className="text-gray-600 text-sm">{item.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Visits */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Recent Visits (Last 100)</h2>
        {analytics.latestViews.length === 0 ? (
          <p className="text-gray-600">No visits yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left">
                  <th className="pb-3 pr-4 text-sm font-semibold">Page</th>
                  <th className="pb-3 pr-4 text-sm font-semibold">Location</th>
                  <th className="pb-3 pr-4 text-sm font-semibold">Referrer</th>
                  <th className="pb-3 text-sm font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.latestViews.map((view) => (
                  <tr key={view.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-sm font-medium">{view.page}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {view.city && view.country
                        ? `${view.city}, ${view.country}`
                        : view.country || 'Unknown'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 truncate max-w-xs">
                      {view.referrer || 'Direct'}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {new Date(view.visitedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
