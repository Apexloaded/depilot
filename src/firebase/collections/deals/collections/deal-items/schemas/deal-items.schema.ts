import { z } from 'zod';

export enum DealItemType {
  PLOT = 'PLOT',
  HOUSE = 'HOUSE'
}
export const dealItemTypeEnum = z.enum(DealItemType);

export enum DealItemStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  OFFER_ISSUED = 'OFFER_ISSUED',
  SUBSCRIBED = 'SUBSCRIBED',
  ALLOCATED = 'ALLOCATED',
  CANCELLED = 'CANCELLED',
}
export const dealItemStatusEnum = z.enum(DealItemStatus);

export const dealItemSubcollectionSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  itemType: dealItemTypeEnum.default(DealItemType.PLOT),
  plotId: z.string().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  status: dealItemStatusEnum.default(DealItemStatus.PENDING),
  listPrice: z.number().positive(),
  agreedPrice: z.number().positive().nullable().optional(),
  createdAt: z.date(),
});

export type DealItemSubcollection = z.infer<typeof dealItemSubcollectionSchema>;
