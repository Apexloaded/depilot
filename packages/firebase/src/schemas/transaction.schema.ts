import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string(),

  reference: z.string(),

  status: z.enum([
    'INTAKE',
    'PROCESSING',
    'EXCEPTION',
    'WAITING',
    'READY_FOR_CLOSING',
    'CLOSED',
    'CANCELLED',
  ]),

  buyer: z.object({
    id: z.string().optional(),
    fullName: z.string(),
    email: z.email().optional(),
    phone: z.string().optional(),
  }),

  property: z.object({
    id: z.string().optional(),
    estateName: z.string(),
    block: z.string().optional(),
    plotNumber: z.string().optional(),
    size: z.string().optional(),
  }),

  financials: z.object({
    agreedPrice: z.number().positive(),
    amountPaid: z.number().nonnegative(),
    outstandingBalance: z.number(),
    currency: z.literal('NGN'),
  }),

  assignedAgent: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),

  currentWorkflowId: z.string(),

  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),

  closingReadiness: z.object({
    identityVerified: z.boolean(),
    paymentVerified: z.boolean(),
    propertyVerified: z.boolean(),
    allocationConfirmed: z.boolean(),
    legalApproved: z.boolean(),
    surveyVerified: z.boolean(),
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

