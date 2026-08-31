import { z } from 'zod';

export const paymentSchema = z.object({
  id: z.string(),

  transactionId: z.string(),

  reference: z.string(),

  amount: z.number().positive(),

  currency: z.literal('NGN'),

  method: z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'OTHER']),

  status: z.enum(['PENDING', 'RECEIVED', 'VERIFIED', 'MISMATCHED', 'REJECTED']),

  payerName: z.string().optional(),

  paidAt: z.date().optional(),

  verifiedAt: z.date().optional(),

  source: z.enum(['BANK', 'UPLOAD', 'MANUAL']),

  evidenceDocumentId: z.string().optional(),

  createdAt: z.date(),
});

export type Payment = z.infer<typeof paymentSchema>;
