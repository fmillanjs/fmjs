'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordRequestSchema, type ResetPasswordRequestDto } from '@repo/shared/validators';
import { requestPasswordReset } from '@/app/(auth)/reset-password/actions';
import Link from 'next/link';

export function ResetPasswordRequestForm() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequestDto>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const onSubmit = async (data: ResetPasswordRequestDto) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('email', data.email);

    const result = await requestPasswordReset(formData);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      setSuccessMessage(result.message || "If an account exists with that email, we've sent a reset link.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-[var(--red-3)] border border-[var(--red-6)] rounded-md">
          <p className="text-[var(--red-11)] text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-[var(--green-3)] border border-[var(--green-6)] rounded-md">
          <p className="text-[var(--green-11)] text-sm">{successMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:text-blue-800">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
