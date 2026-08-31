
import { Transaction } from 'firebase-admin/firestore';
import { firestore } from '../../../../config/index.js';
import { convertTimestamps } from '../../../../utils/index.js';
import { Collections } from '../../../collections.js';
import {
  PaymentRecordSchema,
  PaymentRecordDocument
} from './index.js';

export class PaymentRecordStore {

  /**
 * Creates a new transaction payment record.
 */
  async create(
    dealNumber: string,
    input: Omit<PaymentRecordDocument, 'id' | 'dealId' | 'createdAt'>,
    paymentRecordId?: string,
    tx?: Transaction
  ): Promise<PaymentRecordDocument> {
    const collectionRef = this.getCollectionRef(dealNumber);
    const docRef = collectionRef.doc();
    const id = paymentRecordId ?? docRef.id;
    const now = new Date();

    const newRecord: PaymentRecordDocument = PaymentRecordSchema.parse({
      ...input,
      id,
      dealId: dealNumber,
      createdAt: now,
    });

    if (tx) {
      tx.set(docRef, newRecord);
    } else {
      await docRef.set(newRecord);
    }

    return newRecord;
  }

  /**
   * Fetches a single payment record.
   */
  async get(dealNumber: string, recordId: string): Promise<PaymentRecordDocument | null> {
    const docRef = this.getCollectionRef(dealNumber).doc(recordId);
    const snapshot = await docRef.get();
    return this.parseDocument(snapshot);
  }

  /**
   * Search globally across all payment records for a specific deal and reference number.
   * Uses a Collection Group query.
   */
  async findByReferenceNumber(dealId: string, referenceNumber: string): Promise<PaymentRecordDocument[]> {
    const snapshot = await firestore
      .collectionGroup('payment_records')
      .where('dealId', '==', dealId)
      .where('referenceNumber', '==', referenceNumber)
      .get();

    const records: PaymentRecordDocument[] = [];
    snapshot.forEach((doc) => {
      const parsed = this.parseDocument(doc);
      if (parsed) {
        records.push(parsed);
      }
    });

    return records;
  }

  /**
   * Lists all payment records for a specific deal.
   */
  async list(dealNumber: string): Promise<PaymentRecordDocument[]> {
    const snapshot = await this.getCollectionRef(dealNumber).orderBy('createdAt', 'desc').get();
    const records: PaymentRecordDocument[] = [];

    snapshot.forEach((doc) => {
      const parsed = this.parseDocument(doc);
      if (parsed) {
        records.push(parsed);
      }
    });

    return records;
  }

  /**
   * Updates an existing transaction payment record.
   */
  async update(
    dealNumber: string,
    recordId: string,
    input: Partial<Omit<PaymentRecordDocument, 'id' | 'dealId' | 'createdAt'>>
  ): Promise<PaymentRecordDocument> {
    const docRef = this.getCollectionRef(dealNumber).doc(recordId);

    await docRef.update(input);

    const updatedDoc = await this.get(dealNumber, recordId);
    if (!updatedDoc) {
      throw new Error(`Payment record ${recordId} could not be read after update`);
    }

    return updatedDoc;
  }

  /**
   * Deletes a payment record.
   */
  async delete(dealNumber: string, recordId: string): Promise<void> {
    await this.getCollectionRef(dealNumber).doc(recordId).delete();
  }

  /**
 * Helper to get the subcollection reference.
 */
  getCollectionRef(dealNumber: string) {
    return firestore
      .collection(Collections.Deals.Index)
      .doc(dealNumber)
      .collection(Collections.Deals.PaymentRecords);
  }

  /**
   * Helper to parse raw Firestore document data, converting Timestamps to Dates.
   */
  private parseDocument(doc: FirebaseFirestore.DocumentSnapshot): PaymentRecordDocument | null {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    return PaymentRecordSchema.parse(convertTimestamps(data));
  }
}

export const paymentRecordStore = new PaymentRecordStore();
