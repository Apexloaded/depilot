import { z } from 'zod';

export const propertySchema = z.object({
  id: z.string(),

  reference: z.string(),

  estateId: z.string(),

  type: z.enum(['PLOT', 'HOUSE', 'APARTMENT', 'COMMERCIAL_UNIT', 'OTHER']),

  status: z.enum([
    'AVAILABLE',
    'RESERVED',
    'ALLOCATED',
    'SOLD',
    'TRANSFER_PENDING',
    'TRANSFERRED',
    'BLOCKED',
    'DISPUTED',
  ]),

  identification: z.object({
    block: z.string().optional(),
    plotNumber: z.string().optional(),
    unitNumber: z.string().optional(),
    phase: z.string().optional(),
    section: z.string().optional(),
    internalReference: z.string().optional(),
    externalReference: z.string().optional(),
  }),

  physical: z.object({
    size: z
      .object({
        value: z.number().positive(),
        unit: z.enum(['SQM', 'SQFT', 'HECTARE', 'ACRE']),
      })
      .optional(),

    frontage: z.number().positive().optional(),

    depth: z.number().positive().optional(),

    dimensions: z.string().optional(),

    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),

  pricing: z.object({
    askingPrice: z.number().positive().optional(),

    currency: z.literal('NGN'),

    pricePerUnit: z.number().positive().optional(),

    pricingVersion: z.number().int().positive().optional(),

    effectiveFrom: z.date().optional(),

    effectiveTo: z.date().optional(),
  }),

  ownership: z.object({
    currentHolderType: z.enum(['DEVELOPER', 'BUYER', 'INVESTOR', 'OTHER']),

    currentHolderId: z.string().optional(),

    ownershipStatus: z.enum([
      'DEVELOPER_HELD',
      'ALLOCATED',
      'ASSIGNED',
      'TRANSFERRED',
      'DISPUTED',
    ]),
  }),

  verification: z.object({
    identityStatus: z.enum(['UNVERIFIED', 'VERIFIED', 'CONFLICT', 'DISPUTED']),

    verifiedIdentifiers: z.array(z.string()).optional(),

    lastVerifiedAt: z.date().optional(),
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Property = z.infer<typeof propertySchema>;
