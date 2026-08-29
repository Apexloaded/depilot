import { WorkflowStatus } from "./schemas";

/**
 * Active workflow statuses
 * These are the statuses that are considered active and require attention
 */
export const ACTIVE_WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  WorkflowStatus.PENDING,
  WorkflowStatus.RUNNING,
  WorkflowStatus.WAITING,
  WorkflowStatus.PAUSED,
  WorkflowStatus.READY_FOR_APPROVAL,
]);

/**
 * Terminal workflow statuses
 * These are the statuses that are considered terminal and do not require any further attention
 */
export const TERMINAL_WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  WorkflowStatus.DEAD_LETTERED,
  WorkflowStatus.COMPLETED,
  WorkflowStatus.FAILED
]);