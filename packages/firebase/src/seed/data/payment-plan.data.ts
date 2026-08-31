import { Collections } from '../../collections/collections';
import { PaymentPlan, PaymentPlanSchema } from '../../collections/payment-plan';
import { firestore } from '../../config';

export const paymentPlanSeedData: PaymentPlan[] = [
  {
    id: 'plan-outright-001',
    name: 'Outright Payment',
    description:
      '100% upfront payment with full discount benefits and immediate allocation.',
    durationMonths: 1,
    numberOfInstallments: 1,
    downPaymentPercentage: 100,
    interestRate: 0,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-01T09:00:00.000Z'),
    updatedAt: new Date('2026-01-01T09:00:00.000Z'),
  },
  {
    id: 'plan-flex-3m-002',
    name: '3-Month Flexi Plan',
    description:
      'Short-term zero-interest plan structured across 3 equal monthly installments.',
    durationMonths: 3,
    numberOfInstallments: 3,
    downPaymentPercentage: 30,
    interestRate: 0,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-01T09:00:00.000Z'),
    updatedAt: new Date('2026-01-01T09:00:00.000Z'),
  },
  {
    id: 'plan-standard-6m-003',
    name: '6-Month Standard Plan',
    description:
      'Balanced payment scheme over 6 months with minimal down payment.',
    durationMonths: 6,
    numberOfInstallments: 6,
    downPaymentPercentage: 20,
    interestRate: 2.5,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-05T10:00:00.000Z'),
    updatedAt: new Date('2026-01-05T10:00:00.000Z'),
  },
  {
    id: 'plan-extended-12m-004',
    name: '12-Month Extended Plan',
    description: '1-year spread structured for low monthly commitment.',
    durationMonths: 12,
    numberOfInstallments: 12,
    downPaymentPercentage: 15,
    interestRate: 5,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-10T11:30:00.000Z'),
    updatedAt: new Date('2026-01-10T11:30:00.000Z'),
  },
  {
    id: 'plan-investor-24m-005',
    name: '24-Month Long-Term Plan',
    description:
      'Extended installment structure designed for commercial and long-term land buyers.',
    durationMonths: 24,
    numberOfInstallments: 24,
    downPaymentPercentage: 10,
    interestRate: 8.5,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-15T14:00:00.000Z'),
    updatedAt: new Date('2026-01-15T14:00:00.000Z'),
  },
];

export async function seedPaymentPlan() {
  const batch = firestore.batch();

  for (const property of paymentPlanSeedData) {
    const validatedProperty = PaymentPlanSchema.parse(property);
    const propertyReference = firestore
      .collection(Collections.PaymentPlans)
      .doc(property.id);

    batch.set(propertyReference, validatedProperty);
  }

  await batch.commit();
  console.log(`Seeded ${paymentPlanSeedData.length} payment plan(s).`);
}
