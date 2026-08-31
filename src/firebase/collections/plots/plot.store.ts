import { firestore } from '../../config/firebase.config.js';
import { Collections } from '../collections.js';
import { parsePlot } from './plot.utils.js';

export const plotCollection = firestore.collection(Collections.Plots);
export class PlotStore {
  async getPlot(plotId: string) {
    const snapshot = await plotCollection.doc(plotId).get();

    if (!snapshot.exists) {
      return null;
    }

    return parsePlot(snapshot.id, snapshot.data() ?? {});
  }
}

export const plotStore = new PlotStore();