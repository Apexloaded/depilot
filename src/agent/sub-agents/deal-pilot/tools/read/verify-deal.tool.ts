import { z } from 'zod';
import { FunctionTool } from '@google/adk';
import { dealStore, paymentRecordStore, paymentScheduleStore } from '../../../../../firebase/index.js';
import { READ_TOOLS_NAMES } from '../../constant.js';

export const verifyDealTool = new FunctionTool({
  name: READ_TOOLS_NAMES.VERIFY_DEAL,
  description:
    "Cross-check a deal's current stored data against supplied evidence (e.g. extracted payment details, " +
    'document references). Read-only — returns a discrepancy report, does not modify the deal.',
  parameters: z.object({
    dealNumber: z.string(),
    evidence: z
      .record(z.string(), z.any())
      .describe(
        'Structured evidence to check against, e.g. output of extract_payment_details.'
      ),
  }),
  execute: async ({ dealNumber, evidence }) => {
    const dealData = await dealStore.fetchDeal(dealNumber);
    if (!dealData || !dealData.deal) return { error: 'NOT_FOUND', dealNumber };

    const { deal, buyers, items } = dealData;
    const discrepancies: string[] = [];

    // ============================================================
    // 1. RECEIPT EVIDENCE CHECKS (If checking a single payment screenshot)
    // ============================================================
    const isSingleReceipt =
      'referenceNumber' in evidence || 'payerName' in evidence;
    if (isSingleReceipt) {
      // A. DUPLICATE PAYMENT CHECK (Verify reference number)
      if (evidence.referenceNumber) {
        const existingRecords = await paymentRecordStore.findByReferenceNumber(
          dealData.deal.dealNumber,
          evidence.referenceNumber
        );

        if (existingRecords.length > 0) {
          discrepancies.push(
            `DUPLICATE PAYMENT DETECTED: A payment with reference number '${evidence.referenceNumber}' ` +
            `has already been recorded and processed for this deal.`
          );
        }
      }

      // B. PAYER NAME TO BUYER NAME MATCHING
      if (evidence.payerName && buyers && buyers.length > 0) {
        const receiptName = String(evidence.payerName).toLowerCase();

        // Check if the receipt name is a match for ANY registered buyer
        const hasMatchingBuyer = buyers.some((buyer) => {
          if (!buyer.name) return false;
          const buyerName = buyer.name.toLowerCase();
          return buyerName.includes(receiptName) || receiptName.includes(buyerName);
        });

        if (!hasMatchingBuyer) {
          const registeredNames = buyers.map(b => b.name).join(', ');
          discrepancies.push(
            `Payer Match Warning: The name on the receipt is '${evidence.payerName}', ` +
            `but it does not match any of the registered buyers for this deal: [${registeredNames}].`
          );
        }
      } else if (evidence.payerName && (!buyers || buyers.length === 0)) {
        discrepancies.push(
          `Payer Match Warning: The name on the receipt is '${evidence.payerName}', ` +
          `but there are no registered buyers for this deal.`
        );
      }

      // C. PAYMENT AMOUNT VALIDATION (Compare with deal's total amount)
      if (evidence.amount) {
        const paymentAmount = Number(evidence.amount);
        const schedules = await paymentScheduleStore.list(deal.dealNumber);
        const activeSchedule = schedules.find((s) => !s.isCompleted);

        if (activeSchedule) {
          // Look for an unpaid installment in the schedule matching this amount
          const matchingInstallment = activeSchedule.installments.find(
            (inst) => inst.status === 'PENDING' && inst.amountDue === paymentAmount
          );

          if (!matchingInstallment) {
            discrepancies.push(
              `Amount Match Warning: The payment amount of $${paymentAmount} does not match any ` +
              `pending installment amount in the active payment schedule.`
            );
          }
        }
      }
    }

    return {
      dealNumber,
      currentStage: deal.stage,
      discrepancies,
      clean: discrepancies.length === 0,
    };
  },
});