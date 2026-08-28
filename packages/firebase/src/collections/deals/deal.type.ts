import { type DealDocument, type DealItemSubcollection } from './schemas';

export type DealInput = Omit<
  DealDocument,
  | 'id'
  | 'totalListPrice'
  | 'totalAgreedPrice'
  | 'discountAmount'
  | 'itemCount'
  | 'createdAt'
  | 'updatedAt'
>;

export type DealItemInput = Omit<
  DealItemSubcollection,
  'id' | 'dealId' | 'createdAt'
>;

export type CreateDealInput = {
  deal: DealInput;
  items: DealItemInput[];
};

export type UpdateDealInput = Partial<DealInput> & {
  items?: DealItemInput[];
};

export type DealWithItems = {
  deal: DealDocument;
  items: DealItemSubcollection[];
};
