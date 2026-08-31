import { z } from 'zod';

export const externalVerificationSchema = z.object({
  id: z.string(),

  workflowId: z.string(),
  transactionId: z.string(),

  type: z.enum(['ALLOCATION', 'LEGAL', 'SURVEY', 'PROPERTY_REGISTRY']),

  provider: z.string(),

  status: z.enum([
    'REQUESTED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'EXPIRED',
  ]),

  requestPayload: z.record(z.string(), z.unknown()),

  responsePayload: z.record(z.string(), z.unknown()).optional(),

  requestedAt: z.date(),

  completedAt: z.date().optional(),

  expiresAt: z.date().optional(),

  attemptCount: z.number().int().nonnegative(),

  lastError: z.string().optional(),
});

export type ExternalVerification = z.infer<typeof externalVerificationSchema>;
