import { createWorkflow, WorkflowResponse, createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { SHCOrderStatus, validateOrderTransition, createSHCError } from "@shc/types";
import { canTransition } from "@shc/business-rules";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../modules/shc-ledger/service";

// Step: validate transition using contracts + business rules
export const validateTransitionStep = createStep(
  "validate-transition-step",
  async (input: { from: SHCOrderStatus; to: SHCOrderStatus }) => {
    const contractValid = validateOrderTransition(input.from, input.to);
    const businessValid = canTransition(input.from, input.to);

    if (!contractValid.valid || !businessValid) {
      const err = createSHCError("SHC-ORDER-001", `Invalid order state transition from ${input.from} to ${input.to}`);
      throw err;
    }
    return new StepResponse({ valid: true });
  }
);

// Step: perform transition via module service (injected)
export const transitionStateStep = createStep(
  "transition-state-step",
  async (input: { orderId: string; to: SHCOrderStatus; container: any }) => {
    const orderMetaService: ShcOrderMetaModuleService = input.container.resolve("shcOrderMetaService"); // module service name derived from registration
    const result = await orderMetaService.transitionOrderState(input.orderId, input.to);
    if (!result.valid) {
      const err = createSHCError("SHC-ORDER-001", result.error || "Transition failed");
      throw err;
    }
    return new StepResponse(result.meta);
  }
);

// Phase 6: Step to auto-post commission ledger on 'completed' (double-entry via ledger module; idempotent)
// Phase 8-9: also award customer Home Credits (5%) via credit-wallet on completed (ledger issuance too).
export const postCommissionOnCompleteStep = createStep(
  "post-commission-on-complete-step",
  async (input: { orderId: string; to: SHCOrderStatus; container: any }): Promise<StepResponse<{ posted: boolean; totalCents?: number; error?: string; creditsAwarded?: number } | null>> => {
    if (input.to !== "completed") {
      return new StepResponse(null);
    }
    let creditsAwarded = 0;
    try {
      const ledgerService: ShcLedgerModuleService = input.container.resolve("shcLedgerService");
      const orderService = input.container.resolve("orderService") as any;
      let totalCents = 0;
      let customerId: string | undefined;
      try {
        const order = await orderService.retrieveOrder(input.orderId, { relations: ["items", "customer"] });
        if (order?.items?.length) {
          totalCents = order.items.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 1)), 0);
        } else if (order?.total) totalCents = Math.floor(order.total);
        customerId = order?.customer?.id || order?.customer_id || "cust_demo";
      } catch {}
      if (totalCents > 0) {
        await ledgerService.postCommission({ orderId: input.orderId, totalCents, actor: "order-complete-workflow", container: input.container });
      }
      // Growth: award credits to customer (ties ledger credit issuance)
      if (customerId && totalCents > 0) {
        try {
          const credService = input.container.resolve("shcCreditWalletService");
          const aw = await credService.awardCreditsOnComplete(customerId, totalCents, input.orderId, input.container);
          creditsAwarded = aw.awarded || 0;
        } catch {}
      }
      return new StepResponse({ posted: totalCents > 0, totalCents, creditsAwarded });
    } catch (e: any) {
      // Non-fatal for state machine; subscriber also handles + weekly sim reconciles
      return new StepResponse({ posted: false, error: e.message, creditsAwarded });
    }
  }
);

type OrderStateTransitionInput = {
  orderId: string;
  to: SHCOrderStatus;
  actor?: string;
};

export const orderStateTransitionWorkflow = createWorkflow(
  "order-state-transition-workflow",
  (input: OrderStateTransitionInput) => {
    // In real, first fetch current status from orderMeta or order, here assume caller provides or step does.
    // For Wave 1 simplicity, transitionStep handles lookup inside service.
    // To make validate work we stub from as 'paid' if needed; real impl queries first.
    validateTransitionStep({ from: "paid" as SHCOrderStatus, to: input.to }); // placeholder - enhance with query step in full

    const updatedMeta = transitionStateStep({
      orderId: input.orderId,
      to: input.to,
      container: input as any, // container injected by runner
    } as any);

    // Phase 6: auto post commission ledger on completed (in workflow + subscriber for redundancy + hardening)
    postCommissionOnCompleteStep({
      orderId: input.orderId,
      to: input.to,
      container: input as any,
    } as any);

    return new WorkflowResponse(updatedMeta);
  }
);

export default orderStateTransitionWorkflow;
