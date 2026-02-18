'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) setStatus('idle');
  }, [token]);

  async function handleJoin() {
    setStatus('joining');
    try {
      const res = await fetch(`${API_URL}/workspaces/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('You have joined the workspace. Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.message ?? 'Failed to join workspace');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (!token) {
    return <p>No invite token provided. Check your invite link.</p>;
  }

  return (
    <div style={{ maxWidth: '400px' }}>
      <p style={{ marginBottom: '1rem', color: '#374151' }}>
        You have been invited to join a workspace.
      </p>
      {status === 'success' && <p style={{ color: '#059669' }}>{message}</p>}
      {status === 'error' && <p style={{ color: '#dc2626' }}>{message}</p>}
      {status !== 'success' && (
        <button
          onClick={handleJoin}
          disabled={status === 'joining'}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: status === 'joining' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'joining' ? 'Joining...' : 'Accept Invite'}
        </button>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '1rem' }}>Join Workspace</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <JoinForm />
      </Suspense>
    </main>
  );
}
