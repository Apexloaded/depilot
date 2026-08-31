import { z } from 'zod';

export const domainEventSchema = z.object({
  id: z.string(),

  type: z.enum([
    'transaction.created',
    'document.uploaded',
    'document.validated',
    'payment.received',
    'payment.reconciled',
    'payment.reconciliation.failed',
    'property.identity.conflict.detected',
    'allocation.confirmation.requested',
    'allocation.confirmed',
    'legal.review.requested',
    'legal.review.completed',
    'survey.verification.requested',
    'survey.verification.completed',
    'exception.created',
    'exception.resolved',
    'approval.requested',
    'approval.approved',
    'approval.rejected',
    'workflow.paused',
    'workflow.resumed',
    'workflow.failed',
    'workflow.completed',
    'transaction.closed',
  ]),

  workflowId: z.string(),
  transactionId: z.string(),

  correlationId: z.string().optional(),

  payload: z.record(z.string(), z.unknown()),

  source: z.enum(['API', 'AGENT', 'WORKER', 'EXTERNAL_SYSTEM', 'HUMAN']),

  idempotencyKey: z.string(),

  createdAt: z.date(),

  processedAt: z.date().optional(),

  processingStatus: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED']),
});

export type DomainEvent = z.infer<typeof domainEventSchema>;
