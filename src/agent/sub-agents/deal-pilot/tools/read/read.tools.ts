import { z } from 'zod';
import { FunctionTool } from '@google/adk';
import { dealStore, dealTypeEnum, dealHistoryStore } from '../../../../../firebase/index.js';
import { READ_TOOLS_NAMES } from '../../constant.js';

export const getDealTool = new FunctionTool({
  name: READ_TOOLS_NAMES.GET_DEAL,
  description:
    'Fetch a deal record by its exact dealNumber. Returns NOT_FOUND if it does not exist.',
  parameters: z.object({
    dealNumber: z.string(),
  }),
  execute: async (args) => {
    const { dealNumber } = args;
    const deal = await dealStore.fetchDeal(dealNumber);
    if (!deal) return { error: 'NOT_FOUND', dealNumber };
    return deal;
  },
});

export const searchDealTool = new FunctionTool({
  name: READ_TOOLS_NAMES.SEARCH_DEAL,
  description:
    'Fetch a deal record by its exact dealNumber. Returns NOT_FOUND if it does not exist.',
  parameters: z.object({
    title: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    dealNumber: z.string().optional(),
    dealType: dealTypeEnum.optional(),
  }),
  execute: async (args) => {
    const { title, name, email, phone, dealNumber, dealType } = args;
    if (!title && !name && !email && !phone && !dealNumber && !dealType)
      return { error: 'NOT_FOUND', args };

    const deal = await dealStore.searchDeals({
      title,
      name,
      email,
      phone,
      dealNumber,
      dealType,
    });
    if (!deal) return { error: 'NOT_FOUND', args };
    return deal;
  },
});

export const getDealHistoryTool = new FunctionTool({
  name: READ_TOOLS_NAMES.GET_DEAL_HISTORY,
  description:
    'Get the audit trail of past actions (creation, stage transitions, payments applied) for a deal.',
  parameters: z.object({
    dealNumber: z.string(),
  }),
  execute: async ({ dealNumber }) => {
    const history = await dealHistoryStore.getDealHistory(dealNumber);
    return { dealNumber, entries: history };
  },
});


