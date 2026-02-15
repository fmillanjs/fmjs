'use server';

import { signUpSchema } from '@repo/shared/validators';
import { prisma } from '@repo/database';
import bcrypt from 'bcrypt';

export async function signUp(formData: { email: string; password: string; name: string }) {
  const parsed = signUpSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Validation failed' };
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return { error: 'Email already registered' };
  }

  // Create user
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      password: hashedPassword,
      role: 'MEMBER', // Default role
    },
  });

  return { success: true };
}
