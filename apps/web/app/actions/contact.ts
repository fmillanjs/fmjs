'use server';

import { contactSchema, type ContactFormData } from '@/lib/validations/contact';

export type ContactFormResult =
  | { success: true }
  | {
      success: false;
      errors: Partial<Record<keyof ContactFormData, string[]>> & {
        _form?: string[];
      };
    };

export async function submitContactForm(
  formData: FormData
): Promise<ContactFormResult> {
  try {
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    const result = contactSchema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    const { name, email, message } = result.data;

    // Log contact form submission (production SMTP deferred)
    console.log(`CONTACT FORM: ${name} (${email}) - ${message}`);

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      success: false,
      errors: {
        _form: ['Failed to send message. Please try again.'],
      },
    };
  }
}
