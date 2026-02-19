import type { Metadata } from 'next';
import { PortfolioNav } from '@/components/portfolio/nav';
import { PortfolioFooter } from '@/components/portfolio/footer';
import { CommandPalette } from '@/components/ui/command-palette';

export const metadata: Metadata = {
  title: {
    default: 'Fernando Millan - Full-Stack Engineer',
    template: '%s | Fernando Millan',
  },
  description: 'Senior full-stack engineer building production-ready SaaS applications',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="matrix-theme min-h-screen flex flex-col">
      <PortfolioNav />
      <main className="flex-1">{children}</main>
      <PortfolioFooter />
      <CommandPalette />
    </div>
  );
}
