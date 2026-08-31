import { DealPaymentScheduleDocument } from './schemas/index.js';

export type CreatePaymentScheduleInput = Pick<
  DealPaymentScheduleDocument,
  | 'paymentPlanId'
  | 'type'
  | 'totalAmount'
  | 'downPaymentAmount'
  | 'startDate'
  | 'endDate'
  | 'balance'
  | 'installmentAmount'
  | 'installmentCount'
  | 'installments'
  | 'notes'
>;
