import { z } from 'zod';
import { PaymentStatusEnum } from '../../payments';

/**
 * PaymentRecord Document Schema
 * Firestore Subcollection: `workspaces/{workspaceId}/deals/{dealId}/payment_records/{recordId}`
 */
export const PaymentRecordSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  paymentScheduleId: z.string().nullable().optional(),
  payerId: z.string().nullable().optional(),
  recordedBy: z.string().nullable().optional(),

  amount: z.number().positive(),
  paymentType: z.string().max(50).nullable().optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  paymentGateway: z.string().max(50).nullable().optional(),
  gatewayTransactionId: z.string().max(255).nullable().optional(),
  referenceNumber: z.string().max(100).nullable().optional(),
  status: z.enum(PaymentStatusEnum).default(PaymentStatusEnum.PENDING),
  paymentDate: z.date().optional(),
  description: z.string().nullable().optional(),

  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.date(),
});
export type PaymentRecordDocument = z.infer<typeof PaymentRecordSchema>;
