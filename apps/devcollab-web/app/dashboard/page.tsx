import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CreateWorkspaceForm from '../../components/CreateWorkspaceForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  members: Array<{ role: string; userId: string }>;
}

async function getWorkspaces(token: string): Promise<Workspace[]> {
  try {
    const res = await fetch(`${API_URL}/workspaces`, {
      headers: { Cookie: `devcollab_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const workspaces = await getWorkspaces(token);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Your Workspaces
        </h2>
        {workspaces.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No workspaces yet. Create one below.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {workspaces.map((ws) => (
              <li key={ws.id} style={{ marginBottom: '0.5rem' }}>
                <a
                  href={`/w/${ws.slug}`}
                  style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                >
                  {ws.name}
                </a>
                <span style={{ color: '#9ca3af', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                  /{ws.slug} · {ws.members?.length ?? 0} member
                  {(ws.members?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Create Workspace
        </h2>
        <CreateWorkspaceForm />
      </section>

      <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <a href="/api/logout" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Log out
        </a>
      </div>
    </main>
  );
}
