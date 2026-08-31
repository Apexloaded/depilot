import { z } from 'zod';
import { dealBuyerSubcollectionSchema } from './deal-buyer.schema';

// ============================================================
// ENUMS
// ============================================================

export enum DealStage {
  INTAKE = 'INTAKE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DUE_DILIGENCE = 'DUE_DILIGENCE',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PARTIAL = 'PAYMENT_PARTIAL',
  PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
  ALLOCATED = 'ALLOCATED',
  CANCELLED = 'CANCELLED',
}
export const dealStageEnum = z.enum(DealStage);

export enum DealType {
  SALE = 'SALE',
  RENTAL = 'RENTAL',
  LEASE = 'LEASE',
}
export const dealTypeEnum = z.enum(DealType);

export enum OverAllDealPaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FULLY_PAID = 'FULLY_PAID',
  OVERPAID = 'OVERPAID',
}
export const overAllDealPaymentStatusEnum = z.enum(OverAllDealPaymentStatus);

export const dealDocumentSchema = z.object({
  id: z.string(),
  dealNumber: z.string().max(50),
  title: z.string().max(255).nullable().optional(),
  dealType: dealTypeEnum.default(DealType.SALE),
  stage: dealStageEnum.default(DealStage.INTAKE),

  sellerId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),

  // Financial aggregates calculated on write
  paymentStatus: overAllDealPaymentStatusEnum.default(OverAllDealPaymentStatus.UNPAID).optional(),
  totalListPrice: z.number().positive(),
  totalAgreedPrice: z.number().positive().nullable().optional(),
  discountAmount: z.number().nonnegative().default(0),

  // Denormalized read-optimization fields (Avoids secondary fetches)
  primaryBuyer: dealBuyerSubcollectionSchema.nullable().optional(),
  itemCount: z.number().int().nonnegative().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DealDocument = z.infer<typeof dealDocumentSchema>;
