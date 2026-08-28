import { LlmAgent } from '@google/adk';
import { landGuardTools } from './tools/index.js';
import { GEMINI_3_MODEL } from '../../models/gemini/index.js';
import { DOCUMENT_READER_INSTRUCTION } from './prompts/index.js';

export class DocumentReaderAgent {
  public name: string = 'document_reader_agent';
  public description: string = '';
  agent: LlmAgent;

  constructor() {
    this.agent = new LlmAgent({
      name: this.name,
      description: this.description,
      model: GEMINI_3_MODEL._3_1_PRO_PREVIEW,
      instruction: DOCUMENT_READER_INSTRUCTION,
      tools: landGuardTools,
      beforeModelCallback: []
    });
  }

  init(): LlmAgent {
    return this.agent;
  }
}

export const documentReaderAgent = new DocumentReaderAgent().init();
