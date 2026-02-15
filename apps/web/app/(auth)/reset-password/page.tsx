import { ResetPasswordRequestForm } from '@/components/auth/reset-password-request-form';

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <ResetPasswordRequestForm />
    </div>
  );
}
