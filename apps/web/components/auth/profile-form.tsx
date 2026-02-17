'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileDto } from '@repo/shared/validators';
import { updateProfile } from '@/app/(dashboard)/profile/actions';
import { useRouter } from 'next/navigation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
    role: string;
    image: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<UpdateProfileDto>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      name: user.name || '',
      image: user.image || '',
    },
  });

  const onSubmit = async (data: UpdateProfileDto) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.image !== undefined) formData.append('image', data.image || '');

    const result = await updateProfile(formData);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      setSuccessMessage('Profile updated successfully');
      // Refresh the page to show updated data
      router.refresh();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email-display" className="block text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email-display"
            type="email"
            value={user.email}
            disabled
            className="text-muted-foreground bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="role-display" className="block text-sm font-medium">
            Role
          </label>
          <Input
            id="role-display"
            type="text"
            value={user.role}
            disabled
            className="text-muted-foreground bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Role is managed by administrators</p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/avatar.jpg" {...field} value={field.value ?? ''} />
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
          {isSubmitting ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
}
