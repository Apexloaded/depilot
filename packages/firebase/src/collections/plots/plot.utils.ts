import { toDate } from '../../utils';
import { Plot, plotSchema } from './schemas';

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
