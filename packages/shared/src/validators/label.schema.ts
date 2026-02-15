import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').max(50, 'Name must be at most 50 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;

export const updateLabelSchema = createLabelSchema.partial();

export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
