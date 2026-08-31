import { z } from 'zod';

export const plotSchema = z.object({
  id: z.string(),

  propertyId: z.string(),

  estateId: z.string(),

  canonicalNumber: z.string(),

  identifiers: z.object({
    block: z.string().optional(),

    phase: z.string().optional(),

    section: z.string().optional(),

    plotNumber: z.string(),

    surveyPlanReference: z.string().optional(),

    beaconReferences: z.array(z.string()).optional(),

    allocationReference: z.string().optional(),
  }),

  dimensions: z
    .object({
      size: z
        .object({
          value: z.number().positive(),
          unit: z.enum(['SQM', 'SQFT']),
        })
        .optional(),

      frontage: z.number().positive().optional(),

      depth: z.number().positive().optional(),
    })
    .optional(),

  location: z
    .object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),

      boundaryDescription: z.string().optional(),
    })
    .optional(),

  allocation: z.object({
    status: z.enum([
      'UNALLOCATED',
      'RESERVED',
      'ALLOCATED',
      'REASSIGNED',
      'DISPUTED',
    ]),

    allocatedToBuyerId: z.string().optional(),

    allocationReference: z.string().optional(),

    allocationDate: z.date().optional(),

    allocatedBy: z.string().optional(),
  }),

  title: z.object({
    status: z.enum(['NOT_VERIFIED', 'VERIFIED', 'PENDING', 'DISPUTED']),

    titleType: z.string().optional(),

    titleReference: z.string().optional(),
  }),

  verification: z.object({
    status: z.enum(['UNVERIFIED', 'VERIFIED', 'CONFLICT', 'DISPUTED']),
    conflicts: z.array(z.string()).optional(),
    lastCheckedAt: z.date().optional(),
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Plot = z.infer<typeof plotSchema>;
