import { z } from 'zod';
import { UserRole } from '../types/enums';

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
