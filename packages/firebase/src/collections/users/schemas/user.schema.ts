import { z } from 'zod';
import { locationSchema } from '../../../schemas';

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phoneNumber: z.string().optional(),
  address: locationSchema.nullable().optional(),
  role: z.enum([
    'ADMIN',
    'OPERATIONS',
    'LAWYER',
    'SURVEYOR',
    'SALES_AGENT',
    'CLIENT',
  ]),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;
