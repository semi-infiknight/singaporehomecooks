import { createWorkflow, WorkflowResponse, createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { createSHCError } from "@shc/types";
import { enforceOneCookPerCart, validateMinQty, validateAllergenAckForCheckout } from "@shc/business-rules";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcProductMetaModuleService from "../modules/shc-product-meta/service";

// Step to validate cart rules using shc contracts/business rules before meta creation
export const validateCartRulesStep = createStep(
  "validate-cart-rules-step",
  async (input: { cart: any; itemsWithMeta: any[]; allergenAck: boolean }) => {
    // One cook per cart
    const itemsForRule = input.itemsWithMeta.map((i: any) => ({ cookId: i.cook_id, productId: i.product_id, qty: i.quantity || 1 }));
    const oneCook = enforceOneCookPerCart(itemsForRule);
    if (!oneCook.valid) {
      throw createSHCError("SHC-CART-001", oneCook.error || "One cook per cart violation");
    }

    // Min qty + allergen per item (simplified aggregate)
    for (const item of input.itemsWithMeta) {
      if (item.min_qty && item.quantity < item.min_qty) {
        const minCheck = validateMinQty(item.min_qty, item.quantity);
        if (!minCheck.valid) throw createSHCError("SHC-ORDER-001", minCheck.error || "Min qty fail");
      }
    }

    const ackCheck = validateAllergenAckForCheckout({ allergen_acked_at: input.allergenAck ? new Date().toISOString() : null });
    if (!ackCheck.valid) {
      throw createSHCError("SHC-ORDER-001", ackCheck.error || "Allergen ack required");
    }

    return new StepResponse({ valid: true });
  }
);

// Step: create shc_order_meta after Medusa order/cart complete succeeds
export const createShcOrderMetaStep = createStep(
  "create-shc-order-meta-step",
  async (input: { orderId: string; cookId: string; collectionDate: string; collectionSlot: string; paynowRef?: string; container: any }) => {
    const orderMetaService: ShcOrderMetaModuleService = input.container.resolve("shcOrderMeta");
    const meta = await orderMetaService.createOrUpdateMeta({
      order_id: input.orderId,
      cook_id: input.cookId,
      collection_date: input.collectionDate,
      collection_slot: input.collectionSlot,
      paynow_reference: input.paynowRef,
      shc_status: "paid", // initial after complete + pay
      allergen_acked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    return new StepResponse(meta);
  }
);

type CreateOrderWithMetaInput = {
  orderId: string;
  cookId: string;
  collectionDate: string;
  collectionSlot: string;
  paynowRef?: string;
  cartItems: any[];
  allergenAck: boolean;
  container?: any;
};

export const createOrderWithMetaWorkflow = createWorkflow(
  "create-order-with-meta-workflow",
  (input: CreateOrderWithMetaInput) => {
    validateCartRulesStep({
      cart: {}, // would receive full cart in prod
      itemsWithMeta: input.cartItems,
      allergenAck: input.allergenAck,
    });

    const shcMeta = createShcOrderMetaStep({
      orderId: input.orderId,
      cookId: input.cookId,
      collectionDate: input.collectionDate,
      collectionSlot: input.collectionSlot,
      paynowRef: input.paynowRef,
      container: input.container,
    } as any);

    // Phase 6 note: commission ledger auto-posts later on 'completed' state (via order-state-transition workflow + subscriber + weekly sim). Uses 15% static from business-rules + locked decisions.
    return new WorkflowResponse({ orderId: input.orderId, shcMeta });
  }
);

export default createOrderWithMetaWorkflow;
