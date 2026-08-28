import { z } from 'zod';
import { propertySchema } from './property.schema';
import { buyerSchema } from './buyer.schema';

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

  buyer: buyerSchema,

  property: propertySchema,

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
