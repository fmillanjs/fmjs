'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpDto } from '@repo/shared/validators';
import { signUp } from '@/app/(auth)/signup/actions';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpDto>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpDto) => {
    setIsLoading(true);
    setServerError('');

    try {
      const result = await signUp(data);

      if (result.error) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      // Auto-login after successful signup
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError('Account created but login failed. Please try logging in.');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-[var(--red-3)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-[var(--red-11)]">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-[var(--red-11)]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-[var(--red-11)]">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
