import { firestore } from '../../config/firebase.config';
import { convertTimestamps } from '../../utils';
import { Collections } from '../collections';
import { PaymentPlan, PaymentPlanSchema } from './schemas/payment-plan.schema';

class PaymentPlanStore {
  private collection = firestore.collection(Collections.PaymentPlans);

  /**
   * Fetches a single payment plan.
   */
  async get(planId: string): Promise<PaymentPlan | null> {
    const doc = await this.collection.doc(planId).get();
    if (!doc.exists) return null;
    return this.parseDocument(doc);
  }

  /**
   * Lists all active, non-deleted payment plans.
   */
  async listActive(): Promise<PaymentPlan[]> {
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .where('isDeleted', '==', false)
      .get();

    const plans: PaymentPlan[] = [];
    snapshot.forEach((doc) => {
      const parsed = this.parseDocument(doc);
      if (parsed) {
        plans.push(parsed);
      }
    });

    return plans;
  }

  /**
   * Helper to parse raw Firestore document data, converting Timestamps to Dates.
   */
  private parseDocument(doc: FirebaseFirestore.DocumentSnapshot): PaymentPlan | null {
    const data = doc.data();
    if (!data) return null;
    return PaymentPlanSchema.parse(convertTimestamps(data));
  }
}

export const paymentPlanStore = new PaymentPlanStore();
