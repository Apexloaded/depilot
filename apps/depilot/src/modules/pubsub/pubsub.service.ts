import { PubSub } from '@google-cloud/pubsub';
import logger from '../../common/logger/index.js';

export class PubsubService {
  private pubSub = new PubSub();

  async handleSubscription(body: any) { }

  async publish<Input>(topicOrNameId: string, payload: Input) {
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(JSON.stringify(payload));

    // Cache topic objects (publishers) and reuse them.
    const topic = this.pubSub.topic(topicOrNameId);

    try {
      const messageId = await topic.publishMessage({ data: dataBuffer });
      logger.info(`[PubsubService] Message ${messageId} published.`);
      return messageId;
    } catch (error) {
      logger.error(
        `[PubsubService] Received error while publishing: ${(error as Error).message}`,
      );
      process.exitCode = 1;
    }
  }
}

export const pubsubService = new PubsubService();