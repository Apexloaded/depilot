import { Context } from '@google/adk';
import { Content } from '@google/genai';
import logger from '../../common/logger/index.js';
import { extractDealNumberFromText } from '../common/utils/request-deal.utils.js';
import {
  WorkflowInput,
  WorkflowStatus,
  workflowStore,
  WorkflowType,
} from '../../firebase/index.js';
import { workflowClassifier } from '../common/libs/classifier.lib.js';
import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ContextKeys } from '../common/utils/context.utils.js';

/**
 * Extracts deal number from request and sets it in the agent's state
 * Deal Number looks like DEAL-2026-00042
 * @param context
 * @returns Promise<Content | undefined>
 */
export async function extractDealNumberFromRequest(
  context: Context
): Promise<Content | undefined> {
  try {
    logger.info(`[BeforeAgentCallback]: Extracting deal number from request`);

    let dealNumber = context.state.get(ContextKeys.Deal.Number);
    if (dealNumber) return undefined;

    const rawUserInput = context.state.get(ContextKeys.RawInput) as
      | string
      | undefined;
    if (!rawUserInput) {
      logger.info(
        `[BeforeAgentCallback]: No text content to extract a deal number from`
      );
      return undefined; // not an error — could be an image-only Land Guard submission
    }

    try {
      dealNumber = extractDealNumberFromText(rawUserInput);
      logger.info(
        `[BeforeAgentCallback]: Deal number extracted: ${dealNumber}`
      );
      if (!dealNumber) return undefined;
    } catch (error) {
      logger.error(
        `[BeforeAgentCallback]: Failed to extract deal number from message: ${rawUserInput}`
      );
      return undefined;
    }

    if (dealNumber) {
      logger.info(
        `[BeforeAgentCallback]: Deal number extracted successfully: ${dealNumber}`
      );
      context.state.set(ContextKeys.Deal.Number, dealNumber);
    } else {
      logger.info(`[BeforeAgentCallback]: No deal number present in message`);
    }

    return undefined;
  } catch (error: any) {
    logger.error(
      `[BeforeAgentCallback]: Unexpected error during deal extraction`,
      error
    );
    // Only return an error response for true runtime failures, not simple missing deal numbers
    return undefined;
  }
}

/**
 * Resolves or creates a workflow
 * @param params
 * @returns undefined
 */
export async function resolveOrCreateWorkflow(context: Context) {
  logger.info(`[BeforeAgentCallback]: Resolving or creating workflow`);

  const dealNumber = context.state.get(ContextKeys.Deal.Number) as
    | string
    | undefined;
  const rawInput =
    (context.state.get(ContextKeys.RawInput) as string | undefined) ?? '';
  const hasAttachment =
    (context.state.get(ContextKeys.HasAttachment) as boolean) ?? false;
  const correlationId = context.state.get(ContextKeys.CorrelationId) as
    | string
    | undefined;

  logger.info(
    `[BeforeAgentCallback]: Evaluation context - dealNumber: ${dealNumber || 'NONE'}, correlationId: ${correlationId}`
  );

  // 1. Check for existing workflow
  try {
    const existing = await workflowStore.getWorkflowByKey({
      dealNumber,
      correlationId,
      activeOnly: true,
    });

    if (existing) {
      logger.info(
        `[BeforeAgentCallback]: Existing workflow resolved [ID: ${existing.id}, Type: ${existing.type}]`
      );
      // A dealNumber just surfaced on a workflow that started life correlationId-only —
      // backfill so future async lookups (e.g. a webhook with only the dealNumber, no session) work.
      if (dealNumber && !existing.dealNumber) {
        await workflowStore.updateWorkflow(existing.id, {
          dealNumber,
          version: existing.version + 1,
          updatedAt: new Date(),
        });
      }
      context.state.set(ContextKeys.Workflow.Id, existing.id);
      context.state.set(ContextKeys.Workflow.Status, existing.status);
      context.state.set(ContextKeys.Workflow.Type, existing.type);
      return; // No reclassification on every turn of an ongoing workflow
    }
  } catch (error) {
    logger.error(
      `[BeforeAgentCallback]: Error occurred while trying to process your request`
    );
    const content: Content = {
      role: 'model',
      parts: [
        {
          text: 'Error occurred while trying to process your request',
        },
      ],
    };
    return content;
  }

  // 2. Classify request if no active workflow was found
  const prefiltered = workflowClassifier.classifyWithPrefilter({
    rawInput,
    hasDealNumber: !!dealNumber,
    hasAttachment,
  });
  const { type, confidence } =
    prefiltered !== WorkflowType.HYBRID_VERIFICATION_WORKFLOW
      ? { type: prefiltered, confidence: 1 } // zero LLM cost — deterministic and confident
      : await workflowClassifier.classifyWithLLM(rawInput); // LLM only for the genuinely mixed/unclear cases

  const workflow = {
    generatedWorkflowId: uuidv4(),
    dealNumber: dealNumber ?? '',
    correlationId,
    type,
    typeConfidence: confidence,
    status: WorkflowStatus.PENDING,
    currentStep: 'INTAKE',
    attemptCount: 0,
    version: 1,
    startedAt: new Date(),
  } satisfies WorkflowInput;

  await workflowStore.create(workflow); // Firestore write with idempotency key = key, to survive retries

  context.state.set(ContextKeys.Workflow.Id, workflow.generatedWorkflowId);
  context.state.set(ContextKeys.Workflow.Status, workflow.status);
  context.state.set(ContextKeys.Workflow.Type, workflow.type);

  logger.info(
    `[BeforeAgentCallback]: Created new ${type} workflow [ID: ${workflow.generatedWorkflowId}]`
  );

  return undefined;
}

/**
 * Primes the request context with raw user input and image attachment information
 * This is the FIRST callback the orchestrator calls to set Initial Values.
 * @param params
 * @returns Promise<Content | undefined>
 */
export async function primeRequestContext(
  context: Context
): Promise<Content | undefined> {
  logger.info(`[BeforeAgentCallback]: Priming request context`);
  const userContent = context.userContent;
  const parts = userContent?.parts ?? [];

  const rawUserInput = parts
    .filter((p): p is { text: string } => typeof (p as any).text === 'string')
    .map((p) => p.text)
    .join('\n');

  const inlineData = parts.filter((p) => p.inlineData);
  if (inlineData.length) {
    context.state.set(ContextKeys.HasAttachment, true);
  }

  context.state.set(ContextKeys.RawInput, rawUserInput);
  // Stable per-session correlationId so a multi-turn conversation without a dealNumber yet
  // (e.g. "here's a survey photo" before any deal exists) resolves to ONE workflow across
  // turns, not a new one every message.
  if (!context.state.get(ContextKeys.CorrelationId)) {
    context.state.set(
      ContextKeys.CorrelationId,
      context.sessionId ?? randomUUID()
    );
  }

  return undefined;
}
