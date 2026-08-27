import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string(),

  workflowId: z.string(),
  transactionId: z.string(),

  type: z.enum([
    'ALLOCATION_CONFIRMATION',
    'LEGAL_REVIEW',
    'SURVEY_VERIFICATION',
    'HUMAN_APPROVAL',
    'EXCEPTION_RESOLUTION',
  ]),

  title: z.string(),

  description: z.string(),

  assignedTo: z
    .object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
    })
    .optional(),

  status: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'WAITING',
    'COMPLETED',
    'CANCELLED',
  ]),

  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

  dueAt: z.date().optional(),

  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type Task = z.infer<typeof taskSchema>;
