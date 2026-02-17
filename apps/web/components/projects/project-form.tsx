'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  mode: 'create' | 'edit';
  teamId?: string;
  projectId?: string;
  defaultValues?: ProjectFormData;
  onSuccess?: () => void;
}

export function ProjectForm({ mode, teamId, projectId, defaultValues, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onBlur',
    defaultValues: defaultValues || {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = mode === 'create'
        ? `${apiUrl}/api/teams/${teamId}/projects`
        : `${apiUrl}/api/projects/${projectId}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const accessToken = (session as any)?.accessToken;
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save project' }));
        throw new Error(errorData.message || 'Failed to save project');
      }

      // Success - show toast or handle success
      if (onSuccess) {
        onSuccess();
      } else if (mode === 'create' && teamId) {
        router.push(`/teams/${teamId}/projects`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div role="alert" className="bg-[var(--red-3)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Project Name <span className="text-[var(--red-11)]">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter project name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Enter project description (optional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
