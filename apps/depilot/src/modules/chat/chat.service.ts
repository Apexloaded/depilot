import { ChatOptions, Chat, ChatStreamChunk } from './types/chat.type.js';
import { sessionService } from '../../common/utils/index.js';
import { agent, runner } from '../../ai/orchestrator.ai.js';
import type { Content, Part } from '@google/genai';

export class ChatService {
  // Overload 1: Stream mode returns an AsyncGenerator of chunks
  async handleChat(
    chat: Chat,
    options: { stream: true },
  ): Promise<AsyncGenerator<ChatStreamChunk, void, unknown>>;

  // Overload 2: Non-stream mode returns complete response
  async handleChat(
    chat: Chat,
    options?: { stream?: false },
  ): Promise<{ sessionId: string; response: string }>;

  async handleChat(chat: Chat, options?: ChatOptions) {
    const { sessionId, userId, message } = chat;

    if (
      typeof userId !== 'string' ||
      typeof message !== 'string' ||
      !userId.trim() ||
      !message.trim()
    ) {
      throw new Error('userId and message are required strings');
    }

    const activeSessionId =
      typeof sessionId === 'string' && sessionId.trim()
        ? sessionId
        : crypto.randomUUID();

    await sessionService.getOrCreateSession({
      appName: runner.appName,
      userId,
      sessionId: activeSessionId,
    });

    const newMessage: Content = {
      role: 'user',
      parts: [{ text: message }],
    };

    const runInput = {
      userId,
      sessionId: activeSessionId,
      newMessage,
    };

    // --- STREAMING BRANCH ---
    if (options?.stream) {
      const self = this;
      async function* generateStream(): AsyncGenerator<
        ChatStreamChunk,
        void,
        unknown
      > {
        for await (const event of runner.runAsync(runInput)) {
          const text = self.textFromParts(event.content?.parts);
          if (text) {
            yield {
              sessionId: activeSessionId,
              text,
              author: event.author,
            };
          }
        }
      }
      return generateStream();
    }

    // --- NON-STREAMING BRANCH ---
    let finalResponse = '';

    for await (const event of runner.runAsync(runInput)) {
      const text = this.textFromParts(event.content?.parts);
      if (text) {
        finalResponse = text;
      }
    }

    return {
      sessionId: activeSessionId,
      response: finalResponse,
    };
  }

  private textFromParts(parts?: Part[]) {
    return (parts ?? [])
      .flatMap((p) => ('text' in p && p.text ? [p.text] : []))
      .join('')
      .trim();
  }
}

export const chatService = new ChatService();
