import { Suspense } from 'react';
import UnsubscribeForm from './UnsubscribeForm';

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Unsubscribe</h1>
        <Suspense fallback={<p className="text-gray-600">Loading...</p>}>
          <UnsubscribeForm />
        </Suspense>
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
