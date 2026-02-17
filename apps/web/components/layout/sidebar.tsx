'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Users, Plus, Menu, X } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  teams: Team[];
}

export function Sidebar({ teams }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border border-border shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link href="/teams" className="text-xl font-bold text-foreground">
              TeamFlow
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {/* Dashboard */}
              <Link
                href="/teams"
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${
                    pathname === '/teams'
                      ? 'bg-primary/10 text-foreground dark:bg-primary/20 dark:text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>

              {/* Teams Section */}
              <div className="mt-6">
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Teams
                  </h3>
                </div>

                {teams.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No teams yet</div>
                ) : (
                  <div className="space-y-1">
                    {teams
                      .sort((a, b) => {
                        // Show demo workspace first
                        if (a.slug === 'demo-workspace') return -1;
                        if (b.slug === 'demo-workspace') return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((team) => {
                        const isDemoWorkspace = team.slug === 'demo-workspace';
                        return (
                          <Link
                            key={team.id}
                            href={`/teams/${team.id}`}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                              ${
                                isActive(`/teams/${team.id}`)
                                  ? 'bg-primary/10 text-foreground dark:bg-primary/20 dark:text-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }
                            `}
                          >
                            <div className="flex items-center min-w-0">
                              <Users className="mr-3 h-5 w-5 flex-shrink-0" />
                              <span className="truncate">{team.name}</span>
                            </div>
                            {isDemoWorkspace && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[var(--green-3)] text-[var(--green-12)] rounded-full flex-shrink-0">
                                DEMO
                              </span>
                            )}
                          </Link>
                        );
                      })}
                  </div>
                )}

                <Link
                  href="/teams/new"
                  onClick={() => setIsMobileOpen(false)}
                  className="mt-2 flex items-center px-3 py-2 text-sm font-medium text-primary rounded-md hover:bg-primary/10 dark:hover:bg-primary/20"
                >
                  <Plus className="mr-3 h-5 w-5" />
                  Create Team
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
