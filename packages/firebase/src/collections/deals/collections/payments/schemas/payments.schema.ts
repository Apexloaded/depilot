import { z } from 'zod';

// ============================================================
// ENUMS
// ============================================================

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

/**
 * Payment (Split Allocation) Document Schema
 * Firestore Subcollection: `workspaces/{workspaceId}/deals/{dealId}/payments/{paymentId}`
 */
export const PaymentSchema = z.object({
  id: z.string(),
  paymentRecordId: z.string(),
  dealId: z.string(),
  paymentScheduleId: z.string().nullable().optional(),
  installmentId: z.string().nullable().optional(),

  amount: z.number().positive(),
  status: z.enum(PaymentStatusEnum).default(PaymentStatusEnum.PENDING),
  createdAt: z.date(),
});
export type PaymentDocument = z.infer<typeof PaymentSchema>;
