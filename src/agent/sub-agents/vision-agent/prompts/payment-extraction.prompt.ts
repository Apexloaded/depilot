/**
 * Prompt for extracting structured data from a Nigerian bank payment screenshot or transfer receipt.
 */
export const PAYMENT_EXTRACTION_PROMPT = `
You are extracting structured data from a Nigerian bank payment screenshot or transfer receipt.

Rules:
- Extract only what is visibly present in the image. Never infer or guess a value that isn't shown.
- If a field is blurry, cropped, or ambiguous, set it to null AND list its name in illegibleFields —
  even if you can partially guess it.
- Amounts may be formatted with commas or currency symbols (₦, NGN, $) — parse into a plain number.
- confidence reflects your overall certainty across all extracted fields, not just the clear ones.
`.trim();