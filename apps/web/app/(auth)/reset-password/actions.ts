'use server';

import { resetPasswordRequestSchema, resetPasswordSchema } from '@repo/shared/validators';
import { prisma } from '@repo/database';
import { sendResetPasswordEmail } from '@/lib/email';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

/**
 * Request a password reset
 *
 * Security note: Returns success message even if email doesn't exist
 * to prevent email enumeration attacks
 */
export async function requestPasswordReset(formData: FormData) {
  try {
    const data = {
      email: formData.get('email'),
    };

    // Validate input
    const validated = resetPasswordRequestSchema.parse(data);
    const email = validated.email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user exists, create reset token
    if (user) {
      // Generate secure random token
      const token = randomUUID();

      // Delete any existing password reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: email,
          type: 'password-reset',
        },
      });

      // Create new verification token (expires in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: expiresAt,
          type: 'password-reset',
        },
      });

      // Send reset email
      await sendResetPasswordEmail(email, token);
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message: "If an account exists with that email, we've sent a reset link.",
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      error: 'Failed to process password reset request',
    };
  }
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(formData: FormData) {
  try {
    const data = {
      token: formData.get('token'),
      password: formData.get('password'),
    };

    // Validate input
    const validated = resetPasswordSchema.parse(data);

    // Find valid verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token: validated.token,
        type: 'password-reset',
      },
    });

    // Check if token exists and is not expired
    if (!verificationToken || verificationToken.expires < new Date()) {
      return {
        error: 'Invalid or expired reset link',
      };
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return {
        error: 'User not found',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token (one-time use)
    await prisma.verificationToken.delete({
      where: { token: validated.token },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      error: 'Failed to reset password',
    };
  }
}
