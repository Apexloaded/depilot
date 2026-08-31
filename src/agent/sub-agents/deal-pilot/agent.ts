import 'dotenv/config';
import { LlmAgent } from '@google/adk';
import { DEAL_PILOT_INSTRUCTION } from './prompts/index.js';
import { GEMINI_3_MODEL } from '../../models/gemini/index.js';
import { Agents } from '../../../firebase/index.js';
import { dealPilotTools } from './tools/index.js';
import { beforeToolCallbackCheckDealNumber } from './callbacks/index.js';

export class DealPilotAgent {
  public name: string = Agents.DEAL_PILOT;
  agent: LlmAgent;

  constructor() {
    this.agent = new LlmAgent({
      name: this.name,
      model: GEMINI_3_MODEL._3_7_FLASH,
      instruction: DEAL_PILOT_INSTRUCTION,
      beforeToolCallback: [beforeToolCallbackCheckDealNumber],
      tools: dealPilotTools,
      outputKey: this.name + '_output',
    });
  }

  init(): LlmAgent {
    return this.agent;
  }
}

export const dealPilotAgent = new DealPilotAgent().init();
