import 'dotenv/config';
import { LlmAgent } from '@google/adk';
import { LAND_GUARD_INSTRUCTION } from './prompts/lang-guard.prompt.js';
import { landGuardTools } from './tools/index.js';
import { GEMINI_3_MODEL } from '../../models/gemini/index.js';
import { Agents } from '../../../firebase/index.js';

export class LandGuardAgent {
  public name: string = Agents.LAND_GUARD;
  agent: LlmAgent;

  constructor() {
    this.agent = new LlmAgent({
      name: this.name,
      model: GEMINI_3_MODEL._3_7_FLASH,
      instruction: LAND_GUARD_INSTRUCTION,
      tools: landGuardTools,
    });
  }

  init(): LlmAgent {
    return this.agent;
  }
}

export const landGuardAgent = new LandGuardAgent().init();
