import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('RESEND_API_KEY is not set. Email functionality will not work.');
      // Use a dummy key to prevent build errors, but emails won't actually send
      resendInstance = new Resend('re_dummy_key_for_build');
    } else {
      resendInstance = new Resend(apiKey);
    }
  }

  return resendInstance;
}
