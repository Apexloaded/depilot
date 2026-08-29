import { Context, FunctionTool } from '@google/adk';
import logger from '../../common/logger/index.js';
import { z } from 'zod';
import { workflowStore } from '@repo/firebase';

const toolSchema = z.object({
  workflowId: z.string().describe('The id of the workflow to be processed'),
  dealNumber: z.string().describe('Deal number to the processed'),
});
type ToolArgs = z.infer<typeof toolSchema>;

export const checkWorkflowTool = new FunctionTool({
  name: 'check_workflow_tool',
  description:
    'Check a workflow status or initialize a new one if needed. This is the FIRST tool that should ALWAYS be called by the orchestrator. Ignore all other tools.',
  parameters: toolSchema,
  execute: async (args: ToolArgs, context?: Context) => {
    try {
      logger.info('[CheckWorkflowTool] Checking workflow...');

      const workflowId = args.workflowId;
      const dealNumber = args.dealNumber;

      const workflow = await workflowStore.findOne(workflowId);
      if (!workflow) {
        logger.error('[CheckWorkflowTool] Workflow not found');
        return {
          status: 'error',
          message: 'Workflow not found',
        };
      }

      const result = {
        status: 'error',
        message: 'No workflowId found. Please provide a workflow ID.',
      };

      logger.info('[CheckWorkflowTool] Completed', { result });
      return result;
    } catch (error) {
      logger.error('[CheckWorkflowTool] Failed', { error });
      throw error;
    }
  },
});
