import { firestore } from '../../../../config';
import {
  PaymentSchema,
  PaymentDocument
} from './schemas';
import { convertTimestamps } from '../../../../utils';
import { Collections } from '../../../collections';
import { Transaction } from 'firebase-admin/firestore';

export class PaymentStore {
  /**
   * Creates a new split allocation document.
   */
  async create(
    dealNumber: string,
    input: Omit<PaymentDocument, 'id' | 'dealId' | 'createdAt'>,
    tx?: Transaction
  ): Promise<PaymentDocument> {
    const collectionRef = this.getCollectionRef(dealNumber);
    const docRef = collectionRef.doc();
    const now = new Date();

    const newPayment: PaymentDocument = PaymentSchema.parse({
      ...input,
      id: docRef.id,
      dealId: dealNumber,
      createdAt: now,
    });

    if (tx) {
      tx.set(docRef, newPayment);
    } else {
      await docRef.set(newPayment);
    }

    return newPayment;
  }

  /**
   * Fetches a single payment document.
   */
  async get(dealNumber: string, paymentId: string): Promise<PaymentDocument | null> {
    const docRef = this.getCollectionRef(dealNumber).doc(paymentId);
    const snapshot = await docRef.get();
    return this.parseDocument(snapshot);
  }

  /**
   * Lists all payments for a specific deal.
   */
  async list(dealNumber: string): Promise<PaymentDocument[]> {
    const snapshot = await this.getCollectionRef(dealNumber).get();
    const payments: PaymentDocument[] = [];

    snapshot.forEach((doc) => {
      const parsed = this.parseDocument(doc);
      if (parsed) {
        payments.push(parsed);
      }
    });

    return payments;
  }

  /**
   * Updates an existing split allocation document.
   */
  async update(
    dealNumber: string,
    paymentId: string,
    input: Partial<Omit<PaymentDocument, 'id' | 'dealId' | 'createdAt'>>
  ): Promise<PaymentDocument> {
    const docRef = this.getCollectionRef(dealNumber).doc(paymentId);

    await docRef.update(input);

    const updatedDoc = await this.get(dealNumber, paymentId);
    if (!updatedDoc) {
      throw new Error(`Payment ${paymentId} could not be read after update`);
    }

    return updatedDoc;
  }

  /**
   * Deletes a payment.
   */
  async delete(dealNumber: string, paymentId: string): Promise<void> {
    await this.getCollectionRef(dealNumber).doc(paymentId).delete();
  }

  /**
 * Helper to get the subcollection reference.
 */
  private getCollectionRef(dealId: string) {
    return firestore
      .collection(Collections.Deals.Index)
      .doc(dealId)
      .collection(Collections.Deals.Payments);
  }

  /**
   * Helper to parse raw Firestore document data, converting Timestamps to Dates.
   */
  private parseDocument(doc: FirebaseFirestore.DocumentSnapshot): PaymentDocument | null {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    return PaymentSchema.parse(convertTimestamps(data));
  }
}

export const paymentStore = new PaymentStore();
