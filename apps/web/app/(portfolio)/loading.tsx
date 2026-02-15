import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Skeleton className="mb-4 h-12 w-2/3" />
      <Skeleton className="mb-8 h-6 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
