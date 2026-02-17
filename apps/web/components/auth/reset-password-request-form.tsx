'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordRequestSchema, type ResetPasswordRequestDto } from '@repo/shared/validators';
import { requestPasswordReset } from '@/app/(auth)/reset-password/actions';
import Link from 'next/link';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ResetPasswordRequestForm() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordRequestDto>({
    resolver: zodResolver(resetPasswordRequestSchema),
    mode: 'onBlur',
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && (
          <div role="alert" className="p-3 bg-[var(--red-3)] border border-[var(--red-6)] rounded-md">
            <p className="text-[var(--red-11)] text-sm">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div role="status" className="p-3 bg-[var(--green-3)] border border-[var(--green-6)] rounded-md">
            <p className="text-[var(--green-11)] text-sm">{successMessage}</p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <div className="text-center text-sm">
          <Link href="/login" className="text-foreground underline hover:text-muted-foreground">
            Back to Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
