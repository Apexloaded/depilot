import { z } from 'zod';

export const embeddedBuyerSummarySchema = z.object({
  userId: z.string(),
  isPrimary: z.boolean().default(false),
  displayName: z.string().optional(),
});

export type EmbeddedBuyerSummary = z.infer<
  typeof embeddedBuyerSummarySchema
>;
