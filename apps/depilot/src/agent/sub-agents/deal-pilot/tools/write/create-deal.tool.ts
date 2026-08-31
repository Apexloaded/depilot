import { z } from 'zod';
import { Context, FunctionTool } from '@google/adk';
import { dealStore } from '@repo/firebase';
import { MUTATING_TOOLS_NAMES } from '../../constant.js';

export const createDealTool = new FunctionTool({
  name: MUTATING_TOOLS_NAMES.CREATE_NEW_DEAL,
  description: 'Create a new deal record.',
  parameters: z.object({

  }),
  execute: async (args, context?: Context) => {
    return args
  },
});