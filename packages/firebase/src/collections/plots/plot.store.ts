import { firestore } from '../../config/firebase.config';
import { Collections } from '../collections';
import { parsePlot } from './plot.utils';

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