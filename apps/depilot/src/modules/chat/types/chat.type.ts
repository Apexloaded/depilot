export type Chat = {
  userId?: string;
  sessionId?: string;
  message?: string;
};

export type ChatOptions = {
  stream?: boolean;
};

export type ChatStreamChunk = {
  sessionId: string;
  text: string;
  author?: string;
};