export const ContextKeys = {
  SessionId: 'sessionId',
  CorrelationId: 'correlationId',
  RawInput: 'rawUserInput',
  Deal: {
    Id: 'dealId',
    Number: 'dealNumber',
  },
  Attachments: 'attachements',
  HasAttachment: 'hasAttachments',
  Workflow: {
    Id: 'workflowId',
    Status: 'workflowStatus',
    Type: 'workflowType',
  },
  Payment: {
    ExtractedReceipt: 'extractedReceipt',
  }
} as const;

export type ContextKey = (typeof ContextKeys)[keyof typeof ContextKeys];
