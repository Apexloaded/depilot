import { GoogleGenAI, Part } from '@google/genai';
import { GEMINI_3_MODEL } from '../../models/gemini/gemini-3.js';
import { Context } from '@google/adk';
import * as z from 'zod';

type JsonSchema = Record<string, any>;

export class VisionAgent {
  private client: GoogleGenAI;
  private model: string = GEMINI_3_MODEL._3_1_PRO_PREVIEW;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  /**
   * Extracts structured data based on the prompt using ONLY the provided Context.
   * If an image attachment exists, it uses vision analysis.
   * If only text messages exist, it uses natural language analysis.
   * @param context Context containing either images, user chat logs, or both.
   * @param prompt Prompt to guide the extraction process.
   * @param parseSchema Zod schema to enforce and validate the structure.
   */
  async extractData<T>(params: {
    context?: Context;
    prompt: string;
    parseSchema?: z.ZodType<T>;
  }): Promise<T | undefined> {
    const { context, prompt, parseSchema } = params;

    let parts: Part[] = [];

    // 1. First choice: Extract image/file parts if they are attached to the request
    const files = this.getInlineFiles(context);
    if (files && files.length > 0) {
      parts = [...files];
    } else {
      // 2. Second choice/Fallback: Extract raw user message text from the context
      const chatText = this.getRawTextFromContext(context);
      if (!chatText) {
        throw new Error('No valid attachments or text messages found in the session context.');
      }
      parts = [{ text: chatText }];
    }

    const responseSchema = parseSchema
      ? this.toResponseSchema(parseSchema)
      : undefined;

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: {
        role: 'user',
        parts,
      },
      config: {
        systemInstruction: prompt,
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const raw = response.text;
    if (!raw) {
      throw new Error('Vision model returned no output');
    }

    const parsed = JSON.parse(raw);
    return parseSchema?.parse(parsed);
  }

  /**
 * Extracts and concatenates all text parts from the user's conversational message.
 */
  private getRawTextFromContext(context?: Context): string | null {
    const parts = context?.userContent?.parts ?? [];
    const textParts = parts
      .filter((p): p is { text: string } => typeof (p as any).text === 'string')
      .map((p) => p.text);

    return textParts.length > 0 ? textParts.join('\n') : null;
  }

  /**
   * Get all inline files in the form of Part[] from context.
   * @param context Context to get files from.
   * @returns Array of inline files.
   */
  private getInlineFiles(context?: Context): Part[] | null {
    const parts = context?.userContent?.parts ?? [];
    const inlineDataParts = parts.filter((p) => p.inlineData);

    if (!inlineDataParts || !inlineDataParts.length) {
      return null;
    }

    const attachments = inlineDataParts.map(({ inlineData: data }) => {
      return {
        inlineData: { ...data },
      };
    });

    return attachments;
  }

  private toResponseSchema<T>(schema: z.ZodType<T> | JsonSchema): JsonSchema {
    if (typeof (schema as any).toJSONSchema === 'function') {
      return (schema as any).toJSONSchema();
    }
    return schema as JsonSchema;
  }
}

export const visionAgent = new VisionAgent();
