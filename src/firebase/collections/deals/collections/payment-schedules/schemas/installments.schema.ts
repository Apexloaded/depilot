import { z } from 'zod';
import { PaymentStatusEnum } from '../../payments/index.js';

/**
 * Installment Document Schema
 * A property of payment_schedules/{scheduleId}  which is a subcollection of deals/{dealId}
 */
export const InstallmentSchema = z.object({
  id: z.string(),
  paymentScheduleId: z.string(),
  installmentNumber: z.number().int().positive(),

  dueDate: z.date(),
  amountDue: z.number().positive(),
  amountPaid: z.number().nonnegative().default(0),
  status: z.enum(PaymentStatusEnum).default(PaymentStatusEnum.PENDING),
  paidDate: z.date().optional(),
  lateFee: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type InstallmentDocument = z.infer<typeof InstallmentSchema>;
