import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Icon */}
        <FileQuestion className="w-24 h-24 mx-auto text-primary" />

        {/* 404 Heading */}
        <h1 className="text-6xl font-bold text-primary">404</h1>

        {/* Subheading */}
        <h2 className="text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/projects"
            className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
