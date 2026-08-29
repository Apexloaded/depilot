import { serializeFirebaseData, toDate } from '../../utils';
import { workflowSchema, type Workflow } from './schemas';

export function parseWorkflow(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Workflow {
  const record = serializeFirebaseData(data);
  const waitingFor = record.waitingFor ? record.waitingFor : undefined;
  const lastError = record.lastError ? record.lastError : undefined;

  return workflowSchema.parse({
    id,
    ...record,
    ...(waitingFor && {
      waitingFor: {
        ...waitingFor,
        deadline: toDate(waitingFor.deadline),
      },
    }),
    ...(lastError && {
      lastError: {
        ...lastError,
        occurredAt: toDate(lastError.occurredAt),
      },
    }),
    startedAt: toDate(record.startedAt),
    updatedAt: toDate(record.updatedAt),
    completedAt: toDate(record.completedAt),
  } satisfies Workflow);
}
