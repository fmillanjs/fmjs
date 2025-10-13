import { db } from '@/lib/db';
import { updates, projects, subscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminDashboard() {
  const [allUpdates, allProjects, allSubscribers] = await Promise.all([
    db.select().from(updates),
    db.select().from(projects),
    db.select().from(subscribers).where(eq(subscribers.isActive, 'true')),
  ]);

  const stats = [
    { label: 'Total Updates', value: allUpdates.length },
    { label: 'Total Projects', value: allProjects.length },
    { label: 'Active Subscribers', value: allSubscribers.length },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-4xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/updates"
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Add Update</h3>
            <p className="text-sm text-gray-600">Post your daily progress update</p>
          </a>
          <a
            href="/admin/projects"
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Add Project</h3>
            <p className="text-sm text-gray-600">Launch a new project</p>
          </a>
          <a
            href="/admin/subscribers"
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold mb-1">View Subscribers</h3>
            <p className="text-sm text-gray-600">Manage newsletter subscribers</p>
          </a>
          <a
            href="/admin/metrics"
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold mb-1">View Metrics</h3>
            <p className="text-sm text-gray-600">Track visitor analytics and stats</p>
          </a>
        </div>
      </div>
    </div>
  );
}
