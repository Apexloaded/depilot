import { z } from 'zod';

export const documentRecordSchema = z.object({
  id: z.string(),

  transactionId: z.string(),
  workflowId: z.string(),

  type: z.enum([
    'BUYER_ID',
    'PAYMENT_RECEIPT',
    'ALLOCATION_FORM',
    'SURVEY_PLAN',
    'DEED',
    'TITLE_DOCUMENT',
    'OTHER',
  ]),

  fileName: z.string(),

  storagePath: z.string(),

  mimeType: z.string(),

  sizeBytes: z.number().int().nonnegative().optional(),

  hash: z.string().optional(),

  status: z.enum([
    'UPLOADED',
    'PROCESSING',
    'PROCESSED',
    'VALID',
    'INVALID',
    'CONFLICT',
  ]),

  extractedData: z.record(z.string(), z.unknown()).optional(),

  uploadedAt: z.date(),
  processedAt: z.date().optional(),
});

export type DocumentRecord = z.infer<typeof documentRecordSchema>;
