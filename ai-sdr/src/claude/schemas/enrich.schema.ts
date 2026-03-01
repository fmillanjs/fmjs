import { z } from 'zod';

export const EnrichSchema = z.object({
  companySize: z
    .string()
    .nullable()
    .describe('Company headcount range, e.g. "50-200 employees". Null if unknown.'),
  industry: z
    .string()
    .nullable()
    .describe('Industry vertical, e.g. "FinTech SaaS". Null if unknown.'),
  techStack: z
    .array(z.string())
    .describe('Technologies the company uses based on public signals. Empty array if none detected.'),
  painPoints: z
    .array(z.string())
    .describe('Business problems this company likely faces based on profile. Empty array if none detected.'),
});

export type EnrichOutput = z.infer<typeof EnrichSchema>;
