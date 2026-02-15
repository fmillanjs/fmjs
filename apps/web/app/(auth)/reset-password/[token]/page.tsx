import { ResetPasswordForm } from '@/components/auth/reset-password-form';

interface ResetPasswordTokenPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordTokenPage({ params }: ResetPasswordTokenPageProps) {
  const { token } = await params;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
        <p className="text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
