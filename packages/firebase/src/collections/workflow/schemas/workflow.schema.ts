import { z } from 'zod';

export enum Agents {
  DEAL_PILOT = 'deal_pilot_agent',
  MASTER_ORCHESTRATOR = 'master_orchestrator',
  LAND_GUARD = 'land_guard_agent',
}

export enum WorkflowType {
  DEAL_WORKFLOW = 'DEAL_WORKFLOW',
  DUE_DILIGENCE_WORKFLOW = 'DUE_DILIGENCE_WORKFLOW',
  HYBRID_VERIFICATION_WORKFLOW = 'HYBRID_VERIFICATION_WORKFLOW',
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  PAUSED = 'PAUSED',
  READY_FOR_APPROVAL = 'READY_FOR_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DEAD_LETTERED = 'DEAD_LETTERED',
}

export const waitingForSchema = z.object({
  eventType: z.enum([
    'HITL_DEAL_APPROVAL',
    'HITL_SURVEY_RECONSTRUCTION_APPROVAL',
    'PAYMENT_RECEIPT_VERIFICATION',
    'ADDITIONAL_COORDINATES_REQUIRED',
  ]),
  requiredRole: z.enum(['ADMIN', 'SURVEYOR', 'FINANCE_AUDITOR']),
  correlationId: z.string().optional(),
  deadline: z.coerce.date().optional(),
  payloadSummary: z.record(z.string(), z.any()).optional(),
});

export const workflowSchema = z.object({
  id: z.string(),
  dealNumber: z.string().nullable().optional(),
  correlationId: z.string().optional(),
  parcelId: z.string().nullable().optional(),
  type: z.enum(WorkflowType),
  typeConfidence: z.number().min(0).max(1).optional(),
  status: z.enum(WorkflowStatus),
  currentStep: z.string(),
  assignedSubAgent: z.enum(Agents).optional(),
  waitingFor: waitingForSchema.optional(),
  attemptCount: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3),
  version: z.number().int().positive(),
  metadata: z.record(z.string(), z.any()).default({}),
  startedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  lastError: z
    .object({
      code: z.string(),
      message: z.string(),
      step: z.string(),
      occurredAt: z.coerce.date(),
      stack: z.string().optional(),
    })
    .optional(),
});

export type Workflow = z.infer<typeof workflowSchema>;
