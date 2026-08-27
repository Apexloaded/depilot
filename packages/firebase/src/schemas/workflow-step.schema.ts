import { z } from 'zod';

export const workflowStepSchema = z.object({
  id: z.string(),

  workflowId: z.string(),

  name: z.enum([
    'VALIDATE_IDENTITY',
    'VALIDATE_PAYMENT',
    'VERIFY_PROPERTY',
    'RESOLVE_EXCEPTION',
    'ALLOCATION_CONFIRMATION',
    'LEGAL_REVIEW',
    'SURVEY_VERIFICATION',
    'CLOSING_PACKAGE',
    'HUMAN_APPROVAL',
    'FINALIZE_CLOSING',
  ]),

  status: z.enum([
    'PENDING',
    'RUNNING',
    'WAITING',
    'COMPLETED',
    'FAILED',
    'SKIPPED',
  ]),

  sequence: z.number().int().nonnegative(),

  input: z.record(z.string(), z.unknown()).optional(),
  output: z.record(z.string(), z.unknown()).optional(),

  attemptCount: z.number().int().nonnegative(),

  startedAt: z.date().optional(),
  completedAt: z.date().optional(),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;
