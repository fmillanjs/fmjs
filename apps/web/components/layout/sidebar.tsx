'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
        <svg
          className="w-6 h-6 text-foreground"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-card dark:bg-gray-950 border-r border-border
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
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <svg
                  className="mr-3 h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
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
                                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }
                            `}
                          >
                            <div className="flex items-center min-w-0">
                              <svg
                                className="mr-3 h-5 w-5 flex-shrink-0"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="truncate">{team.name}</span>
                            </div>
                            {isDemoWorkspace && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full flex-shrink-0">
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
                  <svg
                    className="mr-3 h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
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
