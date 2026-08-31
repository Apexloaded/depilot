import { z } from 'zod';

export const estateDevelopmentSchema = z.object({
  totalPlots: z.number().int().nonnegative().optional(),
  blocks: z.array(z.string()).optional(),
  phases: z.array(z.string()).optional(),
  infrastructureStatus: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED'])
    .optional(),
});

export type EstateDevelopment = z.infer<typeof estateDevelopmentSchema>;
