import 'dotenv/config';
import {
  Gemini,
  LOAD_MEMORY,
  LlmAgent,
  LlmSummarizer,
  Runner,
  TokenBasedContextCompactor,
} from '@google/adk';
import { sessionService, memoryService } from '../common/utils/index.js';
import { memoryPlugin } from '../common/plugins/memory-ingestion.plugin.js';
import { landGuardAgent } from './agents/index.js';
import { MASTER_ORCHESTRATOR_INSTRUCTION } from './prompts/base.prompt.js';
import { GEMINI_3_MODEL } from './models/gemini/index.js';

export class Agent {
  public name: string = 'master_orchestrator';

  private agent: Runner;

  orchestrator = new LlmAgent({
    name: this.name,
    model: GEMINI_3_MODEL._3_5_FLASH,
    instruction: MASTER_ORCHESTRATOR_INSTRUCTION,
    contextCompactors: [
      new TokenBasedContextCompactor({
        tokenThreshold: 1000,
        eventRetentionSize: 1,
        summarizer: new LlmSummarizer({
          llm: new Gemini({ model: GEMINI_3_MODEL._3_5_FLASH }),
        }),
      }),
    ],
    tools: [LOAD_MEMORY],
    subAgents: [landGuardAgent],
  });

  constructor() {
    this.agent = new Runner({
      appName: 'depilot',
      agent: this.orchestrator,
      sessionService,
      memoryService,
      plugins: [memoryPlugin],
    });
  }

  init(): Runner {
    return this.agent;
  }
}

const agent = new Agent();
const runner = agent.init();
const rootAgent = agent.orchestrator;

export { agent, runner, rootAgent };
