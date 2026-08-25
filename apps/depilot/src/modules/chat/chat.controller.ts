import type { Express, NextFunction, Request, Response } from 'express';
import { Chat } from './types/chat.type.js';
import { chatService, ChatService } from './chat.service.js';
import logger from '../../common/logger/index.js';

class ChatController {
  constructor(private chatService: ChatService) {}

  async chat(
    req: Request<unknown, unknown, Chat>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.chatService.handleChat(req.body, {
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
    try {
      const stream = await this.chatService.handleChat(req.body, {
        stream: true,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error('Streaming request failed', error);
      next(error);
    }
  }
}

const controller = new ChatController(chatService);

export default (app: Express) => {
  app.post('/chat', controller.chat.bind(controller));
  app.post('/stream', controller.stream.bind(controller));
};
