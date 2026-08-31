import { Express, NextFunction, Request, Response } from 'express';
import { PubsubService } from './pubsub.service.js';
import logger from '../../common/logger/index.js';

class PubsubController {
  constructor(private readonly pubsubService: PubsubService) {}

  async handleSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      await this.pubsubService.handleSubscription(req.body);
      res.sendStatus(204);
    } catch (error: any) {
      logger.error('[Orchestrator Error]:', error.message);
      return res.status(500).send({ error: error.message });
    }
  }
}

const controller = new PubsubController(new PubsubService());
export default (app: Express) => {
  app.post('pubsub', controller.handleSubscription.bind(this));
};
