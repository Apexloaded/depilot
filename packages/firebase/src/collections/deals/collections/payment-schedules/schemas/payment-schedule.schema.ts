import { z } from 'zod';

// ============================================================
// ENUMS
// ============================================================
export enum DealPaymentScheduleType {
  PLOT_PURCHASE = 'PLOT_PURCHASE',
  DOCUMENTATION = 'DOCUMENTATION',
  OTHERS = 'OTHERS',
}
export const DealPaymentScheduleTypeEnum = z.enum(DealPaymentScheduleType);

/**
 * DealPaymentSchedule Document Schema
 * Firestore Collection: `deals/{dealId}/payment_schedules/{scheduleId}`
 */
export const DealPaymentScheduleSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  paymentPlanId: z.string().nullable().optional(),

  totalAmount: z.number().nonnegative(),
  downPaymentAmount: z.number().nonnegative(),
  installmentAmount: z.number().nonnegative(),
  totalPaid: z.number().nonnegative().default(0),
  type: DealPaymentScheduleTypeEnum.default(
    DealPaymentScheduleType.PLOT_PURCHASE,
  ),
  balance: z.number(),

  startDate: z.date(),
  endDate: z.date(),

  isCompleted: z.boolean().default(false),
  isDefaulted: z.boolean().default(false),
  penaltyAmount: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional(),

  // Denormalized aggregates for fast UI rendering
  installmentCount: z.number().int().nonnegative().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DealPaymentScheduleDocument = z.infer<
  typeof DealPaymentScheduleSchema
>;
