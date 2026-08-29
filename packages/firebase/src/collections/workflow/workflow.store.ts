import { firestore } from '../../config';
import { Collections } from '../collections';
import { parseWorkflow } from './workflow.utils';
import { workflowSchema, type Workflow } from './schemas';
import { WorkflowInput, WorkflowUpdateInput } from './workflow.type';
import { ACTIVE_WORKFLOW_STATUSES } from './workflow.constant';

class WorkflowStore {
  private workflowCollection = firestore.collection(Collections.Workflows);

  async create(input: WorkflowInput): Promise<Workflow> {
    return firestore.runTransaction(async (tx) => {
      if (input.dealNumber) {
        const activeQuery = firestore
          .collection('workflows')
          .where('dealNumber', '==', input.dealNumber)
          .where('status', 'in', Array.from(ACTIVE_WORKFLOW_STATUSES));

        const snapshot = await tx.get(activeQuery);

        if (!snapshot.empty) {
          // Someone else's request won the race — return their workflow instead of
          // creating a second one. This is the actual fix; the read-time ordering
          // above was only ever a fallback for records that predate this guard.
          const existing = snapshot.docs[0]!.data() as Workflow;
          console.info(
            '[createWorkflow] active workflow already exists, joining it',
            {
              dealNumber: input.dealNumber,
              existingId: existing.id,
            },
          );
          return existing;
        }
      }

      const workflowReference = input.generatedWorkflowId
        ? this.workflowCollection.doc(input.generatedWorkflowId)
        : this.workflowCollection.doc();

      const now = new Date();
      const workflow = workflowSchema.parse({
        ...input,
        id: workflowReference.id,
        updatedAt: now,
      });

      tx.set(workflowReference, workflow);
      return workflow;
    });
  }

  async findOne(workflowId: string): Promise<Workflow | undefined> {
    const snapshot = await this.workflowCollection.doc(workflowId).get();
    if (!snapshot.exists) return undefined;

    const data = snapshot.data();
    if (!data) return undefined;

    return parseWorkflow(workflowId, data);
  }

  async findWorkflowByField(field: keyof Workflow, value: any) {
    const snapshot = await this.workflowCollection
      .where(field, '==', value)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;

    const data = snapshot.docs[0]!.data();
    const workflowId = snapshot.docs[0]!.id;
    return parseWorkflow(workflowId, data);
  }

  /**
   * Get workflow by key (dealNumber or correlationId)
   * @param key
   * @returns Promise<Workflow | undefined>
   */
  async getWorkflowByKey(params: {
    dealNumber?: string;
    correlationId?: string;
    activeOnly?: boolean;
  }): Promise<Workflow | undefined> {
    const { dealNumber, correlationId, activeOnly = true } = params;

    const statuses = activeOnly
      ? Array.from(ACTIVE_WORKFLOW_STATUSES)
      : undefined;

    // 1. Priority Lookup: Deal Number (Global Domain Entity)
    // If a deal number exists, it is the primary source of truth across all user sessions.
    if (dealNumber) {
      try {
        let query = this.workflowCollection.where('dealNumber', '==', dealNumber);

        if (statuses && statuses.length > 0) {
          query = query.where('status', 'in', statuses);
        }

        const snapshot = await query.orderBy('updatedAt', 'desc').get();

        if (!snapshot.empty) {
          if (snapshot.docs.length > 1) {
            console.error(
              '[getWorkflowByKey] Multiple ACTIVE workflows found for dealNumber — data integrity warning',
              { dealNumber, workflowIds: snapshot.docs.map((w) => w.id) },
            );
          }

          const doc = snapshot.docs[0]!;
          return parseWorkflow(doc.id, doc.data());
        }
      } catch (error: any) {
        console.error('[getWorkflowByKey] Failed to query by dealNumber', {
          dealNumber,
          error: error?.message || error,
        });
      }
    }

    // 2. Fallback Lookup: Session Correlation ID
    // Used when a session is active but no dealNumber has been extracted yet.
    if (correlationId) {
      try {
        let query = this.workflowCollection.where('correlationId', '==', correlationId);

        if (statuses && statuses.length > 0) {
          query = query.where('status', 'in', statuses);
        }

        const snapshot = await query.orderBy('updatedAt', 'desc').limit(1).get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]!;
          return parseWorkflow(doc.id, doc.data());
        }
      } catch (error: any) {
        console.error('[getWorkflowByKey] Failed to query by correlationId', {
          correlationId,
          error: error?.message || error,
        });
      }
    }

    return undefined;
  }

  async updateWorkflow(id: string, input: WorkflowUpdateInput) {
    const current = await this.findOne(id);

    if (!current) {
      throw new Error(`User ${id} does not exist`);
    }

    const updatedWorkflow = parseWorkflow(id, {
      ...current,
      ...input,
      id,
      startedAt: current.startedAt,
      updatedAt: new Date(),
    });

    await this.workflowCollection.doc(id).set(updatedWorkflow);
    return updatedWorkflow;
  }
}

export const workflowStore = new WorkflowStore();
