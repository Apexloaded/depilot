import logger from "../../../common/logger/index.js";

/**
 * Extract deal number from text
 * It checks if the text contains a deal number and returns it
 * Otherwise, it returns undefined
 * @param message
 * @returns deal number if found, otherwise undefined
 */
export function extractDealNumberFromText(message: string): string | undefined {
  const regex = /DEAL-\d{4}-\d{5}/;
  const match = message.match(regex);

  if (match) {
    const dealNumber = String(match[0]).trim();
    logger.info(`Deal number found: ${dealNumber}`);
    return dealNumber;
  } else {
    logger.error(`No deal number found in message: ${message}`);

    throw new Error(`
      No deal number found in message.
      Please provide an ID in the format DEAL-YYYY-XXXXX (e.g., DEAL-2026-00042).
      Examples:
      - "Process this application for DEAL-2026-00042"
      - "What is the status on DEAL-2026-00042?"
      - "Resume processing for DEAL-2026-00042"
    `);
  }
}

export const matchDealNumberRegex = /DEAL-\d{4}-\d{5}/;
