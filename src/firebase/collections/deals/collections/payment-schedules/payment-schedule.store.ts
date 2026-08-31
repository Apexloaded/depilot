import { Transaction } from 'firebase-admin/firestore';
import { firestore } from '../../../../config/index.js';
import { convertTimestamps } from '../../../../utils/index.js';
import { Collections } from '../../../collections.js';
import { CreatePaymentScheduleInput } from './payment-schedule.type.js';
import {
  DealPaymentScheduleDocument,
  DealPaymentScheduleSchema,
} from './schemas/index.js';

class PaymentScheduleStore {
  /**
   * Creates a new payment schedule under a deal.
   */
  async create(dealNumber: string, input: CreatePaymentScheduleInput, scheduleId?: string) {
    const collectionRef = this.getCollectionRef(dealNumber);
    const docRef = scheduleId ? collectionRef.doc(scheduleId) : collectionRef.doc(); // Auto-generate document ID
    const now = new Date();

    const newSchedule: DealPaymentScheduleDocument =
      DealPaymentScheduleSchema.parse({
        ...input,
        id: docRef.id,
        dealId: dealNumber,
        createdAt: now,
        updatedAt: now,
      });

    await docRef.set(newSchedule);
    return newSchedule;
  }

  /**
   * Fetches a specific payment schedule.
   */
  async get(
    dealId: string,
    scheduleId: string
  ): Promise<DealPaymentScheduleDocument | null> {
    const docRef = this.getCollectionRef(dealId).doc(scheduleId);
    const snapshot = await docRef.get();
    return this.parseDocument(snapshot);
  }

  /**
   * Lists all payment schedules belonging to a deal.
   */
  async list(dealNumber: string): Promise<DealPaymentScheduleDocument[]> {
    const snapshot = await this.getCollectionRef(dealNumber).get();
    const schedules: DealPaymentScheduleDocument[] = [];

    snapshot.forEach((doc) => {
      const parsed = this.parseDocument(doc);
      if (parsed) {
        schedules.push(parsed);
      }
    });

    return schedules;
  }

  /**
   * Updates an existing payment schedule.
   */
  async update(
    dealId: string,
    scheduleId: string,
    input: Partial<
      Omit<
        DealPaymentScheduleDocument,
        'id' | 'dealId' | 'createdAt' | 'updatedAt'
      >
    >,
    tx?: Transaction
  ): Promise<DealPaymentScheduleDocument> {
    const docRef = this.getCollectionRef(dealId).doc(scheduleId);
    const now = new Date();

    const updateData = {
      ...input,
      updatedAt: now,
    };

    // Update inside Firestore
    if (tx) {
      // 1. Queue the write in the transaction
      tx.update(docRef, updateData);

      // 2. DO NOT fetch from Firestore here. Return the local updated payload directly.
      return {
        id: scheduleId,
        dealId,
        ...updateData,
      } as DealPaymentScheduleDocument;
    }

    // Standard non-transaction flow
    await docRef.update(updateData);
    const updatedDoc = await this.get(dealId, scheduleId);
    if (!updatedDoc) {
      throw new Error(
        `Payment schedule ${scheduleId} could not be read after update`
      );
    }

    return updatedDoc;
  }

  /**
   * Deletes a payment schedule.
   */
  async delete(dealId: string, scheduleId: string): Promise<void> {
    const docRef = this.getCollectionRef(dealId).doc(scheduleId);
    await docRef.delete();
  }

  /**
   * Helper to get the subcollection reference for a specific deal.
   */
  private getCollectionRef(dealNumber: string) {
    // Path: deals/{dealNumber}/payment_schedules
    return firestore
      .collection(Collections.Deals.Index)
      .doc(dealNumber)
      .collection(Collections.Deals.PaymentSchedules);
  }

  /**
   * Converts raw Firestore document data back into a validated TS Document,
   * safely casting Firestore Timestamps to JS Dates.
   */
  private parseDocument(
    doc: FirebaseFirestore.DocumentSnapshot
  ): DealPaymentScheduleDocument | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    const parsedData = convertTimestamps(data);
    return DealPaymentScheduleSchema.parse(parsedData);
  }
}

export const paymentScheduleStore = new PaymentScheduleStore();
