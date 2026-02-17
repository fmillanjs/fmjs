'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeamSchema, type CreateTeamInput } from '@repo/shared/validators';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function TeamForm() {
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
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamInput) => {
    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const token = (session as any)?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const newTeam = await api.post<{ id: string; name: string; slug: string }>(
        '/api/teams',
        data,
        token
      );

      setSuccessMessage('Team created successfully!');
      reset();

      // Redirect to the new team page after a short delay
      setTimeout(() => {
        router.push(`/teams/${newTeam.id}`);
        router.refresh();
      }, 500);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to create team');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Server Error */}
      {serverError && (
        <div className="rounded-md bg-[var(--red-3)] p-4">
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
              <p className="text-sm font-medium text-[var(--red-11)]">{serverError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-[var(--green-3)] p-4">
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
              <p className="text-sm font-medium text-[var(--green-11)]">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
          Team Name
        </label>
        <div className="mt-1">
          <input
            {...register('name')}
            type="text"
            id="name"
            placeholder="e.g., Marketing Team"
            className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}
