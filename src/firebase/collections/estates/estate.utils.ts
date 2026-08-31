import { toDate } from '../../utils/index.js';
import { estateSchema } from './schemas/index.js';

export function parseEstate(id: string, data: FirebaseFirestore.DocumentData) {
  return estateSchema.parse({
    id,
    ...data,
    verification: {
      ...data.verification,
      lastVerifiedAt: toDate(data.verification.lastVerifiedAt),
    },
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}
