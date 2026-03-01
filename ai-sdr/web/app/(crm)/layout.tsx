import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/session';

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: also check session in layout, not only in middleware
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    redirect('/login');
  }
  return <>{children}</>;
}
