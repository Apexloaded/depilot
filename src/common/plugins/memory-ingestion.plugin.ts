import { BasePlugin, type BaseMemoryService, type Session } from '@google/adk';
import { memoryService } from '../utils/memory.utils.js';

export class MemoryIngestionPlugin extends BasePlugin {
  constructor(private readonly memoryService: BaseMemoryService) {
    super('memory_ingestion');
  }

  override async afterRunCallback({
    invocationContext,
  }: {
    invocationContext: { session: Session };
  }): Promise<void> {
    try {
      await this.memoryService.addSessionToMemory(invocationContext.session);
    } catch (error) {
      console.error('Failed to ingest session into memory', error);
    }
  }
}

export const memoryPlugin = new MemoryIngestionPlugin(memoryService);
