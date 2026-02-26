import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication Error | TeamFlow',
};

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  Default: 'An error occurred during authentication. Please try again.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ?? 'Default';
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="text-center space-y-4">
      <div className="text-destructive font-semibold text-lg">Sign In Failed</div>
      <p className="text-muted-foreground text-sm">{message}</p>
      <Link
        href="/login"
        className="inline-block text-sm text-primary underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  );
}
