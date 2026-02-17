'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@repo/shared/validators';
import { resetPassword } from '@/app/(auth)/reset-password/actions';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Extended schema for client-side confirmation
const resetPasswordFormSchema = resetPasswordSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token,
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('token', data.token);
    formData.append('password', data.password);

    const result = await resetPassword(formData);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      // Redirect to login with success message
      router.push('/login?reset=success');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('token')} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          New Password
        </label>
        <input
          {...register('password')}
          id="password"
          type="password"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter new password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirm New Password
        </label>
        <input
          {...register('confirmPassword')}
          id="confirmPassword"
          type="password"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Confirm new password"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-[var(--red-3)] border border-[var(--red-6)] rounded-md">
          <p className="text-[var(--red-11)] text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}
