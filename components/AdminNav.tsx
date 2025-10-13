'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/updates', label: 'Updates' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/subscribers', label: 'Subscribers' },
    { href: '/admin/metrics', label: 'Metrics' },
  ];

  return (
    <nav className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold">
              Admin Panel
            </Link>
            <div className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname === item.href
                      ? 'bg-white text-black'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm hover:text-gray-300"
              target="_blank"
            >
              View Site →
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
