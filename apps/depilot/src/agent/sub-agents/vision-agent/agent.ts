import { GoogleGenAI } from '@google/genai';
import {
  paymentExtractionSchema,
  paymentExtractionResponseSchema,
  PaymentExtraction,
} from './schemas/index.js';
import { GEMINI_3_MODEL } from '../../models/gemini/gemini-3.js';
import { PAYMENT_EXTRACTION_PROMPT } from './prompts/index.js';

export class VisionAgent {
  private client: GoogleGenAI;
  private model: string = GEMINI_3_MODEL._3_1_PRO_PREVIEW;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  /**
   * Extracts structured payment fields from a payment screenshot.
   * @param imageBytes Base64-encoded image data.
   * @param mimeType e.g. 'image/jpeg', 'image/png'.
   */
  async extractPaymentDetails(imageBytes: string, mimeType: string): Promise<PaymentExtraction> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBytes } },
          ],
        },
      ],
      config: {
        systemInstruction: PAYMENT_EXTRACTION_PROMPT,
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: paymentExtractionResponseSchema,
      },
    });

    const raw = response.text;
    if (!raw) {
      throw new Error('Vision model returned no output');
    }

    const parsed = JSON.parse(raw);
    return paymentExtractionSchema.parse(parsed);
  }
}

export const visionAgent = new VisionAgent();