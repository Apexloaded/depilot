import { Workflow } from './schemas/index.js';

export type WorkflowInput = Omit<
  Workflow,
  'id' | 'metadata' | 'maxAttempts' | 'updatedAt'
> & {
  generatedWorkflowId?: string;
};

export type WorkflowUpdateInput = Partial<Omit<Workflow, 'id' | 'createdAt'>>;
