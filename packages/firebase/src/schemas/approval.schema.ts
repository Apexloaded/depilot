import { z } from 'zod';

export const approvalSchema = z.object({
  id: z.string(),

  workflowId: z.string(),
  transactionId: z.string(),

  type: z.enum([
    'LEGAL_APPROVAL',
    'ALLOCATION_APPROVAL',
    'FINAL_CLOSING_APPROVAL',
  ]),

  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),

  requestedBy: z.object({
    type: z.enum(['AGENT', 'SYSTEM']),
    id: z.string().optional(),
  }),

  approver: z
    .object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
    })
    .optional(),

  reason: z.string(),

  evidence: z.array(z.string()),

  requestedAt: z.date(),

  resolvedAt: z.date().optional(),

  rejectionReason: z.string().optional(),
});

export type Approval = z.infer<typeof approvalSchema>;
