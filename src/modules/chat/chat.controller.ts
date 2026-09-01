import type { Express, NextFunction, Request, Response } from 'express';
import { Chat, ChatAttachment } from './types/chat.type.js';
import { chatService, ChatService } from './chat.service.js';
import logger from '../../common/logger/index.js';
import { multipart } from '../../common/middlewares/index.js';

function chatFromRequest(req: Request<unknown, unknown, Chat>): Chat {
  const files = Array.isArray(req.files) ? req.files : [];
  const attachments: ChatAttachment[] = files.map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
    size: file.size,
  }));

  return {
    userId: req.body.userId,
    sessionId: req.body.sessionId,
    message: req.body.message,
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

class ChatController {
  constructor(private chatService: ChatService) {}

  async chat(
    req: Request<unknown, unknown, Chat>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.chatService.handleChat(chatFromRequest(req), {
        stream: false,
      });

      res.json(result);
    } catch (error) {
      logger.error('Chat request failed', error);
      next(error);
    }
  }

  async stream(
    req: Request<unknown, unknown, Chat>,
    res: Response,
    next: NextFunction,
  ) {
    let streamStarted = false;

      try {
        const stream = await this.chatService.handleChat(chatFromRequest(req), {
          stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // stop reverse-proxy buffering
        res.flushHeaders();
        streamStarted = true;

        // If the client disconnects, stop pulling from the generator
        const onClose = () => {
          stream.return?.(undefined);
        };
        req.on('close', onClose);

        try {
          for await (const chunk of stream) {
            if (res.writableEnded) break;
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          if (!res.writableEnded) {
            res.write('data: [DONE]\n\n');
          }
        } catch (streamError) {
          logger.error('Streaming request failed mid-stream', streamError);
          if (!res.writableEnded) {
            // Can't call next(error) — headers are already sent.
            // Emit an SSE-native error event instead.
            res.write(
              `data: ${JSON.stringify({ error: 'Stream failed', message: (streamError as Error).message })}\n\n`,
            );
          }
        } finally {
          req.off('close', onClose);
          if (!res.writableEnded) res.end();
        }
      } catch (error) {
        logger.error('Streaming request failed', error);
        if (streamStarted) {
          // Headers already sent — end the connection, don't call next()
          if (!res.writableEnded) res.end();
        } else {
          next(error);
        }
      }
  }
}

const controller = new ChatController(chatService);

export default (app: Express) => {
  app.post('/chat', multipart, controller.chat.bind(controller));
  app.post('/stream', multipart, controller.stream.bind(controller));
};
