
import { z } from 'zod';

export const paymentPlanExtractionSchema = z.object({
  durationMonths: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe(
      'The duration of the plan in months parsed from the user request (e.g., "6 months" -> 6, "2 years" -> 24).'
    ),
  numberOfInstallments: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('The exact number of installments requested by the user.'),
  planNameKeywords: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Any specific name keywords used by the user (e.g., "promo", "standard", "quarterly").'
    ),
});

export type PaymentPlanExtraction = z.infer<typeof paymentPlanExtractionSchema>;