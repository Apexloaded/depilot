import { z } from 'zod';

/**
 * PaymentPlan Document Schema
 * Firestore Root Collection: `payment_plans/{planId}`
 */
export const PaymentPlanSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  description: z.string().nullable().optional(),
  durationMonths: z.number().int().positive(),
  numberOfInstallments: z.number().int().positive(),
  downPaymentPercentage: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentPlan = z.infer<typeof PaymentPlanSchema>;
