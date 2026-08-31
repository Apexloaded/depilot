import { DealPaymentScheduleDocument } from './schemas';

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
