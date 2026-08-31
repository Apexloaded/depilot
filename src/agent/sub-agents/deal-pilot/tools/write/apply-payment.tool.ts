import { FunctionTool } from '@google/adk';
import {
  dealStore,
  firestore,
  OverAllDealPaymentStatus,
  paymentRecordStore,
  paymentScheduleStore,
  PaymentStatusEnum,
  paymentStore,
} from '../../../../../firebase/index.js';
import z from 'zod';
import { MUTATING_TOOLS_NAMES } from '../../constant.js';

export const applyPaymentToDealTool = new FunctionTool({
  name: MUTATING_TOOLS_NAMES.APPLY_DEAL_PAYMENT,
  description: 'Officially apply a verified payment receipt to a deal. This creates a transaction ledger record, ' +
    'allocates the payment across outstanding schedule installments (with rollover/splits), and updates parent deal values.',
  parameters: z.object({
    dealNumber: z.string(),
    workspaceId: z.string(),
    amount: z.number().min(1),
    referenceNumber: z.string(),
    paymentMethod: z.string().default('BANK_TRANSFER'),
    payerId: z.string().nullable().optional(),
    recordedBy: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
  execute: async ({
    dealNumber,
    amount,
    referenceNumber,
    paymentMethod,
    payerId,
    recordedBy,
    description,
  }) => {
    return firestore.runTransaction(async (tx) => {
      // ============================================================
      // 1. READ PHASE (All reads must happen first in a transaction)
      // ============================================================
      const dealData = await dealStore.fetchDeal(dealNumber);
      if (!dealData || !dealData.deal)
        throw new Error(`Deal ${dealNumber} does not exist`);
      const deal = dealData.deal;

      // Verify reference number is unused
      const existingRecords = await paymentRecordStore.findByReferenceNumber(
        deal.dealNumber,
        referenceNumber
      );
      if (existingRecords.length > 0)
        throw new Error(`Payment with reference '${referenceNumber}' already processed.`);

      // Get active schedule
      const schedules = await paymentScheduleStore.list(deal.dealNumber);
      const activeSchedule = schedules.find((s) => !s.isCompleted);
      if (!activeSchedule) throw new Error(`No active schedule.`);

      // ============================================================
      // 2. ALLOCATION & CALCULATION PHASE (No writes inside the loop)
      // ============================================================
      const now = new Date();
      let remainingPaymentPool = amount;
      const updatedInstallments = activeSchedule.installments.map((inst) => ({
        ...inst,
      }));

      // Pre-generate the PaymentRecord ID upfront
      const paymentRecordDocRef = paymentRecordStore.getCollectionRef(deal.dealNumber).doc();
      const finalPaymentRecordId = paymentRecordDocRef.id;

      // Collect payment allocation objects to prepare for writing
      const allocationsToCreate: Array<Parameters<typeof paymentStore.create>[1]> = [];

      // FIFO installment distribution loop
      for (const installment of updatedInstallments) {
        if (remainingPaymentPool <= 0) break;
        if (installment.status === PaymentStatusEnum.COMPLETED) continue;

        const outstandingDue = installment.amountDue - installment.amountPaid;
        const allocationAmount = Math.min(remainingPaymentPool, outstandingDue);

        if (allocationAmount > 0) {
          installment.amountPaid += allocationAmount;
          remainingPaymentPool -= allocationAmount;

          installment.status =
            installment.amountPaid >= installment.amountDue
              ? PaymentStatusEnum.COMPLETED
              : PaymentStatusEnum.PARTIAL;

          if (installment.status === PaymentStatusEnum.COMPLETED)
            installment.paidDate = now;

          // Push creation parameters to queue (do NOT call tx writes here)
          allocationsToCreate.push({
            paymentRecordId: finalPaymentRecordId,
            paymentScheduleId: activeSchedule.id,
            installmentId: installment.id,
            amount: allocationAmount,
            status: PaymentStatusEnum.COMPLETED,
          });
        }
      }

      // Compute schedule aggregates
      const totalPaid = activeSchedule.totalPaid + amount;
      const balance = Math.max(activeSchedule.totalAmount - totalPaid, 0);
      const isCompleted = balance <= 0;
      const isOverAllCompleted = schedules.some((s) => s.balance <= 0);

      // ============================================================
      // 3. WRITE PHASE (Execute all writes strictly after reads/calculations)
      // ============================================================

      // Write parent PaymentRecord
      await paymentRecordStore.create(
        deal.dealNumber,
        {
          paymentScheduleId: activeSchedule.id,
          payerId,
          recordedBy,
          amount,
          paymentType: 'CREDIT',
          paymentMethod,
          referenceNumber,
          status: PaymentStatusEnum.COMPLETED,
          paymentDate: now,
          description: description || 'Payment processed.',
        },
        finalPaymentRecordId,
        tx
      );

      // Batch write all split payment allocations
      await Promise.all(
        allocationsToCreate.map((allocationData) =>
          paymentStore.create(deal.dealNumber, allocationData, tx)
        )
      );

      // Update Payment Schedule via Store
      await paymentScheduleStore.update(
        deal.dealNumber,
        activeSchedule.id,
        {
          totalPaid,
          balance,
          isCompleted,
          installments: updatedInstallments,
        },
        tx
      );

      // Update Deal Aggregates via Store
      await dealStore.update(
        dealNumber,
        {
          paymentStatus: isOverAllCompleted
            ? OverAllDealPaymentStatus.FULLY_PAID
            : OverAllDealPaymentStatus.PARTIALLY_PAID,
        },
        tx
      );

      return {
        success: true,
        paymentRecordId: finalPaymentRecordId,
        amountAllocated: amount,
        rolloverRemaining: remainingPaymentPool,
        isScheduleCompleted: isCompleted,
      };
    });
  },
});
