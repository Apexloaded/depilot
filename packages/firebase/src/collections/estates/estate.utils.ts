import { toDate } from '../../utils';
import { estateSchema } from './schemas';

export function parseEstate(id: string, data: FirebaseFirestore.DocumentData) {
  return estateSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}
