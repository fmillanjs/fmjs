'use client';

import { useState, useEffect } from 'react';

interface Subscriber {
  id: number;
  email: string;
  subscribedAt: string;
  isActive: string;
}

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter');
      const data = await response.json();
      setSubscribers(data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const activeSubscribers = subscribers.filter(sub => sub.isActive === 'true');
    const emails = activeSubscribers.map(sub => sub.email).join('\n');
    const blob = new Blob([emails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeSubscribers = subscribers.filter(sub => sub.isActive === 'true');
  const inactiveSubscribers = subscribers.filter(sub => sub.isActive === 'false');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Export Emails
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Subscribers</p>
          <p className="text-4xl font-bold">{subscribers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Active</p>
          <p className="text-4xl font-bold text-green-600">{activeSubscribers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Unsubscribed</p>
          <p className="text-4xl font-bold text-gray-400">{inactiveSubscribers.length}</p>
        </div>
      </div>

      {/* Active Subscribers */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Active Subscribers</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : activeSubscribers.length === 0 ? (
          <p className="text-gray-600">No active subscribers yet</p>
        ) : (
          <div className="space-y-2">
            {activeSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-gray-600">
                    Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Subscribers */}
      {inactiveSubscribers.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Unsubscribed</h2>
          <div className="space-y-2">
            {inactiveSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 opacity-60">
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-gray-600">
                    Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  Inactive
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
