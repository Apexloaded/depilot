import { z } from 'zod';

export const exceptionRecordSchema = z.object({
  id: z.string(),

  workflowId: z.string(),
  transactionId: z.string(),

  type: z.enum([
    'PROPERTY_IDENTIFIER_CONFLICT',
    'PAYMENT_MISMATCH',
    'IDENTITY_MISMATCH',
    'MISSING_DOCUMENT',
    'EXTERNAL_SYSTEM_FAILURE',
    'VERIFICATION_FAILURE',
    'DEADLINE_BREACH',
  ]),

  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

  title: z.string(),

  description: z.string(),

  status: z.enum(['OPEN', 'INVESTIGATING', 'WAITING', 'RESOLVED', 'ESCALATED']),

  detectedBy: z.enum(['AGENT', 'SYSTEM', 'HUMAN']),

  resolution: z
    .object({
      description: z.string(),
      resolvedBy: z.string(),
      resolvedAt: z.date(),
    })
    .optional(),

  createdAt: z.date(),
});

export type ExceptionRecord = z.infer<typeof exceptionRecordSchema>;
