import { toDate } from '../../utils';
import { dealDocumentSchema, dealItemSubcollectionSchema } from './schemas';

export function parseDeal(id: string, data: FirebaseFirestore.DocumentData) {
  return dealDocumentSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}

export function parseDealItem(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  return dealItemSubcollectionSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
  });
}
