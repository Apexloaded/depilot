import { z } from 'zod';

export const workflowSchema = z.object({
  id: z.string(),

  transactionId: z.string(),

  type: z.literal('PROPERTY_TRANSACTION_CLOSING'),

  status: z.enum([
    'PENDING',
    'RUNNING',
    'WAITING',
    'PAUSED',
    'READY_FOR_APPROVAL',
    'COMPLETED',
    'FAILED',
    'DEAD_LETTERED',
  ]),

  currentStep: z.string(),

  waitingFor: z
    .object({
      eventType: z.string(),
      correlationId: z.string().optional(),
      deadline: z.date().optional(),
    })
    .optional(),

  attemptCount: z.number().int().nonnegative(),

  version: z.number().int().positive(),

  startedAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),

  lastError: z
    .object({
      code: z.string(),
      message: z.string(),
      occurredAt: z.date(),
    })
    .optional(),
});

export type Workflow = z.infer<typeof workflowSchema>;
