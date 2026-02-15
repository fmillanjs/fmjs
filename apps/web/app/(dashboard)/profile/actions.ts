'use server';

import { auth } from '@/lib/auth';
import { updateProfileSchema, changePasswordSchema } from '@repo/shared/validators';
import { prisma } from '@repo/database';
import bcrypt from 'bcrypt';

/**
 * Update user profile (name, image)
 * IMPORTANT: Uses session.user.id to prevent IDOR attacks
 */
export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: 'Not authenticated',
      };
    }

    const data = {
      name: formData.get('name'),
      image: formData.get('image'),
    };

    // Validate input
    const validated = updateProfileSchema.parse(data);

    // Update user in database (using session.user.id, NOT form data)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.image !== undefined && { image: validated.image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      },
    });

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      error: 'Failed to update profile',
    };
  }
}

/**
 * Change user password
 * Requires current password verification
 */
export async function changePassword(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: 'Not authenticated',
      };
    }

    const data = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    };

    // Validate input
    const validated = changePasswordSchema.parse(data);

    // Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return {
        error: 'User not found',
      };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return {
        error: 'Current password is incorrect',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      error: 'Failed to change password',
    };
  }
}
