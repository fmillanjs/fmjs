export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: params is a Promise in Next.js 15

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <span style={{ fontWeight: 600 }}>Workspace: {slug}</span>
        <span style={{ marginLeft: '1rem' }}>
          <a href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Dashboard
          </a>
        </span>
      </nav>
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}
