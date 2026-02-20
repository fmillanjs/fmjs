import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export function PortfolioFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Name and Tagline */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Fernando Millan
            </h3>
            <p className="text-sm text-muted-foreground">
              Full-Stack Engineer building production-ready SaaS applications
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Connect
            </h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com/fmillanjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://codesignal.com/learn/profile/cmiqnphkm008cjs0444t3ea1t"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="CodeSignal"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Fernando Millan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
