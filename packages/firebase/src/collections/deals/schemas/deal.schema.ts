import { z } from 'zod';
import { embeddedBuyerSummarySchema } from './deal-buyer.schema';

// ============================================================
// ENUMS
// ============================================================

export enum DealStatus {
  ENQUIRY = "ENQUIRY",
  NEGOTIATION = "NEGOTIATION",
  OFFER_ISSUED = "OFFER_ISSUED",
  SUBSCRIBED = "SUBSCRIBED",
  ALLOCATED = "ALLOCATED",
  DOCUMENTED = "DOCUMENTED",
  CANCELLED = "CANCELLED",
  LOST = "LOST",
}
export const dealStatusEnum = z.enum(DealStatus);

export enum DealType {
  SALE = 'SALE',
  RENTAL = 'RENTAL',
  LEASE = 'LEASE',
}
export const dealTypeEnum = z.enum(DealType);

export const dealDocumentSchema = z.object({
  id: z.string(),
  dealNumber: z.string().max(50),
  title: z.string().max(255).nullable().optional(),
  dealType: dealTypeEnum.default(DealType.SALE),
  status: dealStatusEnum.default(DealStatus.ENQUIRY),

  sellerId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),

  // Financial aggregates calculated on write
  totalListPrice: z.number().positive(),
  totalAgreedPrice: z.number().positive().nullable().optional(),
  discountAmount: z.number().nonnegative().default(0),

  // Denormalized read-optimization fields (Avoids secondary fetches)
  buyerIds: z.array(z.string()), // Enables `.where('buyerIds', 'array-contains', userId)`
  primaryBuyer: embeddedBuyerSummarySchema.nullable().optional(),
  itemCount: z.number().int().nonnegative().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DealDocument = z.infer<typeof dealDocumentSchema>;
