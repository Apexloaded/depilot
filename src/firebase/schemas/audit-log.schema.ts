import { z } from 'zod';

export const auditLogSchema = z.object({
  id: z.string(),

  workflowId: z.string().optional(),
  transactionId: z.string().optional(),

  actor: z.object({
    type: z.enum(['USER', 'AGENT', 'SYSTEM', 'WORKER', 'EXTERNAL']),
    id: z.string().optional(),
    name: z.string().optional(),
  }),

  action: z.string(),

  resourceType: z.string(),
  resourceId: z.string(),

  metadata: z.record(z.string(), z.unknown()).optional(),

  createdAt: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
