'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@repo/shared/validators';
import { changePassword } from '@/app/(dashboard)/profile/actions';
import { z } from 'zod';

// Extended schema for client-side confirmation and validation
const changePasswordFormSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(
  (data) => data.newPassword !== data.currentPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

export function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('currentPassword', data.currentPassword);
    formData.append('newPassword', data.newPassword);

    const result = await changePassword(formData);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      setSuccessMessage(result.message || 'Password changed successfully');
      // Reset form on success
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
          Current Password
        </label>
        <input
          {...register('currentPassword')}
          id="currentPassword"
          type="password"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter current password"
        />
        {errors.currentPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
          New Password
        </label>
        <input
          {...register('newPassword')}
          id="newPassword"
          type="password"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter new password"
        />
        {errors.newPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
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
        {isSubmitting ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
}
