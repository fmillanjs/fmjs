import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WorkspaceNav from '../../../components/WorkspaceNav';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: params is a Promise in Next.js 15

  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value;
  if (!token) {
    redirect('/login');
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <WorkspaceNav slug={slug} />
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}
