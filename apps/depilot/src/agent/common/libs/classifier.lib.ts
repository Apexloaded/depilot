import { WorkflowType } from '@repo/firebase';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_3_MODEL } from '../../models/gemini/gemini-3.js';
import z from 'zod';
import logger from '../../../common/logger/index.js';

type PrefilterResult = WorkflowType;

const llmClassifierResultSchema = z.object({
  type: z.enum(WorkflowType),
  confidence: z.number(),
  reasoning: z.string(),
});
type LLMClassifierResult = z.infer<typeof llmClassifierResultSchema>;


const DEAL_SIGNALS =
  /\b(deal\s?number|dealNumber|payment|receipt|stage|installment|invoice)\b/i;
const LAND_SIGNALS =
  /\b(beacon|coordinate|survey|cadastral|plan\s?no|datum|polygon|geodetic)\b/i;

const CLASSIFIER_SYSTEM_PROMPT = `
Classify a raw property-related request into exactly one workflow type.

- DEAL_WORKFLOW: primarily about a specific deal — creation, payments, stage transitions.
  No survey/coordinate/land-verification content present.
- DUE_DILIGENCE_WORKFLOW: primarily about verifying land — survey plans, coordinates, beacons,
  cadastral status, zoning, encroachment. No dealNumber, payment, or stage-transition content.
- HYBRID_VERIFICATION_WORKFLOW: contains BOTH deal-related content (dealNumber, payment, stage
  change) AND land-verification content (coordinates, survey, beacon, cadastral) in the same
  submission, OR explicitly asks to verify a deal's underlying parcel.

If genuinely ambiguous or signal-free on both fronts, choose DUE_DILIGENCE_WORKFLOW — it never
triggers a deal mutation, making it the safer default.
`.trim();

export class WorkflowClassifier {
  /**
   * Prefilter workflow type based on the input
   * @param params - The input to classify
   * @returns The workflow type
   */
  classifyWithPrefilter(params: {
    rawInput: string;
    hasDealNumber: boolean;
    hasAttachment: boolean;
  }): PrefilterResult {
    const { rawInput, hasDealNumber, hasAttachment } = params;

    const dealSignal = hasDealNumber || DEAL_SIGNALS.test(rawInput);
    const landSignal = LAND_SIGNALS.test(rawInput) || hasAttachment; // images are usually survey/payment evidence

    if (dealSignal && landSignal)
      return WorkflowType.HYBRID_VERIFICATION_WORKFLOW; // could be HYBRID — let the LLM decide
    if (dealSignal && !landSignal) return WorkflowType.DEAL_WORKFLOW;
    if (landSignal && !dealSignal) return WorkflowType.DUE_DILIGENCE_WORKFLOW;
    return WorkflowType.HYBRID_VERIFICATION_WORKFLOW;
  }

  /**
   * Classify workflow type based on LLM analysis if prefilter result is HYBRID
   * @param rawInput - The input to classify
   * @returns The workflow type
   */
  async classifyWithLLM(rawInput: string): Promise<LLMClassifierResult> {
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: GEMINI_3_MODEL._3_5_FLASH_LITE,
        contents: [{ role: 'user', parts: [{ text: rawInput }] }],
        config: {
          systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: llmClassifierResultSchema,
        },
      });

      const parsed = llmClassifierResultSchema.parse(response.text);
      if (!Object.values(WorkflowType).includes(parsed.type)) {
        throw new Error(
          `Invalid workflow type returned: ${parsed.type}`,
        );
      }

      return parsed;
    } catch (error) {
      logger.error(
        '[classifyWorkflowType] classification failed, falling back to safe default',
        { error },
      );
      // Fail-safe: never let a classifier error block workflow creation.
      return {
        type: WorkflowType.HYBRID_VERIFICATION_WORKFLOW,
        confidence: 0,
        reasoning: 'fallback: classifier error',
      };
    }
  }
}

export const workflowClassifier = new WorkflowClassifier();
