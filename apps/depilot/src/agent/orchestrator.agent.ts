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
import { landGuardAgent } from './sub-agents/index.js';
import { MASTER_ORCHESTRATOR_INSTRUCTION } from './prompts/base.prompt.js';
import { GEMINI_3_MODEL } from './models/gemini/index.js';
import {
  extractDealNumberFromRequest,
  primeRequestContext,
  resolveOrCreateWorkflow,
} from './callbacks/index.js';
import { checkWorkflowTool } from './tools/check-workflow.tool.js';
import { beforeToolCallbackCheckWorkflowStatus } from './callbacks/before-tool.callback.js';
import { Agents } from '@repo/firebase';
import { dealPilotAgent } from './sub-agents/deal-pilot/agent.js';
import { finalizeWorkflowStatus } from './callbacks/after-agent.callback.js';

export class Agent {
  public name: string = Agents.MASTER_ORCHESTRATOR;

  private agent: Runner;

  orchestrator = new LlmAgent({
    name: this.name,
    model: GEMINI_3_MODEL._3_5_FLASH,
    instruction: MASTER_ORCHESTRATOR_INSTRUCTION,
    generateContentConfig: {
      thinkingConfig: {
        includeThoughts: false,
      },
    },
    contextCompactors: [
      new TokenBasedContextCompactor({
        tokenThreshold: 1000,
        eventRetentionSize: 5,
        summarizer: new LlmSummarizer({
          llm: new Gemini({ model: GEMINI_3_MODEL._3_5_FLASH }),
        }),
      }),
    ],
    beforeAgentCallback: [
      primeRequestContext,
      extractDealNumberFromRequest,
      resolveOrCreateWorkflow,
    ],
    beforeToolCallback: [beforeToolCallbackCheckWorkflowStatus],
    afterAgentCallback: [finalizeWorkflowStatus],
    tools: [checkWorkflowTool, LOAD_MEMORY],
    subAgents: [landGuardAgent, dealPilotAgent],
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
