import { z } from 'zod';

export const dealBuyerSubcollectionSchema = z.object({
  id: z.string(),
  dealId: z.string().optional(),
  name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.email().optional(),
  isPrimary: z.boolean().default(false),
});

export type DealBuyerSubcollection = z.infer<
  typeof dealBuyerSubcollectionSchema
>;
