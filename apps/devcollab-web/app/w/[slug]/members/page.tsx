import { cookies } from 'next/headers';
import MembersTable from '../../../../components/members/MembersTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

async function getMembers(slug: string, token: string): Promise<Member[]> {
  try {
    const res = await fetch(`${API_URL}/workspaces/${slug}/members`, {
      headers: { Cookie: `devcollab_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCurrentUser(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `devcollab_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as { sub: string; email: string };
  } catch {
    return null;
  }
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: Next.js 15 params is a Promise
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value ?? '';

  const [members, currentUser] = await Promise.all([
    getMembers(slug, token),
    getCurrentUser(token),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
        Members
      </h1>
      <MembersTable
        slug={slug}
        initialMembers={members}
        currentUserId={currentUser?.sub ?? ''}
      />
    </div>
  );
}
