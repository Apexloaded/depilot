import { z } from 'zod';
import { evidenceClaimSchema } from './evidence-claim.schema.js';

export const evidenceSchema = z.object({
  id: z.string(),

  transactionId: z.string().optional(),

  entityType: z.enum([
    'BUYER',
    'ESTATE',
    'PROPERTY',
    'PLOT',
    'PAYMENT',
    'ALLOCATION',
  ]),

  entityId: z.string(),

  documentId: z.string().optional(),

  type: z.enum([
    'IDENTITY',
    'PAYMENT',
    'ALLOCATION',
    'SURVEY',
    'TITLE',
    'LEGAL',
    'OWNERSHIP',
    'ADDRESS',
    'OTHER',
  ]),

  claims: z.array(evidenceClaimSchema),

  source: z.object({
    type: z.enum(['DOCUMENT', 'DATABASE', 'EXTERNAL_SYSTEM', 'HUMAN']),

    reference: z.string(),
  }),

  reliability: z.enum(['LOW', 'MEDIUM', 'HIGH', 'AUTHORITATIVE']),

  verified: z.boolean(),

  verifiedAt: z.date().optional(),

  createdAt: z.date(),
});

export type Evidence = z.infer<typeof evidenceSchema>;
