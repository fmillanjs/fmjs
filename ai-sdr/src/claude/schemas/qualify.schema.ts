import { z } from 'zod';

export const QualifySchema = z.object({
  icpScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('ICP fit score from 0 (worst fit) to 100 (best fit). Integer only. No decimals.'),
  reasoning: z
    .string()
    .describe('One paragraph explaining why this score was assigned, referencing specific rubric criteria.'),
  matchedCriteria: z
    .array(z.string())
    .describe('ICP criteria this lead satisfies. Empty array if none.'),
  weakCriteria: z
    .array(z.string())
    .describe('ICP criteria this lead does not satisfy. Empty array if none.'),
});

export type QualifyOutput = z.infer<typeof QualifySchema>;
