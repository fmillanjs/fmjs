'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeamSchema, type CreateTeamInput } from '@repo/shared/validators';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function TeamForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    mode: 'onBlur',
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
      form.reset();

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div role="alert" className="rounded-md bg-[var(--red-3)] p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-[var(--red-9)]"
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
          <div role="status" className="rounded-md bg-[var(--green-3)] p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-[var(--green-9)]"
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g., Marketing Team"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Team'}
        </Button>
      </form>
    </Form>
  );
}
