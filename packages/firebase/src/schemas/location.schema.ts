import { z } from 'zod';

export const locationSchema = z.object({
  state: z.string(),
  lga: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  address: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;
