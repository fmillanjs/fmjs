'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <section className="py-20 text-center border-t border-gray-200">
      <h2 className="text-3xl font-bold mb-3">Follow the journey</h2>
      <p className="text-gray-600 mb-8">Get updates on my building journey straight to your inbox</p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
