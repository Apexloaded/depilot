import { Context } from '@google/adk';
import { Content } from '@google/genai';
import { ContextKeys } from '../common/utils/context.utils.js';
import { WorkflowStatus, workflowStore } from '@repo/firebase';
import logger from '../../common/logger/index.js';

const VERDICT_PATTERN = /Executive Verdict:\**\s*(APPROVED|CAUTION_REQUIRED|FATAL_RISK|AWAITING_APPROVAL|AWAITING_INPUT)/i;
const TERMINAL_VERDICTS = new Set(['APPROVED', 'CAUTION_REQUIRED', 'FATAL_RISK']);


function extractFinalResponseText(context: Context): string {
    const invocationId = context.invocationContext?.invocationId;
    const events = context.invocationContext?.session?.events ?? [];

    let finalResponse = '';

    for (const event of events) {
        if (invocationId && event.invocationId !== invocationId) continue;

        const parts = event.content?.parts ?? [];
        const role = event.content?.role;

        for (const part of parts) {
            if (role === 'model' && 'text' in part && part.text) {
                finalResponse = part.text; // last model text wins, same as the Python version
            }
        }
    }

    return finalResponse;
}

export async function finalizeWorkflowStatus(
    context: Context,
): Promise<Content | undefined> {
    try {
        const workflowKeys = ContextKeys.Workflow;
        const workflowId = context.state.get(workflowKeys.Id) as string | undefined;
        if (!workflowId) return undefined;

        const currentStatus = context.state.get(workflowKeys.Status) as WorkflowStatus | undefined;
        if (
            currentStatus === WorkflowStatus.READY_FOR_APPROVAL ||
            currentStatus === WorkflowStatus.WAITING
        ) {
            return undefined;
        }

        const responseText = extractFinalResponseText(context);

        const match = responseText.match(VERDICT_PATTERN);
        if (!match) {
            logger.warn('[afterAgentCallback] no verdict found in final response', { workflowId });
            return undefined;
        }

        const verdict = match[1]!.toUpperCase();
        if (!TERMINAL_VERDICTS.has(verdict)) return undefined;

        const workflow = await workflowStore.findOne(workflowId);
        if (!workflow) return undefined;

        await workflowStore.updateWorkflow(workflowId, {
            status: WorkflowStatus.COMPLETED,
            completedAt: new Date(),
            version: workflow.version + 1,
            updatedAt: new Date(),
        });

        // Publish workflow event
        logger.info('[afterAgentCallback] workflow marked COMPLETED', { workflowId, verdict });

        return undefined; // None-equivalent — let the already-generated response through unchanged
    } catch (error) {
        logger.error('[afterAgentCallback] finalize failed', { error });
        return undefined; // fail-open here — bookkeeping failure must never block/replace a valid response
    }
}
