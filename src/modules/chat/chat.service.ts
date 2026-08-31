import {
  ChatOptions,
  Chat,
  ChatAttachment,
  ChatStreamChunk,
} from './types/chat.type.js';
import { sessionService } from '../../common/utils/index.js';
import { agent, runner } from '../../agent/orchestrator.agent.js';
import type { Content, Part } from '@google/genai';
import logger from '../../common/logger/index.js';

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
    const { sessionId, userId, message, attachments = [] } = chat;

    if (
      typeof userId !== 'string' ||
      !userId.trim() ||
      (!attachments.length &&
        (typeof message !== 'string' || !message.trim())) ||
      attachments.some((attachment) => !Buffer.isBuffer(attachment.buffer))
    ) {
      throw new Error('userId and either message or attachments are required');
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
      parts: this.buildContentParts(message, attachments),
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

    logger.info(
      '[Taskmaster System] Starting autonomous tool-calling execution loop...',
    );
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

  private buildContentParts(
    message: string | undefined,
    attachments: ChatAttachment[],
  ): Part[] {
    const parts: Part[] = [];

    if (typeof message === 'string' && message.trim()) {
      parts.push({ text: message });
    }

    for (const attachment of attachments) {
      parts.push({
        inlineData: {
          data: attachment.buffer.toString('base64'),
          mimeType: attachment.mimeType,
        },
      });
    }

    return parts;
  }

  private textFromParts(parts?: Part[]) {
    return (parts ?? [])
      .flatMap((p) =>
        'text' in p && p.text && !p.thought ? [p.text] : [],
      )
      .join('')
      .trim();
  }
}

export const chatService = new ChatService();
