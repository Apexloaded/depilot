import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),

  name: z.string(),

  email: z.string().email(),

  role: z.enum(['ADMIN', 'OPERATIONS', 'LAWYER', 'SURVEYOR', 'SALES_AGENT']),

  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
