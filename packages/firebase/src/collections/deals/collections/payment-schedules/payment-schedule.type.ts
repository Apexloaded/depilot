import { DealPaymentScheduleDocument } from './schemas';

export type CreatePaymentScheduleInput = Pick<
  DealPaymentScheduleDocument,
  'dealId' | 'paymentPlanId' | 'type' | 'downPaymentAmount' | 'startDate'
>;
