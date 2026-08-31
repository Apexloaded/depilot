import { BaseTool, Context } from '@google/adk';
import logger from '../../common/logger/index.js';
import { ContextKeys } from '../common/utils/context.utils.js';
import { Workflow, WorkflowStatus, workflowStore } from '../../firebase/index.js';

export async function beforeToolCallbackCheckWorkflowStatus(params: {
  tool: BaseTool;
  args: Record<string, unknown>;
  context: Context;
}) {
  logger.info('[BeforeToolCallback] - Check workflow status');
  const { tool, context } = params;

  try {
    const sessionWorkflowId = context.state.get(ContextKeys.Workflow.Id) as
      | string
      | undefined;

    if (!sessionWorkflowId) {
      logger.warn(
        '[beforeToolCallback] trying to access a tool without a workflow',
        { tool: tool.name }
      );
      return {
        error: true,
        reason: 'NO WORKFLOW CONTEXT ID',
        message: 'Workflow context cannot be fetched without a workflow id',
      };
    }

    const workflow = await workflowStore.findOne(sessionWorkflowId);
    if (!workflow)
      return {
        error: true,
        reason: 'NO WORKFLOW CONTEXT',
        message: 'Cannot execute an operation without a workflow',
      };

    const shouldHalt = determineHaltAction(tool.name, workflow);
    if (shouldHalt) {
      logger.info(
        `[BeforeToolCallback]: Halting ${tool.name} for ${workflow.id}: ${shouldHalt.error}`
      );
      return {
        error: true,
        reason: 'NO WORKFLOW CONTEXT',
        message: 'Cannot execute an operation without a workflow',
      };
    }

    // Retry control
    if (workflow.attemptCount >= workflow.maxAttempts) {
      await workflowStore.updateWorkflow(workflow.id, {
        status: WorkflowStatus.DEAD_LETTERED,
        updatedAt: new Date(),
      });
      return {
        error: true,
        reason: 'WORKFLOW_DEAD_LETTERED',
        message: `Maximum retry attemps (${workflow.maxAttempts}) exceeded.`,
      };
    }

    return undefined;
  } catch (error) {
    logger.error('[beforeToolCallback] check failed', {
      error,
      tool: tool.name,
    });
    // Fail closed — an error here must never silently permit a write.
    return {
      error: true,
      reason: 'CALLBACK_ERROR',
      message: 'Workflow guard failed; blocking as a precaution.',
    };
  }
}

function determineHaltAction(toolName: string, workflow: Workflow) {
  switch (workflow.status) {
    case WorkflowStatus.WAITING:
      return {
        error: true,
        reason: 'AWAITING RESPONSE',
        message: `Workflow ${workflow.id} is currently WAITING for action: ${workflow.waitingFor?.eventType}`,
      };

    case WorkflowStatus.READY_FOR_APPROVAL:
      return {
        error: true,
        reason: 'HITL REQUIRED',
        message: `Workflow ${workflow.id} is currently WAITING for action from a human: ${workflow.waitingFor?.eventType}`,
      };

    case WorkflowStatus.PAUSED || WorkflowStatus.FAILED:
      return {
        error: true,
        reason: 'WORKFLOW HALTED',
        message: `Workflow ${workflow.id} is in status ${workflow.status}. Manual reset required.`,
      };

    case WorkflowStatus.COMPLETED:
      return {
        error: true,
        reason: 'WORKFLOW COMPLETED',
        message: `Workflow ${workflow.id} already completed.`,
      };

    default:
      return undefined;
  }
}
