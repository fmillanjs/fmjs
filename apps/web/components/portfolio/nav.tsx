'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/resume', label: 'Resume' },
  { href: '/contact', label: 'Contact' },
];

export function PortfolioNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Name */}
          <Link
            href="/"
            className="text-xl font-bold text-foreground hover:text-[var(--matrix-green)] transition-colors"
          >
            Fernando Millan
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative inline-flex flex-col py-1 text-sm font-medium tracking-wide transition-colors',
                  pathname === link.href
                    ? 'text-[var(--matrix-green)]'
                    : 'text-muted-foreground hover:text-[var(--matrix-green)]'
                )}
              >
                {link.label}

                {/* Hover underline — CSS scaleX, GPU-composited, killed automatically by global reduced-motion CSS */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)] origin-left scale-x-0 transition-transform duration-[250ms] ease-out group-hover:scale-x-100 z-[1]"
                />

                {/* Active indicator — Motion layoutId for cross-route slide animation */}
                {pathname === link.href && !prefersReducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    layoutId="nav-active-underline"
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)] z-[2]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {/* Reduced motion fallback — static underline, no animation */}
                {pathname === link.href && prefersReducedMotion && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)] z-[2]"
                  />
                )}
              </Link>
            ))}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono border rounded bg-muted text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-base font-medium transition-colors',
                  pathname === link.href
                    ? 'border-l-2 border-[var(--matrix-green)] text-[var(--matrix-green)] bg-transparent pl-2'
                    : 'text-muted-foreground hover:text-[var(--matrix-green)] hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
