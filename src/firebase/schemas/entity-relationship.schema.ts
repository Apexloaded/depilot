import { z } from 'zod';

export const entityRelationshipSchema = z.object({
  id: z.string(),

  from: z.object({
    type: z.enum([
      'BUYER',
      'PROPERTY',
      'PLOT',
      'ESTATE',
      'DOCUMENT',
      'TRANSACTION',
    ]),
    id: z.string(),
  }),

  relationship: z.enum([
    'PURCHASES',
    'ALLOCATED_TO',
    'BELONGS_TO',
    'LOCATED_IN',
    'SUPPORTED_BY',
    'REFERENCES',
    'VERIFIED_BY',
    'DISPUTES',
    'SUPERSEDES',
  ]),

  to: z.object({
    type: z.enum([
      'BUYER',
      'PROPERTY',
      'PLOT',
      'ESTATE',
      'DOCUMENT',
      'TRANSACTION',
    ]),
    id: z.string(),
  }),

  confidence: z.number().min(0).max(1).optional(),

  source: z.string().optional(),

  validFrom: z.date().optional(),

  validTo: z.date().optional(),

  status: z.enum(['ACTIVE', 'DISPUTED', 'SUPERSEDED']),

  createdAt: z.date(),
});

export type EntityRelationship = z.infer<typeof entityRelationshipSchema>;
