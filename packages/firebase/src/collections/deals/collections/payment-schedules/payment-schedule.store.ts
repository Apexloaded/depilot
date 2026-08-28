import { CreatePaymentScheduleInput } from './payment-schedule.type';

class PaymentScheduleStore {
  createSchedule(input: CreatePaymentScheduleInput) {}
}

export const paymentScheduleStore = new PaymentScheduleStore();
