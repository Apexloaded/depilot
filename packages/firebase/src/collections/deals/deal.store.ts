import { firestore } from '../../config/firebase.config';
import {
  type DealWithItems,
  type CreateDealInput,
  type UpdateDealInput,
} from './deal.type';
import { parseDealItem, parseDeal } from './deal.utils';
import { dealDocumentSchema, dealItemSubcollectionSchema } from './schemas';

const dealsCollection = firestore.collection('deals');

class DealStore {
  async create(input: CreateDealInput): Promise<DealWithItems> {
    const dealReference = dealsCollection.doc();
    const id = dealReference.id;
    const now = new Date();

    const itemsWithReferences = input.items.map((item) => {
      const itemReference = dealReference.collection('items').doc();
      const parsedItem = dealItemSubcollectionSchema.parse({
        ...item,
        id: itemReference.id,
        dealId: id,
        createdAt: now,
      });

      return { item: parsedItem, reference: itemReference };
    });

    const items = itemsWithReferences.map(({ item }) => item);
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

    const deal = dealDocumentSchema.parse({
      ...input.deal,
      id,
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

    const batch = firestore.batch();
    batch.set(dealReference, deal);

    for (const { item, reference } of itemsWithReferences) {
      batch.set(reference, item);
    }

    await batch.commit();
    return { deal, items };
  }

  async read(id: string): Promise<DealWithItems | null> {
    const dealSnapshot = await dealsCollection.doc(id).get();

    if (!dealSnapshot.exists) {
      return null;
    }

    const itemSnapshot = await dealsCollection
      .doc(id)
      .collection('items')
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
      const itemCollection = dealsCollection.doc(id).collection('items');
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
      .collection('items')
      .get();
    const batch = firestore.batch();

    for (const item of itemSnapshot.docs) {
      batch.delete(item.ref);
    }

    batch.delete(dealsCollection.doc(id));
    await batch.commit();
  }
}

export const dealStore = new DealStore();
