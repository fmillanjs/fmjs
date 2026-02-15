import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { serverApi } from '@/lib/api';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { CommandPalette } from '@/components/ui/command-palette';

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's teams for sidebar
  let teams: Team[] = [];
  try {
    teams = await serverApi.get<Team[]>('/api/teams');
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    // Continue with empty teams array - user can still navigate to create team
  }

  return (
    <NuqsAdapter>
      <WebSocketProvider>
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <Sidebar teams={teams} />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header
              user={{
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
              }}
            />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto bg-muted/20">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
          </div>
        </div>

        {/* Command Palette */}
        <CommandPalette />
      </WebSocketProvider>
    </NuqsAdapter>
  );
}
