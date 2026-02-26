'use client'

import Link from 'next/link';
import dynamic from 'next/dynamic'

const GlitchSignature = dynamic(
  () => import('./glitch-signature'),
  { ssr: false }
)

export function PortfolioFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="footer-crt-scanlines relative border-t"
      style={{
        background: '#0a0a0a',
        borderTopColor: 'var(--matrix-green-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Name and Tagline */}
          <div>
            <GlitchSignature />
            <p className="text-sm text-[#b0b0b0] mt-2">
              Full-Stack Engineer building production-ready SaaS applications
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <p className="text-sm font-semibold font-mono text-[var(--matrix-terminal)] mb-3">
              {'>'} navigation
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="inline-block py-1 text-sm text-[#b0b0b0] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="inline-block py-1 text-sm text-[#b0b0b0] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="inline-block py-1 text-sm text-[#b0b0b0] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-block py-1 text-sm text-[#b0b0b0] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Terminal-prompt social links (FOOTER-02) */}
          <div>
            <p className="text-sm font-semibold font-mono text-[var(--matrix-terminal)] mb-3">
              {'>'} connect
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/fmillanjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                  className="font-mono text-sm text-[var(--matrix-terminal)] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                >
                  {'>'} github
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* > EOF tagline — narrative close before copyright (FOOTER-03) */}
      <div className="text-center pb-2">
        <p className="font-mono text-xs text-[var(--matrix-green-border)]">
          {'>'} EOF
        </p>
      </div>

      {/* Copyright */}
      <div className="border-t py-4" style={{ borderColor: 'var(--matrix-green-border)' }}>
        <p className="text-center text-xs font-mono text-[#b0b0b0]">
          &copy; {currentYear} Fernando Millan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
