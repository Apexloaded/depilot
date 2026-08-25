import 'dotenv/config';
import { LOAD_MEMORY, LlmAgent, Runner } from '@google/adk';
import { sessionService, memoryService } from '../common/utils/index.js';
import { memoryPlugin } from '../common/plugins/memory-ingestion.plugin.js';

export class Agent {
  public name: string = 'master_orchestrator';

  private agent: Runner;

  private orchestrator = new LlmAgent({
    name: this.name,
    model: 'gemini-2.5-flash',
    instruction: `
    Route payment/invoice issues to billing_agent and tech bugs to tech_support_agent.
    Use the load_memory tool when the answer may depend on previous conversations.
  `,
    tools: [LOAD_MEMORY],
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

export { agent, runner };
