'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileDto } from '@repo/shared/validators';
import { updateProfile } from '@/app/(dashboard)/profile/actions';
import { useRouter } from 'next/navigation';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileDto>({
    resolver: zodResolver(updateProfileSchema),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="w-full px-3 py-2 border border-border rounded-md text-muted-foreground bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <input
          id="role"
          type="text"
          value={user.role}
          disabled
          className="w-full px-3 py-2 border border-border rounded-md text-muted-foreground bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-1">Role is managed by administrators</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="text-[var(--red-11)] text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium mb-1">
          Profile Picture URL
        </label>
        <input
          {...register('image')}
          id="image"
          type="url"
          className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/avatar.jpg"
        />
        {errors.image && (
          <p className="text-[var(--red-11)] text-sm mt-1">{errors.image.message}</p>
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
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
