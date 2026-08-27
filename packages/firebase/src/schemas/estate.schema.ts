import { z } from 'zod';

export const estateSchema = z.object({
  id: z.string(),

  reference: z.string(),

  name: z.string(),

  developer: z.object({
    id: z.string(),
    name: z.string(),
  }),

  status: z.enum(['PLANNING', 'ACTIVE', 'SOLD_OUT', 'SUSPENDED', 'ARCHIVED']),

  location: z.object({
    state: z.string(),
    lga: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),

    address: z.string().optional(),

    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),

  landInformation: z.object({
    landSize: z
      .object({
        value: z.number().positive(),
        unit: z.enum(['SQM', 'HECTARE', 'ACRE']),
      })
      .optional(),

    landUse: z.string().optional(),

    titleType: z
      .enum([
        'C_OF_O',
        'GOVERNOR_CONSENT',
        'DEED_OF_ASSIGNMENT',
        'SURVEY',
        'EXCISION',
        'GAZETTE',
        'OTHER',
      ])
      .optional(),

    titleReference: z.string().optional(),
  }),

  development: z.object({
    totalPlots: z.number().int().nonnegative().optional(),

    blocks: z.array(z.string()).optional(),

    phases: z.array(z.string()).optional(),

    infrastructureStatus: z
      .enum(['NOT_STARTED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED'])
      .optional(),
  }),

  verification: z.object({
    status: z.enum([
      'UNVERIFIED',
      'PARTIALLY_VERIFIED',
      'VERIFIED',
      'DISPUTED',
    ]),

    lastVerifiedAt: z.date().optional(),

    verifiedBy: z.string().optional(),

    verificationSource: z.string().optional(),
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Estate = z.infer<typeof estateSchema>;
