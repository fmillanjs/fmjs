const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getWorkspace(slug: string) {
  try {
    const res = await fetch(`${API_URL}/workspaces/${slug}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: params is a Promise in Next.js 15
  const workspace = await getWorkspace(slug);

  if (!workspace) {
    return (
      <div>
        <h1>Workspace not found</h1>
        <p>You may not be a member of this workspace, or it does not exist.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {workspace.name}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>/{workspace.slug}</p>
      <p>
        Members: <strong>{workspace.members?.length ?? 0}</strong>
      </p>
    </div>
  );
}
