import { BaseTool, Context } from "@google/adk";
import logger from "../../../../common/logger/index.js";
import { readDealTools } from "../tools/index.js";
import { READ_TOOLS_NAMES } from "../constant.js";

export async function beforeToolCallbackCheckDealNumber(params: {
  tool: BaseTool;
  args: Record<string, unknown>;
  context: Context;
}) {
  logger.info('[BeforeToolCallback]: check deal number')

  const { tool, args } = params;

  // Extract names dynamically from your registry
  const targetedReadToolNames = readDealTools
    .map((tool) => tool.name)
    .filter((name) => name !== READ_TOOLS_NAMES.EXTRACT_PAYMENT_DETAILS);
  // Only enforce this guardrail if the sub-agent is trying to run a deal tool
  if (targetedReadToolNames.includes(tool.name)) {
    const dealNumber = args?.dealNumber;

    if (!dealNumber || typeof dealNumber !== 'string' || dealNumber.trim() === '') {
      logger.warn(`[Guardrail] Blocked tool '${tool.name}': Missing valid 'dealNumber'.`);

      return {
        error: true,
        reason: 'INVALID_ARGUMENT',
        message: `The tool '${tool.name}' cannot be executed because 'dealNumber' is missing or empty. ` +
          `Please identify, extract, or ask the user for the deal number (e.g., DEAL-1002) first.`,
        requiredParameter: 'dealNumber'
      };
    }

    const dealNumberPattern = /^DEAL-\d{4}-\d+$/i;
    if (!dealNumberPattern.test(dealNumber)) {
      logger.warn(`[Guardrail] Blocked tool '${tool.name}': Invalid 'dealNumber' format. Expected 'DEAL-YEAR-NUMBER' format.`);
      return {
        error: true,
        reason: 'INVALID_ARGUMENT',
        message: `The tool '${tool.name}' requires a valid 'dealNumber' in 'DEAL-YEAR-NUMBER' format (e.g., DEAL-1002). ` +
          `The provided value '${dealNumber}' does not match this format.`,
        requiredParameter: 'dealNumber'
      };
    }
  }

  return undefined;
}


