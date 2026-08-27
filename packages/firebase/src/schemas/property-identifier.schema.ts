import { z } from 'zod';

export const propertyIdentifierSchema = z.object({
  id: z.string(),

  propertyId: z.string(),

  type: z.enum([
    'PLOT_NUMBER',
    'BLOCK',
    'SURVEY_REFERENCE',
    'ALLOCATION_REFERENCE',
    'TITLE_REFERENCE',
    'DEED_REFERENCE',
    'INTERNAL_REFERENCE',
    'EXTERNAL_REFERENCE',
    'GPS_REFERENCE',
  ]),

  value: z.string(),

  normalizedValue: z.string().optional(),

  source: z.enum([
    'MASTER_RECORD',
    'DOCUMENT',
    'SURVEYOR',
    'LAWYER',
    'ALLOCATION_SYSTEM',
    'HUMAN',
  ]),

  sourceDocumentId: z.string().optional(),

  status: z.enum(['ACTIVE', 'SUPERSEDED', 'DISPUTED', 'UNVERIFIED']),

  observedAt: z.date().optional(),

  createdAt: z.date(),
});

export type PropertyIdentifier = z.infer<typeof propertyIdentifierSchema>;
