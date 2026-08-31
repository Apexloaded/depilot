import { toDate } from '../../utils/index.js';
import { dealDocumentSchema } from './schemas/index.js';
import { dealBuyerSubcollectionSchema, dealItemSubcollectionSchema } from './collections/index.js';

export function parseDeal(id: string, data: FirebaseFirestore.DocumentData) {
  return dealDocumentSchema.parse({
    id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  });
}

export function parseDealBuyer(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  return dealBuyerSubcollectionSchema.parse({
    id,
    ...data,
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
