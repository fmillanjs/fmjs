'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be under 1000 characters'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  taskId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ taskId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    mode: 'onBlur',
    defaultValues: {
      content: '',
    },
  });

  const token = (session as any)?.accessToken;

  const onSubmit = async (data: CommentFormData) => {
    if (!token) return;

    try {
      await api.post(`/api/tasks/${taskId}/comments`, { content: data.content.trim() }, token);
      form.reset();
      onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="border-t border-border pt-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add a comment..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
