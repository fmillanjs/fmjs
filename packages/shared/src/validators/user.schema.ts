import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  image: z.string().url('Invalid URL').optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
