export default function DashboardPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dashboard</h1>
      <p>You are logged in. Workspace features coming in Phase 16.</p>
      <a href="/api/logout">Log out</a>
    </main>
  );
}
