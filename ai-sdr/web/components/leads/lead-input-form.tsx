'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLead } from '@/actions/leads';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyUrl: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: 'URL must start with http:// or https://' },
    ),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function LeadInputForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await createLead(data);
      reset();
      // Navigate to the lead detail page — SSE pipeline monitor will start there
      router.push(`/leads/${result.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Lead Name</Label>
          <Input
            id="name"
            placeholder="Jane Smith"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="Acme Corp"
            {...register('companyName')}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyUrl">Company URL</Label>
          <Input
            id="companyUrl"
            placeholder="https://acme.com"
            type="url"
            {...register('companyUrl')}
          />
          {errors.companyUrl && (
            <p className="text-xs text-destructive">{errors.companyUrl.message}</p>
          )}
        </div>
      </div>
      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit Lead'}
      </Button>
    </form>
  );
}
