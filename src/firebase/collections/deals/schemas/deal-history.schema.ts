import { z } from 'zod';
import { DealStage } from './deal.schema.js';

export const dealHistorySubcollectionSchema = z.object({
  id: z.string(),
  dealNumber: z.string(),
  action: z.string(), // e.g. 'CREATED', 'STAGE_TRANSITION', 'PAYMENT_APPLIED', 'FIELDS_UPDATED'
  fromStage: z.enum(DealStage).optional(),
  toStage: z.enum(DealStage).optional(),
  details: z.record(z.string(), z.any()).optional(),
  performedAt: z.date(),
});

export type DealHistorySubcollection = z.infer<typeof dealHistorySubcollectionSchema>;