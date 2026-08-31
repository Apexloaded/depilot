import { firestore } from '../../config/firebase.config.js';
import { convertTimestamps } from '../../utils/index.js';
import { Collections } from '../collections.js';
import { plotStore } from '../plots/plot.store.js';
import { type CreateEstateInput, type UpdateEstateInput } from './estate.type.js';
import { estateSchema, type Estate } from './schemas/index.js';

const estatesCollection = firestore.collection(Collections.Estates);
class EstateStore {
  async create(input: CreateEstateInput): Promise<Estate> {
    const estateReference = estatesCollection.doc();
    const now = new Date();
    const estate = estateSchema.parse({
      ...input,
      id: estateReference.id,
      createdAt: now,
      updatedAt: now,
    });

    await estateReference.set(estate);
    return estate;
  }

  async getEstateByPlotId(plotId: string): Promise<Estate | null> {
    const plot = await plotStore.getPlot(plotId);
    if (!plot) {
      throw new Error(`Plot ${plotId} does not exist`);
    }

    if (!plot.estateId) {
      throw new Error(`Plot ${plotId} does not have an estateId`);
    }

    return this.get(plot.estateId);
  }

  async get(id: string): Promise<Estate | null> {
    const snapshot = await estatesCollection.doc(id).get();
    return this.parseDocument(snapshot);
  }

  async update(id: string, input: UpdateEstateInput): Promise<Estate> {
    const current = await this.get(id);

    if (!current) {
      throw new Error(`Estate ${id} does not exist`);
    }

    const updatedEstate = estateSchema.parse({
      ...current,
      ...input,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });

    await estatesCollection.doc(id).set(updatedEstate);
    return updatedEstate;
  }

  async delete(id: string): Promise<void> {
    await estatesCollection.doc(id).delete();
  }

  /**
   * Helper to parse raw Firestore document data, converting Timestamps to Dates.
   */
  private parseDocument(doc: FirebaseFirestore.DocumentSnapshot): Estate | null {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    return estateSchema.parse(convertTimestamps(data));
  }
}

export const estateStore = new EstateStore();
