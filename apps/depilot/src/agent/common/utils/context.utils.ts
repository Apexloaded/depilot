export const ContextKeys = {
  SessionId: 'sessionId',
  CorrelationId: 'correlationId',
  RawInput: 'rawUserInput',
  Deal: {
    Id: 'dealId',
    Number: 'dealNumber',
  },
  HasAttachment: {
    Image: 'hasImageAttachment',
  },
  Workflow: {
    Id: 'workflowId',
    Status: 'workflowStatus',
    Type: 'workflowType',
  },
} as const;

export type ContextKey = (typeof ContextKeys)[keyof typeof ContextKeys];
