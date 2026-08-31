import z from 'zod';
import { firestore } from '../../config/firebase.config';
import { Collections } from '../collections';
import { estateStore } from '../estates';
import { parsePlot } from '../plots/plot.utils';
import {
  type DealWithItemsAndBuyers,
  type CreateDealInput,
  type UpdateDealInput,
  SearchDealInput,
} from './deal.type';
import { DealDocument, dealDocumentSchema } from './schemas';
import {
  DealBuyerSubcollection,
  dealBuyerSubcollectionSchema,
  DealItemStatus,
  DealItemSubcollection,
  dealItemSubcollectionSchema,
  DealItemType,
} from './collections';
import { convertTimestamps } from '../../utils';

const dealsCollection = firestore.collection(Collections.Deals.Index);
const countersCollection = firestore.collection(Collections.Counters);
const plotsCollection = firestore.collection(Collections.Plots);

class DealStore {
  /**
   * @description Creates a new deal with its items.
   * Uses a transaction to ensure atomicity.
   * Validates that plots are not double-reserved.
   * @param {CreateDealInput} input - The deal data to create.
   * @returns {Promise<DealWithItemsAndBuyers>} The created deal with its items.
   */
  async create(input: CreateDealInput): Promise<DealWithItemsAndBuyers> {
    return firestore.runTransaction(async (tx) => {
      const dealNumber = await this.getNextSequentialNumber();
      const dealReference = dealsCollection.doc(dealNumber);
      const id = dealReference.id;
      const now = new Date();

      // ==========================================
      // 1. PROCESS ITEMS
      // ==========================================
      const dealItems = input.items ?? [];
      const itemDataMap = new Map<
        number,
        { listPrice: number; agreedPrice: number }
      >();

      const dealItemsCollection = dealReference.collection(
        Collections.Deals.Items
      );

      for (const [index, item] of dealItems.entries()) {
        // Validate item references
        if (item.itemType === DealItemType.PLOT && !item.plotId) {
          throw new Error('plotId required for PLOT item');
        }
        if (item.itemType === DealItemType.HOUSE && !item.propertyId) {
          throw new Error('propertyId required for HOUSE item');
        }

        let itemListPrice = 0;

        if (item.plotId) {
          // Get existing deal items and plot
          const plotRef = plotsCollection.doc(item.plotId);
          const reservedQuery = dealItemsCollection
            .where('status', '==', DealItemStatus.RESERVED)
            .where('plotId', '==', item.plotId)
            .limit(1);

          const [plotSnapshot, dealItemSnapshot] = await Promise.all([
            tx.get(plotRef),
            tx.get(reservedQuery),
          ]);

          if (!plotSnapshot.exists) {
            throw new Error(`Plot ${item.plotId} does not exist`);
          }
          if (dealItemSnapshot.size > 0) {
            throw new Error(`Plot ${item.plotId} is already reserved`);
          }

          const plot = parsePlot(item.plotId, plotSnapshot.data() ?? {});
          if (!plot) {
            throw new Error(`Plot ${item.plotId} does not exist`);
          }

          const estate = await estateStore.getEstateByPlotId(item.plotId);
          const plotPrice = estate?.price ?? 0;

          itemListPrice = plotPrice;
        }

        itemDataMap.set(index, {
          listPrice: itemListPrice,
          agreedPrice: item.agreedPrice ?? itemListPrice,
        });
      }

      const itemsWithReferences = dealItems.map((item, index) => {
        const itemReference = item.plotId
          ? dealItemsCollection.doc(item.plotId)
          : item.propertyId
            ? dealItemsCollection.doc(item.propertyId)
            : dealItemsCollection.doc();

        const listPrice = itemDataMap.get(index)?.listPrice ?? 0;
        const parsedItem = dealItemSubcollectionSchema.parse({
          ...item,
          id: itemReference.id,
          dealId: id,
          listPrice,
          createdAt: now,
        });

        return { item: parsedItem, reference: itemReference };
      });

      const items = itemsWithReferences.map(({ item }) => item);
      const totalListPrice = Array.from(itemDataMap.values()).reduce(
        (sum, item) => sum + item.listPrice,
        0
      );
      const totalAgreedPrice = Array.from(itemDataMap.values()).reduce(
        (sum, item) => sum + item.agreedPrice,
        0
      );

      // ==========================================
      // 2. PROCESS BUYERS (SUBCOLLECTION)
      // ==========================================
      const dealBuyers = input.buyers ?? [];
      const dealBuyersCollection = dealReference.collection(
        Collections.Deals.Buyers // Make sure to add 'DealBuyers' to your Collections enum
      );

      const buyersWithReferences = dealBuyers.map((buyer) => {
        // Use the user's ID as the document ID in the subcollection
        const buyerReference = dealBuyersCollection.doc(buyer.id);
        const parsedBuyer = dealBuyerSubcollectionSchema.parse({
          ...buyer,
          dealId: id,
        });

        return { buyer: parsedBuyer, reference: buyerReference };
      });
      const buyers = buyersWithReferences.map(({ buyer }) => buyer);

      // ==========================================
      // 3. BUILD & WRITE DEAL DOCUMENT
      // ==========================================
      const deal = dealDocumentSchema.parse({
        ...input.deal,
        id,
        dealNumber,
        totalListPrice,
        totalAgreedPrice,
        discountAmount:
          totalAgreedPrice === null
            ? 0
            : Math.max(totalListPrice - totalAgreedPrice, 0),
        itemCount: items.length,
        createdAt: now,
        updatedAt: now,
      });

      // Write parent deal document
      tx.set(dealReference, deal);

      // Write items subcollection documents
      for (const { item, reference } of itemsWithReferences) {
        tx.set(reference, item);
      }
      // Write buyers subcollection documents
      for (const { buyer, reference } of buyersWithReferences) {
        tx.set(reference, buyer);
      }

      return { deal, items, buyers };
    });
  }

  /**
   * Fetches a deal and its items.
   * @param dealNumber The deal number.
   * @returns The deal and its items, or null if the deal does not exist.
   */
  async fetchDeal(
    dealNumber: string,
    tx?: FirebaseFirestore.Transaction
  ): Promise<DealWithItemsAndBuyers | null> {
    const docRef = dealsCollection.doc(dealNumber);
    const dealSnapshot = tx ? await tx.get(docRef) : await docRef.get();

    if (!dealSnapshot.exists) {
      return null;
    }

    const itemSnapshot = tx
      ? await tx.get(docRef.collection(Collections.Deals.Items))
      : await docRef.collection(Collections.Deals.Items).get();

    const buyersSnapshot = tx
      ? await tx.get(docRef.collection(Collections.Deals.Buyers))
      : await docRef.collection(Collections.Deals.Buyers).get();

    const deal = this.parseDocument(dealSnapshot, dealDocumentSchema);
    if (!deal) {
      return null;
    }

    return {
      deal,
      items: itemSnapshot.docs.flatMap((item) => {
        const parsedItem = this.parseDocument(
          item,
          dealItemSubcollectionSchema
        );
        return parsedItem ? [parsedItem] : [];
      }),
      buyers: buyersSnapshot.docs.flatMap((buyer) => {
        const parsedBuyer = this.parseDocument(
          buyer,
          dealBuyerSubcollectionSchema
        );
        return parsedBuyer ? [parsedBuyer] : [];
      }),
    };
  }

  /**
   * Searches for deals based on the provided query.
   * @param query The search query.
   * @returns A list of deals that match the query.
   */
  async searchDeals(input: SearchDealInput): Promise<DealWithItemsAndBuyers[]> {
    let matchingDealIds: string[] | null = null;

    // ============================================================
    // STEP 1: Search by Buyer Name or Phone (Collection Group)
    // ============================================================
    if (input.name || input.phone || input.email) {
      let buyerQuery: FirebaseFirestore.Query = firestore.collectionGroup(
        Collections.Deals.Buyers
      );

      if (input.name) {
        buyerQuery = buyerQuery.where('name', '==', input.name.toLowerCase());
      }
      if (input.phone) {
        buyerQuery = buyerQuery.where('phone', '==', input.phone.toLowerCase());
      }
      if (input.email) {
        buyerQuery = buyerQuery.where('email', '==', input.email.toLowerCase());
      }

      const buyerSnapshot = await buyerQuery.get();
      if (buyerSnapshot.empty) {
        return []; // No buyers match, so no deals can match
      }

      const uniqueIds = new Set<string>();
      buyerSnapshot.forEach((doc) => {
        const data = doc.data();

        const isFromDealsCollection = doc.ref.path.startsWith(
          `${Collections.Deals}/`
        );
        if (isFromDealsCollection && data.dealId) {
          uniqueIds.add(data.dealId);
        }
      });
      matchingDealIds = Array.from(uniqueIds);
    }

    // ============================================================
    // STEP 2: Query the Parent Deals Collection
    // ============================================================
    let deals: DealDocument[] = [];

    // If buyer filters were used but found no matching deal IDs
    if (matchingDealIds !== null && matchingDealIds.length === 0) {
      return [];
    }

    // If we have specific deal IDs to look up, we must query them in chunks of 30
    // due to Firestore's 'in' operator limits.
    if (matchingDealIds !== null) {
      const chunkSize = 30;
      const idChunks: string[][] = [];

      for (let i = 0; i < matchingDealIds.length; i += chunkSize) {
        idChunks.push(matchingDealIds.slice(i, i + chunkSize));
      }

      for (const chunk of idChunks) {
        let chunkQuery: FirebaseFirestore.Query = dealsCollection.where(
          'id',
          'in',
          chunk
        );

        if (input.dealNumber) {
          chunkQuery = chunkQuery.where('dealNumber', '==', input.dealNumber);
        }
        if (input.dealType) {
          chunkQuery = chunkQuery.where('dealType', '==', input.dealType);
        }
        if (input.title) {
          chunkQuery = chunkQuery.where('title', '==', input.title);
        }

        const chunkSnapshot = await chunkQuery.get();
        chunkSnapshot.forEach((doc) => {
          deals.push(doc.data() as DealDocument);
        });
      }
    } else {
      // If no buyer filters were supplied, query the parent collection directly
      let parentQuery: FirebaseFirestore.Query = dealsCollection;

      if (input.dealNumber) {
        parentQuery = parentQuery.where('dealNumber', '==', input.dealNumber);
      }
      if (input.dealType) {
        parentQuery = parentQuery.where('dealType', '==', input.dealType);
      }
      if (input.title) {
        parentQuery = parentQuery.where('title', '==', input.title);
      }

      const parentSnapshot = await parentQuery.get();
      parentSnapshot.forEach((doc) => {
        deals.push(doc.data() as DealDocument);
      });
    }

    // ============================================================
    // STEP 3: Hydrate Subcollections (Items & Buyers) for matched Deals
    // ============================================================
    const hydratedDeals: DealWithItemsAndBuyers[] = await Promise.all(
      deals.map(async (deal) => {
        const dealRef = dealsCollection.doc(deal.id || deal.dealNumber);

        const itemsRef = dealRef.collection(Collections.Deals.Items);
        const buyersRef = dealRef.collection(Collections.Deals.Buyers);

        const [itemsSnapshot, buyersSnapshot] = await Promise.all([
          itemsRef.get(),
          buyersRef.get(),
        ]);

        const items: DealItemSubcollection[] = [];
        itemsSnapshot.forEach((doc) => {
          items.push(doc.data() as DealItemSubcollection);
        });

        const buyers: DealBuyerSubcollection[] = [];
        buyersSnapshot.forEach((doc) => {
          buyers.push(doc.data() as DealBuyerSubcollection);
        });

        return {
          deal,
          items,
          buyers,
        };
      })
    );

    return hydratedDeals;
  }

  /**
   * Updates an existing deal.
   * @param dealNumber The deal number.
   * @param input The update data.
   * @returns The updated deal and its items.
   */
  async update(
    dealNumber: string,
    input: UpdateDealInput,
    tx?: FirebaseFirestore.Transaction
  ): Promise<Partial<DealWithItemsAndBuyers>> {
    // -------------------------------------------------------------------
    // RULE: In a transaction context, DO NOT run reads inside store writes!
    // Reads must be performed upfront by the caller before starting writes.
    // -------------------------------------------------------------------
    const current = tx ? null : await this.fetchDeal(dealNumber);

    if (!tx && !current) {
      throw new Error(`Deal ${dealNumber} does not exist`);
    }

    const batch = !tx ? firestore.batch() : null;

    const writer = {
      update: (
        ref: FirebaseFirestore.DocumentReference,
        data: FirebaseFirestore.UpdateData<any>
      ) => {
        if (tx) tx.update(ref, data);
        else batch!.update(ref, data);
      },
      set: (
        ref: FirebaseFirestore.DocumentReference,
        data: any,
        options?: FirebaseFirestore.SetOptions
      ) => {
        if (tx) {
          options ? tx.set(ref, data, options) : tx.set(ref, data);
        } else {
          options ? batch!.set(ref, data, options) : batch!.set(ref, data);
        }
      },
      delete: (ref: FirebaseFirestore.DocumentReference) => {
        if (tx) tx.delete(ref);
        else batch!.delete(ref);
      },
    };

    const updatedAt = new Date();
    const dealDocRef = dealsCollection.doc(dealNumber);

    // ============================================================
    // 1. UPDATE ROOT DEAL DOCUMENT FIELDS
    // ============================================================
    const updateData = { ...input };
    delete updateData.items;
    delete updateData.buyers;

    writer.update(dealDocRef, {
      ...updateData,
      updatedAt,
    });

    // ============================================================
    // 2. DIFFERENTIAL UPDATE: ITEMS SUBCOLLECTION
    // ============================================================
    let items = current?.items || [];
    if (input.items && current) {
      const itemCollection = dealDocRef.collection(Collections.Deals.Items);

      const incomingItemsWithIds = input.items.map((item) => ({
        ...item,
        id: item.id || itemCollection.doc().id,
      }));
      const incomingItemIds = new Set(
        incomingItemsWithIds.map((item) => item.id)
      );

      for (const currentItem of current.items) {
        if (!incomingItemIds.has(currentItem.id)) {
          writer.delete(itemCollection.doc(currentItem.id));
        }
      }

      items = incomingItemsWithIds.map((item) => {
        const existingItem = current.items.find((i) => i.id === item.id);

        const parsedItem = dealItemSubcollectionSchema.parse({
          ...item,
          dealId: dealNumber,
          createdAt: existingItem ? existingItem.createdAt : updatedAt,
        });

        writer.set(itemCollection.doc(parsedItem.id), parsedItem, {
          merge: true,
        });
        return parsedItem;
      });

      const totalListPrice = items.reduce(
        (total, item) => total + item.listPrice,
        0
      );
      const agreedPrices = items
        .map((item) => item.agreedPrice)
        .filter(
          (price): price is number => price !== null && price !== undefined
        );
      const totalAgreedPrice = agreedPrices.length
        ? agreedPrices.reduce((total, price) => total + price, 0)
        : null;

      writer.update(dealDocRef, {
        totalListPrice,
        totalAgreedPrice,
        discountAmount:
          totalAgreedPrice === null
            ? 0
            : Math.max(totalListPrice - totalAgreedPrice, 0),
        itemCount: items.length,
      });
    }

    // ============================================================
    // 3. DIFFERENTIAL UPDATE: BUYERS SUBCOLLECTION
    // ============================================================
    let buyers = current?.buyers || [];
    if (input.buyers && current) {
      const buyerCollection = dealDocRef.collection(Collections.Deals.Buyers);

      const incomingBuyerIds = new Set(input.buyers.map((buyer) => buyer.id));

      for (const currentBuyer of current.buyers) {
        if (!incomingBuyerIds.has(currentBuyer.id)) {
          writer.delete(buyerCollection.doc(currentBuyer.id));
        }
      }

      buyers = input.buyers.map((buyer) => {
        const parsedBuyer = dealBuyerSubcollectionSchema.parse({
          ...buyer,
          dealId: dealNumber,
        });

        writer.set(buyerCollection.doc(parsedBuyer.id), parsedBuyer, {
          merge: true,
        });
        return parsedBuyer;
      });

      const primaryBuyer = buyers.find((b) => b.isPrimary) || buyers[0] || null;
      writer.update(dealDocRef, {
        primaryBuyer,
      });
    }

    // ============================================================
    // 4. ATOMIC COMMIT AND RETURN
    // ============================================================
    if (batch) {
      await batch.commit();

      const updated = await this.fetchDeal(dealNumber);
      if (!updated) {
        throw new Error(`Deal ${dealNumber} could not be read after update`);
      }
      return updated;
    }

    // If in transaction context, return optimistic result without DB fetch
    return { ...updateData };
  }

  /**
   * Deletes a deal and all its subcollections.
   * @param dealNumber The deal number.
   */
  async delete(dealNumber: string): Promise<void> {
    const dealRef = dealsCollection.doc(dealNumber);

    // 1. Fetch all documents from BOTH subcollections concurrently
    const [itemSnapshot, buyerSnapshot] = await Promise.all([
      dealRef.collection(Collections.Deals.Items).get(),
      dealRef.collection(Collections.Deals.Buyers).get(),
    ]);

    const batch = firestore.batch();

    // 2. Delete all items
    for (const item of itemSnapshot.docs) {
      batch.delete(item.ref);
    }

    // 3. Delete all buyers
    for (const buyer of buyerSnapshot.docs) {
      batch.delete(buyer.ref);
    }

    // 4. Delete the parent deal document itself
    batch.delete(dealRef);

    // 5. Commit all deletions atomically
    await batch.commit();
  }

  /** Generates an atomic sequential deal number like DEAL-2026-00042 */
  private async getNextSequentialNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counterRef = countersCollection.doc(`deals_${year}`);

    return await firestore.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      const currentVal = counterDoc.exists
        ? (counterDoc.data()?.currentVal ?? 0)
        : 0;
      const nextVal = currentVal + 1;

      transaction.set(counterRef, { currentVal: nextVal }, { merge: true });

      return `DEAL-${year}-${String(nextVal).padStart(5, '0')}`;
    });
  }

  /**
   * Helper to parse raw Firestore document data, converting Timestamps to Dates.
   */
  private parseDocument<T>(
    doc: FirebaseFirestore.DocumentSnapshot,
    parseSchema: z.ZodType<T>
  ): z.infer<z.ZodType<T>> | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    const parsed = parseSchema.parse(convertTimestamps(data));
    (parsed as any).id = doc.id;
    return parsed;
  }
}

export const dealStore = new DealStore();
