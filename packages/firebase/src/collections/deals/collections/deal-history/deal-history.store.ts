
import { firestore } from '../../../../config/firebase.config';
import { Collections } from '../../../collections';
import {
  DealHistorySubcollection,
  dealHistorySubcollectionSchema,
} from './schemas/deal-history.schema';
import { convertTimestamps } from '../../../../utils';

class DealHistoryStore {
  /**
   * Appends a new history record to a deal's history subcollection.
   * @param dealNumber - The deal number.
   * @param input - The history record to append.
   * @returns The appended history record.
   */
  async appendDealHistory(
    dealNumber: string,
    input: Omit<
      DealHistorySubcollection,
      'id' | 'dealId' | 'createdAt'
    >
  ): Promise<DealHistorySubcollection> {
    const historyDocRef = this.getCollectionRef(dealNumber).doc(); // Auto-generate history document ID
    const historyRecord: DealHistorySubcollection =
      dealHistorySubcollectionSchema.parse({
        ...input,
        id: historyDocRef.id,
        dealId: dealNumber,
        createdAt: new Date(),
      });

    await historyDocRef.set(historyRecord);

    return historyRecord;
  }

  /**
   * Retrieves the complete timeline history of a deal, ordered chronologically.
   * @param dealNumber The deal number.
   * @returns The complete deal history.
   */
  async getDealHistory(
    dealNumber: string
  ): Promise<DealHistorySubcollection[]> {
    const historySnapshot = await this.getCollectionRef(dealNumber)
      .orderBy('createdAt', 'asc') // Ascending order shows the timeline from oldest to newest
      .get();

    const history = historySnapshot.docs.map((doc: FirebaseFirestore.DocumentSnapshot) =>
      this.parseDocument(doc)
    );

    return history as DealHistorySubcollection[];
  }



  /**
 * Helper to get the subcollection reference.
 */
  private getCollectionRef(dealNumber: string) {
    return firestore
      .collection(Collections.Deals.Index)
      .doc(dealNumber)
      .collection(Collections.Deals.History);
  }

  /**
   * Converts raw Firestore document data back into a validated TS Document,
   * safely casting Firestore Timestamps to JS Dates.
   */
  private parseDocument(
    doc: FirebaseFirestore.DocumentSnapshot
  ): DealHistorySubcollection | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    const parsedData = convertTimestamps(data);
    const parsed = dealHistorySubcollectionSchema.parse(parsedData);
    parsed.id = doc.id;

    return parsed;
  }
}

export const dealHistoryStore = new DealHistoryStore();
