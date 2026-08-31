import { z } from 'zod';
import { Context, FunctionTool } from '@google/adk';
import { MUTATING_TOOLS_NAMES } from '../../constant.js';
import {
  DealPaymentScheduleType,
  dealStore,
  InstallmentDocument,
  PaymentPlan,
  paymentPlanStore,
  paymentScheduleStore,
  PaymentStatusEnum,
} from '@repo/firebase';
import { v4 as uuid } from 'uuid';
import { ContextKeys } from '../../../../common/utils/context.utils.js';
import { PaymentExtraction, PaymentPlanExtraction } from '../../../vision-agent/schemas/index.js';
import { visionAgent } from '../../../vision-agent/agent.js';
import { paymentPlanExtractionSchema } from '../../../vision-agent/schemas/index.js'

const spreadRemainderIndexes = (
  count: number,
  totalSlots: number,
  mode: 'even-spread' | 'front-loaded' | 'back-loaded',
): number[] => {
  if (count <= 0 || totalSlots <= 0) return [];
  if (mode === 'front-loaded') return Array.from({ length: count }, (_, i) => i);
  if (mode === 'back-loaded') return Array.from({ length: count }, (_, i) => totalSlots - 1 - i);

  const step = totalSlots / count;
  return Array.from({ length: count }, (_, i) => Math.floor(i * step));
};

export const createPaymentScheduleTool = new FunctionTool({
  name: MUTATING_TOOLS_NAMES.CREATE_PAYMENT_SCHEDULE,
  description:
    'Generate and create a structured payment schedule for an active deal. Dynamic installment amounts ' +
    'and down payments are calculated automatically by evaluating the user request or applying payment ratio rules.',
  parameters: z.object({
    dealNumber: z
      .string()
      .describe(
        'The exact deal number (e.g., DEAL-2026-00042) to associate with this schedule.'
      ),
    totalAmount: z
      .number()
      .min(1)
      .describe('The total cost/amount of the transaction.'),
    type: z
      .enum(DealPaymentScheduleType)
      .default(DealPaymentScheduleType.PLOT_PURCHASE)
      .describe('The type of schedule.'),
    startDate: z
      .string()
      .describe(
        'ISO Date string representing when the first installment is due.'
      ),
    notes: z
      .string()
      .nullable()
      .optional()
      .describe('Optional administrative notes.'),
  }),
  execute: async (args, context?: Context) => {
    const { dealNumber, totalAmount, type, startDate, notes } = args;

    // 1. Verify that the target Deal exists
    const dealData = await dealStore.fetchDeal(dealNumber);
    if (!dealData || !dealData.deal) {
      return {
        error: true,
        message: `Failed to create payment schedule. Deal ${dealNumber} does not exist.`,
      };
    }

    // Check if an active (incomplete) schedule already exists for this deal
    const existingSchedules = await paymentScheduleStore.list(dealNumber);
    const activeSchedule = existingSchedules.find((s) => !s.isCompleted);
    if (activeSchedule) {
      return {
        error: true,
        message: `Failed to create payment schedule. Deal ${dealNumber} already has an active payment schedule (ID: ${activeSchedule.id}).`,
      };
    }

    const dealAgreedPrice = dealData.deal.totalAgreedPrice || totalAmount;
    const activePlans = await paymentPlanStore.listActive();
    if (activePlans.length === 0) {
      return {
        error: true,
        message: 'No active payment plans are available in the system. Cannot calculate installments.',
      };
    }

    let targetDurationMonths: number | null = null;
    let selectedPlan: PaymentPlan | undefined;

    // ============================================================
    // STEP 2: IMPLEMENT MECHANISM 1 (FINANCIAL COMMITMENT RATIO)
    // ============================================================
    const processedReceipt = context?.state.get(
      ContextKeys.Payment.ExtractedReceipt
    ) as PaymentExtraction | undefined;

    if (processedReceipt && processedReceipt.amount) {
      const receiptAmount = Number(processedReceipt.amount);
      const paymentRatio = receiptAmount / dealAgreedPrice;

      if (Math.abs(receiptAmount - dealAgreedPrice) < 0.01) {
        // A. Full Payment (100% of the deal) -> 1 Month Plan
        console.info('[Schedule Tool] Full payment detected. Automatically selecting 1-Month Plan.');
        targetDurationMonths = 1;
      } else if (paymentRatio >= 0.50) {
        // B. High Liquidity (>= 50% paid upfront) -> Short term matching (3 Months)
        console.info(`[Schedule Tool] High commitment detected (${Math.round(paymentRatio * 100)}%). Matching to 3-Month Plan.`);
        targetDurationMonths = 3;
      } else if (paymentRatio >= 0.20 && paymentRatio < 0.50) {
        // C. Standard Commitment (20% to 49% paid upfront) -> Mid term matching (6 Months)
        console.info(`[Schedule Tool] Standard commitment detected (${Math.round(paymentRatio * 100)}%). Matching to 6-Month Plan.`);
        targetDurationMonths = 6;
      } else {
        // D. Minimum Commitment (< 20% paid upfront) -> Long term matching (12 Months)
        console.info(`[Schedule Tool] Low commitment detected (${Math.round(paymentRatio * 100)}%). Matching to 12-Month Plan.`);
        targetDurationMonths = 12;
      }
    }

    // ============================================================
    // STEP 3: FALLBACK TO TEXT EXTRACTION (If no receipt was submitted)
    // ============================================================
    let extractedPreferences: PaymentPlanExtraction | null | undefined;
    if (!targetDurationMonths) {
      try {
        const systemInstruction = 'Extract requested payment plan details from message.';
        extractedPreferences = await visionAgent.extractData({
          context,
          prompt: systemInstruction,
          parseSchema: paymentPlanExtractionSchema,
        });
      } catch (extractionError) {
        console.warn('[CreatePaymentSchedule] Text plan extraction skipped:', extractionError);
      }
    }

    // ============================================================
    // STEP 4: DYNAMIC MULTI-PLAN MATCHING & SCORING
    // ============================================================
    if (targetDurationMonths) {
      // Direct lookup matching for the computed target duration
      selectedPlan = activePlans.find(p => p.durationMonths === targetDurationMonths);

      // Graceful degradation: if exact target duration plan doesn't exist, score the closest available
      if (!selectedPlan) {
        console.warn(`[Schedule Tool] Ideal ${targetDurationMonths}-Month plan not configured. Scoring closest available plan...`);
        const scoredPlans = activePlans.map(plan => ({
          plan,
          penalty: Math.abs(plan.durationMonths - (targetDurationMonths as number)),
        }));
        scoredPlans.sort((a, b) => a.penalty - b.penalty);
        selectedPlan = scoredPlans[0]!.plan;
      }
    } else if (extractedPreferences) {
      const { durationMonths, numberOfInstallments, planNameKeywords } = extractedPreferences;

      const scoredPlans = activePlans.map(plan => {
        let score = 0;
        if (durationMonths && plan.durationMonths === durationMonths) score += 100;
        if (numberOfInstallments && plan.numberOfInstallments === numberOfInstallments) score += 100;
        if (planNameKeywords) {
          const keyword = planNameKeywords.toLowerCase();
          if (plan.name.toLowerCase().includes(keyword)) score += 50;
        }
        if (durationMonths) {
          score -= Math.abs(plan.durationMonths - durationMonths);
        }
        return { plan, score };
      });

      scoredPlans.sort((a, b) => b.score - a.score);
      selectedPlan = scoredPlans[0]!.plan;
    }

    if (!selectedPlan) {
      return {
        error: true,
        message: 'No payment plan found for the given criteria. Please try again.',
      };
    }

    const {
      id: planId,
      name: planName,
      numberOfInstallments,
      downPaymentPercentage,
    } = selectedPlan;

    // ============================================================
    // STEP 5: MATH & FINANCIAL LEDGER CALCULATIONS
    // ============================================================
    const normTotalAmount = Math.round(totalAmount);

    // Extracted receipt payment overrides standard plan downPaymentPercentage
    const downPayment = processedReceipt && processedReceipt.amount
      ? Math.round(Number(processedReceipt.amount))
      : Math.round(normTotalAmount * (downPaymentPercentage / 100));

    const balance = normTotalAmount - downPayment;
    const remainingInstallments = Math.max(1, numberOfInstallments - 1);

    // Default clean units to $1,000,000 for luxury land deals (adjust clean unit dynamically)
    const cleanUnit = normTotalAmount >= 1000000 ? 1000000 : 100000;
    const distributionMode = 'even-spread';

    let baseInstallmentAmount = 0;
    let recurringAmounts: number[] = [];

    if (numberOfInstallments > 1) {
      const balanceUnits = Math.floor(balance / cleanUnit);
      const subUnitRemainder = balance - balanceUnits * cleanUnit;

      const baseUnits = Math.floor(balanceUnits / remainingInstallments);
      const extraUnits = balanceUnits - baseUnits * remainingInstallments;

      const unitPerInstallment = Array.from(
        { length: remainingInstallments },
        () => baseUnits,
      );

      const boostedIndexes = spreadRemainderIndexes(
        extraUnits,
        remainingInstallments,
        distributionMode,
      );
      for (const index of boostedIndexes) {
        if (unitPerInstallment[index] !== undefined) {
          unitPerInstallment[index] += 1;
        }
      }

      recurringAmounts = unitPerInstallment.map((units) => units * cleanUnit);

      const lastIndex = recurringAmounts.length - 1;
      if (recurringAmounts[lastIndex] !== undefined) {
        recurringAmounts[lastIndex] += subUnitRemainder;
      }

      baseInstallmentAmount = baseUnits * cleanUnit;
    }

    // ============================================================
    // STEP 6: GENERATE FLIGHT PLAN INSTALLMENTS LEDGER
    // ============================================================
    const scheduleId = uuid();
    const start = new Date(startDate);
    const installments: InstallmentDocument[] = [];
    const now = new Date();

    if (numberOfInstallments <= 1) {
      installments.push({
        id: uuid(),
        paymentScheduleId: scheduleId,
        installmentNumber: 1,
        dueDate: start,
        amountDue: normTotalAmount,
        amountPaid: 0,
        status: PaymentStatusEnum.PENDING,
        lateFee: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Installment 1 is explicitly the Down Payment
      installments.push({
        id: uuid(),
        paymentScheduleId: scheduleId,
        installmentNumber: 1,
        dueDate: start,
        amountDue: downPayment,
        amountPaid: 0,
        status: PaymentStatusEnum.PENDING,
        lateFee: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Remaining monthly recurring installments
      for (let n = 2; n <= numberOfInstallments; n++) {
        const dueDate = new Date(start);
        dueDate.setMonth(dueDate.getMonth() + (n - 1));
        const installmentAmountDue = recurringAmounts[n - 2] ?? baseInstallmentAmount;

        installments.push({
          id: uuid(),
          paymentScheduleId: scheduleId,
          installmentNumber: n,
          dueDate,
          amountDue: installmentAmountDue,
          amountPaid: 0,
          status: PaymentStatusEnum.PENDING,
          lateFee: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Double-check mathematical safety
    const generatedTotal = installments.reduce((sum, inst) => sum + inst.amountDue, 0);
    if (generatedTotal !== normTotalAmount) {
      return {
        error: true,
        message: `Installment distribution mismatch: expected ${normTotalAmount}, got ${generatedTotal}`,
      };
    }

    const endDate = installments.length > 0
      ? installments[installments.length - 1]!.dueDate
      : start;

    try {
      const schedule = {
        paymentPlanId: planId,
        totalAmount: normTotalAmount,
        downPaymentAmount: downPayment,
        installmentAmount: numberOfInstallments <= 1 ? normTotalAmount : baseInstallmentAmount,
        balance,
        type,
        startDate: start,
        endDate,
        notes: notes || `Clean Unit Division V2: matched "${planName}"`,
        installments,
        installmentCount: numberOfInstallments,
      }
      const newSchedule = await paymentScheduleStore.create(dealNumber, schedule, scheduleId,);

      return {
        success: true,
        scheduleId: newSchedule.id,
        dealNumber,
        matchedPlanName: planName,
        totalAmount: newSchedule.totalAmount,
        downPaymentAmount: newSchedule.downPaymentAmount,
        installmentCount: newSchedule.installmentCount,
        endDate: newSchedule.endDate,
        installments: newSchedule.installments.map(i => ({
          number: i.installmentNumber,
          due: i.amountDue,
          dueDate: i.dueDate
        })),
        message: `Successfully created V2 clean-spaced payment schedule using plan "${planName}" for Deal ${dealNumber}.`,
      };
    } catch (error: any) {
      return {
        error: true,
        message: `Error writing payment schedule: ${error.message || error}`,
      };
    }
  },
});
