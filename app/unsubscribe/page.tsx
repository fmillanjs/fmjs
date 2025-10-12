'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setStatus('error');
      setMessage('No email address provided');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch(`/api/newsletter?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Unsubscribe failed');

      setStatus('success');
      setMessage("You've been successfully unsubscribed from the newsletter.");
    } catch (error) {
      setStatus('error');
      setMessage('Failed to unsubscribe. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Unsubscribe</h1>

        {status === 'loading' && (
          <p className="text-gray-600">Processing your request...</p>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium mb-2">✓ {message}</p>
            <p className="text-sm">Sorry to see you go! You can always resubscribe on the homepage.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">✗ {message}</p>
          </div>
        )}

        <a
          href="/"
          className="inline-block mt-6 text-black hover:text-gray-600 font-medium"
        >
          ← Back to homepage
        </a>
      </div>
    </div>
  );
}
