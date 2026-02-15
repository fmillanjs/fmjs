/**
 * Email utility for sending transactional emails
 *
 * Development: Logs email content to console for testing
 * Production: TODO - Integrate with SMTP service (e.g., SendGrid, AWS SES, Resend)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  if (isDevelopment) {
    // In development, log the reset URL to console
    console.log(`[EMAIL] Password Reset Request`);
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires in: 1 hour`);
    return;
  }

  // Production email integration
  // TODO: Implement SMTP email sending
  // Example with SendGrid/Resend:
  // await emailClient.send({
  //   to: email,
  //   from: 'noreply@teamflow.example.com',
  //   subject: 'Reset Your Password',
  //   html: `
  //     <h1>Password Reset Request</h1>
  //     <p>Click the link below to reset your password:</p>
  //     <a href="${resetUrl}">Reset Password</a>
  //     <p>This link expires in 1 hour.</p>
  //     <p>If you didn't request this, please ignore this email.</p>
  //   `
  // });

  throw new Error('Email sending not configured for production');
}
