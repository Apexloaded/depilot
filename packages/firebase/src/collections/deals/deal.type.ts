import { type DealDocument } from './schemas';
import { DealBuyerSubcollection, type DealItemSubcollection } from './collections';

export type DealInput = Omit<
  DealDocument,
  | 'id'
  | 'dealNumber'
  | 'totalListPrice'
  | 'totalAgreedPrice'
  | 'discountAmount'
  | 'itemCount'
  | 'createdAt'
  | 'updatedAt'
>;

export type DealItemInput = Omit<
  DealItemSubcollection,
  'id' | 'dealId' | 'listPrice' | 'status' | 'createdAt'
>;

export type CreateDealInput = {
  deal: DealInput;
  items?: DealItemInput[];
  buyers?: DealBuyerSubcollection[];
};

export type UpdateDealInput = Partial<DealInput> & {
  items?: DealItemSubcollection[];
  buyers?: DealBuyerSubcollection[];
};

export type DealWithItemsAndBuyers = {
  deal: DealDocument;
  items: DealItemSubcollection[];
  buyers: DealBuyerSubcollection[];
};

export type SearchDealInput = Partial<Pick<DealDocument, 'title' | 'dealNumber' | 'dealType'>> & {
  name?: string,
  phone?: string,
  email?: string
}