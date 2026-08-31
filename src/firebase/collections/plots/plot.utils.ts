import { toDate } from '../../utils/index.js';
import { Plot, plotSchema } from './schemas/index.js';

export function parsePlot(id: string, data: FirebaseFirestore.DocumentData) {
  const plot = data as Plot;
  return plotSchema.parse({
    id,
    ...data,
    allocation: {
      ...plot.allocation,
      allocationDate: toDate(plot.allocation.allocationDate),
    },
    verification: {
      ...plot.verification,
      lastCheckedAt: toDate(plot.verification.lastCheckedAt),
    },
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}
