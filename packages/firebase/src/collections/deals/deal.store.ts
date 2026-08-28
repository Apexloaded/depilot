import { firestore } from '../../config/firebase.config';
import { Collections } from '../collections';
import { estateStore } from '../estates';
import { parsePlot } from '../plots/plot.utils';
import {
  type DealWithItems,
  type CreateDealInput,
  type UpdateDealInput,
} from './deal.type';
import { parseDealItem, parseDeal } from './deal.utils';
import {
  dealDocumentSchema,
  DealItemStatus,
  dealItemSubcollectionSchema,
  DealItemType,
} from './schemas';

const dealsCollection = firestore.collection(Collections.Deals);
const countersCollection = firestore.collection(Collections.Counters);
const plotsCollection = firestore.collection(Collections.Plots);

class DealStore {
  async create(input: CreateDealInput): Promise<DealWithItems> {
    return firestore.runTransaction(async (tx) => {
      const dealReference = dealsCollection.doc();
      const id = dealReference.id;
      const now = new Date();

      const dealNumber = await this.getNextSequentialNumber();
      const dealItems = input.items ?? [];
      const itemDataMap = new Map<
        number,
        { listPrice: number; agreedPrice: number }
      >();

      const dealItemsCollection = dealReference.collection(
        Collections.DealItems,
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
        const itemReference = dealItemsCollection.doc();
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
        0,
      );
      const totalAgreedPrice = Array.from(itemDataMap.values()).reduce(
        (sum, item) => sum + item.agreedPrice,
        0,
      );
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

      tx.set(dealReference, deal);

      for (const { item, reference } of itemsWithReferences) {
        tx.set(reference, item);
      }

      return { deal, items };
    });
  }

  async read(id: string): Promise<DealWithItems | null> {
    const dealSnapshot = await dealsCollection.doc(id).get();

    if (!dealSnapshot.exists) {
      return null;
    }

    const itemSnapshot = await dealsCollection
      .doc(id)
      .collection(Collections.DealItems)
      .get();

    return {
      deal: parseDeal(dealSnapshot.id, dealSnapshot.data() ?? {}),
      items: itemSnapshot.docs.map((item) =>
        parseDealItem(item.id, item.data()),
      ),
    };
  }

  async update(id: string, input: UpdateDealInput): Promise<DealWithItems> {
    const current = await this.read(id);

    if (!current) {
      throw new Error(`Deal ${id} does not exist`);
    }

    const batch = firestore.batch();
    const updatedAt = new Date();
    const updateData = { ...input };
    delete updateData.items;
    batch.update(dealsCollection.doc(id), {
      ...updateData,
      updatedAt,
    });

    let items = current.items;
    if (input.items) {
      const itemCollection = dealsCollection
        .doc(id)
        .collection(Collections.DealItems);
      for (const item of current.items) {
        batch.delete(itemCollection.doc(item.id));
      }

      items = input.items.map((item, index) =>
        dealItemSubcollectionSchema.parse({
          ...item,
          id: `${id}-item-${index + 1}`,
          dealId: id,
          createdAt: updatedAt,
        }),
      );
      for (const item of items) {
        batch.set(itemCollection.doc(item.id), item);
      }

      const totalListPrice = items.reduce(
        (total, item) => total + item.listPrice,
        0,
      );
      const agreedPrices = items
        .map((item) => item.agreedPrice)
        .filter(
          (price): price is number => price !== null && price !== undefined,
        );
      const totalAgreedPrice = agreedPrices.length
        ? agreedPrices.reduce((total, price) => total + price, 0)
        : null;
      batch.update(dealsCollection.doc(id), {
        totalListPrice,
        totalAgreedPrice,
        discountAmount:
          totalAgreedPrice === null
            ? 0
            : Math.max(totalListPrice - totalAgreedPrice, 0),
        itemCount: items.length,
      });
    }

    await batch.commit();
    const updated = await this.read(id);
    if (!updated) {
      throw new Error(`Deal ${id} could not be read after update`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const itemSnapshot = await dealsCollection
      .doc(id)
      .collection(Collections.DealItems)
      .get();
    const batch = firestore.batch();

    for (const item of itemSnapshot.docs) {
      batch.delete(item.ref);
    }

    batch.delete(dealsCollection.doc(id));
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
}

export const dealStore = new DealStore();
