'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/validations/contact';
import { submitContactForm } from '@/app/actions/contact';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('message', data.message);

    const result = await submitContactForm(formData);

    setIsSubmitting(false);

    if (result.success) {
      setSubmitStatus({
        type: 'success',
        message: "Message sent! I'll get back to you soon.",
      });
      reset();
    } else {
      if ('_form' in result.errors && result.errors._form) {
        setSubmitStatus({
          type: 'error',
          message: result.errors._form[0] || 'An error occurred',
        });
      }

      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (field !== '_form' && messages) {
            setError(field as keyof ContactFormData, {
              message: messages[0],
            });
          }
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitStatus && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            submitStatus.type === 'success'
              ? 'border-[var(--green-6)] bg-[var(--green-3)] text-[var(--green-11)]'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <div>
        <Label htmlFor="name" className="mb-2 block">
          Name
        </Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message" className="mb-2 block">
          Message
        </Label>
        <Textarea
          id="message"
          rows={5}
          {...register('message')}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
