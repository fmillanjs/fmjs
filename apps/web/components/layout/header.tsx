'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: true, redirectTo: '/login' });
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-[var(--red-3)] text-[var(--red-11)]';
      case 'MANAGER':
        return 'bg-[var(--blue-3)] text-[var(--blue-11)]';
      case 'MEMBER':
        return 'bg-[var(--green-3)] text-[var(--green-11)]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-20">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left side - could add breadcrumbs or search here */}
        <div className="flex-1">
          {/* Placeholder for future breadcrumbs */}
        </div>

        {/* Right side - Theme toggle and User menu */}
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono border rounded bg-muted text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
            >
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {initials}
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-20">
                <div className="py-1">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-accent"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
