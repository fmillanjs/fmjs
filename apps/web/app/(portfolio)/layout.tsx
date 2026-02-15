import type { Metadata } from 'next';
import { PortfolioNav } from '@/components/portfolio/nav';
import { PortfolioFooter } from '@/components/portfolio/footer';

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
    <div className="min-h-screen flex flex-col">
      <PortfolioNav />
      <main className="flex-1">{children}</main>
      <PortfolioFooter />
    </div>
  );
}
