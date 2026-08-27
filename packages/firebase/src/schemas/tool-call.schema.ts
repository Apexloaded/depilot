import { z } from 'zod';

export const toolCallSchema = z.object({
  id: z.string(),

  agentRunId: z.string(),

  workflowId: z.string(),

  toolName: z.enum([
    'get_transaction_context',
    'get_documents',
    'get_payment',
    'get_allocation',
    'validate_identity',
    'reconcile_payment',
    'check_property_consistency',
    'create_exception',
    'request_allocation_confirmation',
    'request_legal_review',
    'request_survey_verification',
    'generate_closing_package',
    'request_human_approval',
    'issue_allocation_instruction',
    'record_commission',
    'notify_buyer',
  ]),

  input: z.record(z.string(), z.unknown()),

  output: z.record(z.string(), z.unknown()).optional(),

  status: z.enum(['STARTED', 'SUCCEEDED', 'FAILED', 'RETRIED']),

  attempt: z.number().int().positive(),

  startedAt: z.date(),
  completedAt: z.date().optional(),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type ToolCall = z.infer<typeof toolCallSchema>;
