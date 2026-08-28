import { z } from 'zod';
import { estateLocationSchema } from './estate-location.schema';
import { landInformationSchema } from './land-info.schema';
import { estateVerificationSchema } from './estate-verification.schema';
import { estateDevelopmentSchema } from './estate-development.schema';

export const estateSchema = z.object({
  id: z.string(),
  name: z.string(),
  developer: z.object({
    id: z.string(),
    name: z.string(),
  }),
  price: z.number().default(0),
  status: z.enum(['PLANNING', 'ACTIVE', 'SOLD_OUT', 'SUSPENDED', 'ARCHIVED']),
  location: estateLocationSchema,
  landInformation: landInformationSchema,
  development: estateDevelopmentSchema,
  verification: estateVerificationSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Estate = z.infer<typeof estateSchema>;
