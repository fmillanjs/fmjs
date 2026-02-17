'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteMemberSchema, type InviteMemberInput } from '@repo/shared/validators';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@repo/shared/types';

interface InviteMemberFormProps {
  teamId: string;
}

export function InviteMemberForm({ teamId }: InviteMemberFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: UserRole.MEMBER,
    },
  });

  const onSubmit = async (data: InviteMemberInput) => {
    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const token = (session as any)?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      await api.post(`/api/teams/${teamId}/members`, data, token);

      setSuccessMessage('Member invited successfully!');
      reset();

      // Refresh the page to show updated member list
      setTimeout(() => {
        router.refresh();
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to invite member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Server Error */}
      {serverError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{serverError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Email Field */}
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
            Email Address
          </label>
          <div className="mt-1">
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="member@example.com"
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Role Select */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-muted-foreground">
            Role
          </label>
          <div className="mt-1">
            <select
              {...register('role')}
              id="role"
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={UserRole.MEMBER}>Member</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Inviting...' : 'Invite Member'}
        </button>
      </div>
    </form>
  );
}
