import { toDate } from '../../utils';
import { dealDocumentSchema } from './schemas';
import { dealBuyerSubcollectionSchema, dealItemSubcollectionSchema } from './collections';

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
