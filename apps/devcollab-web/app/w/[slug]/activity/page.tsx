import { cookies } from 'next/headers';
import ActivityFeed from '../../../../components/activity/ActivityFeed';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

async function getInitialFeed(slug: string, token: string) {
  try {
    const res = await fetch(`${API_URL}/workspaces/${slug}/activity`, {
      headers: { Cookie: `devcollab_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { events: [], nextCursor: null };
    return res.json();
  } catch {
    return { events: [], nextCursor: null };
  }
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('devcollab_token')?.value ?? '';

  const { events, nextCursor } = await getInitialFeed(slug, token);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
        Activity Feed
      </h1>
      <ActivityFeed
        slug={slug}
        initialEvents={events}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
