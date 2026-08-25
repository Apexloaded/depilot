import { Express } from 'express';
import pubsubRouter from './pubsub/index.js';
import chatRouter from './chat/index.js';

export default (app: Express) => {
  pubsubRouter(app);
  chatRouter(app);
};
