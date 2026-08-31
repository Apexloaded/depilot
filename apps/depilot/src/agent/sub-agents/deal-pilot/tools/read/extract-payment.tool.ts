import { FunctionTool } from '@google/adk';
import { READ_TOOLS_NAMES } from '../../constant.js';
import { visionAgent } from '../../../vision-agent/agent.js';
import { PaymentExtraction, paymentExtractionSchema } from '../../../vision-agent/schemas/index.js';
import { PAYMENT_EXTRACTION_PROMPT } from '../../prompts/payment-extraction.prompt.js';
import { ContextKeys } from '../../../../common/utils/context.utils.js';

export const extractPaymentDetailsTool = new FunctionTool({
  name: READ_TOOLS_NAMES.EXTRACT_PAYMENT_DETAILS,
  description:
    'Extract structured payment fields (amount, date, reference number, bank, payer) from a payment ' +
    'screenshot using vision analysis. Read-only — does NOT attach anything to a deal. Fields the vision ' +
    'model could not read clearly come back null and listed in illegibleFields — do not treat those as zero ' +
    'or absent, they mean "unknown," which is different. Follow with apply_payment_to_deal to act on the result.',
  execute: async (_, context) => {
    if (!context) {
      return {
        error: true,
        message: 'I could not find the payment image in the context.',
      };
    }

    const extractedData = await visionAgent.extractData<PaymentExtraction>({
      context,
      prompt: PAYMENT_EXTRACTION_PROMPT,
      parseSchema: paymentExtractionSchema,
    });

    if (!extractedData) {
      return {
        error: true,
        message:
          'I could not extract payment details from the payment screenshot.',
      };
    }

    // ============================================================
    // SHARE THE EXTRACTED DATA WITH LATER TOOLS IN THE SESSION
    // ============================================================
    context.state.set(ContextKeys.Payment.ExtractedReceipt, extractedData);

    return extractedData;
  },
});