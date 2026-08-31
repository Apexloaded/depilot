import { z } from 'zod';
import { locationSchema } from '../../../schemas/index.js';

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATIONS = 'OPERATIONS',
  LAWYER = 'LAWYER',
  SURVEYOR = 'SURVEYOR',
  SALES_AGENT = 'SALES_AGENT',
  CLIENT = 'CLIENT',
}

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phoneNumber: z.string().optional(),
  address: locationSchema.nullable().optional(),
  role: z.enum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;
