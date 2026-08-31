import { z } from 'zod';

export const paymentExtractionSchema = z.object({
  amount: z.number().nullable().describe('Payment amount as a number, or null if illegible/absent.'),
  currency: z.string().nullable().describe('e.g. NGN, USD — null if not determinable.'),
  date: z.string().nullable().describe('Transaction date in ISO format if visible, else null.'),
  referenceNumber: z.string().nullable().describe('Transaction/reference ID, or null if not visible.'),
  bank: z.string().nullable().describe('Sending or receiving bank name, or null.'),
  payerName: z.string().nullable().describe('Name of the person who made the payment, or null.'),
  confidence: z.number().min(0).max(1).describe('Your confidence that the extraction is accurate and complete.'),
  illegibleFields: z.array(z.string()).describe('Names of fields you could not read clearly, even if you guessed a value.'),
});
export type PaymentExtraction = z.infer<typeof paymentExtractionSchema>;

export const paymentExtractionResponseSchema = {
  type: 'object',
  properties: {
    amount: { type: 'number', nullable: true },
    currency: { type: 'string', nullable: true },
    date: { type: 'string', nullable: true },
    referenceNumber: { type: 'string', nullable: true },
    bank: { type: 'string', nullable: true },
    payerName: { type: 'string', nullable: true },
    confidence: { type: 'number' },
    illegibleFields: { type: 'array', items: { type: 'string' } },
  },
  required: ['amount', 'currency', 'date', 'referenceNumber', 'bank', 'payerName', 'confidence', 'illegibleFields'],
};