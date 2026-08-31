export type ChatAttachment = {
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
};

export type Chat = {
  userId?: string;
  sessionId?: string;
  message?: string;
  attachments?: ChatAttachment[];
};

export type ChatOptions = {
  stream?: boolean;
};

export type ChatStreamChunk = {
  sessionId: string;
  text: string;
  author?: string;
};