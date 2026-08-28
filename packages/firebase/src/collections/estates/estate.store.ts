import { firestore } from '../../config/firebase.config';
import { Collections } from '../collections';
import { plotStore } from '../plots/plot.store';
import { type CreateEstateInput, type UpdateEstateInput } from './estate.type';
import { parseEstate } from './estate.utils';
import { estateSchema, type Estate } from './schemas';

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

    return this.read(plot.estateId);
  }

  async read(id: string): Promise<Estate | null> {
    const snapshot = await estatesCollection.doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return parseEstate(snapshot.id, snapshot.data() ?? {});
  }

  async update(id: string, input: UpdateEstateInput): Promise<Estate> {
    const current = await this.read(id);

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
}

export const estateStore = new EstateStore();
