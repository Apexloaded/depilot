import 'dotenv/config';
import { LlmAgent } from '@google/adk';
import { LAND_GUARD_INSTRUCTION } from './prompts/base.prompt.js';
import { landGuardTools } from './tools/index.js';
import { GEMINI_3_MODEL } from '../../models/gemini/gemini-3.js';

export class LandGuardAgent {
  public name: string = 'land_guard_agent';
  agent: LlmAgent;

  constructor() {
    this.agent = new LlmAgent({
      name: this.name,
      model: GEMINI_3_MODEL._3_5_FLASH,
      instruction: LAND_GUARD_INSTRUCTION,
      tools: landGuardTools,
    });
  }

  init(): LlmAgent {
    return this.agent;
  }
}

export const landGuardAgent = new LandGuardAgent().init();
