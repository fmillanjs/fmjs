import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          Welcome, {session?.user?.name || 'User'}!
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">Your role:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {session?.user?.role || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
