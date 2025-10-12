'use client';

import { useState, useEffect } from 'react';

interface Update {
  id: number;
  time: string;
  content: string;
  date: string;
  createdAt: string;
}

export default function UpdatesManagement() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    time: '6:00 AM',
    content: '',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const timeOptions = ['6:00 AM', '11:00 AM', '2:00 PM', '6:00 PM'];

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const response = await fetch('/api/updates');
      const data = await response.json();
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add update');

      setMessage('Update added successfully!');
      setFormData({ ...formData, content: '' });
      fetchUpdates();

      // Trigger n8n webhook for Twitter posting
      try {
        await fetch('/api/webhooks/new-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time: formData.time,
            content: formData.content,
            date: formData.date,
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError);
      }
    } catch (error) {
      setMessage('Failed to add update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const response = await fetch(`/api/updates?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete update');

      fetchUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Updates</h1>

      {/* Add Update Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Update</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                placeholder="Oct 12, 2025"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              placeholder="What are you working on?"
              required
            />
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Update'}
          </button>
        </form>
      </div>

      {/* Updates List */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">All Updates</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : updates.length === 0 ? (
          <p className="text-gray-600">No updates yet</p>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{update.time}</span>
                    <span className="text-gray-600 ml-2">• {update.date}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-800">{update.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
