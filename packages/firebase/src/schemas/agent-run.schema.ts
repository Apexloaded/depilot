import { z } from 'zod';

export const agentRunSchema = z.object({
  id: z.string(),

  workflowId: z.string(),
  transactionId: z.string(),

  triggerEventId: z.string(),

  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'WAITING']),

  model: z.string(),

  reasoningSummary: z.string().optional(),

  plannedActions: z.array(z.string()).optional(),

  selectedAction: z.string().optional(),

  startedAt: z.date(),
  completedAt: z.date().optional(),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type AgentRun = z.infer<typeof agentRunSchema>;
