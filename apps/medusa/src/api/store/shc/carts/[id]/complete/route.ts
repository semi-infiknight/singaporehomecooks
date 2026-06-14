import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import { createOrderWithMetaWorkflow } from "../../../../../../workflows/create-order-with-meta";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";

/**
 * POST /store/shc/carts/:id/complete
 * Override-style complete that:
 * - Validates one-cook, min_qty, allergen_ack via business-rules + contracts
 * - Creates shc_order_meta (status paid on success)
 * - Delegates to core cart complete (or runs equivalent)
 * Production: protect with publishable key + customer auth.
 */
const BodySchema = z.object({
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  collection_slot: z.string(),
  paynow_reference: z.string().optional(),
  allergen_acked: z.boolean().default(false),
  pdpa_consent: z.boolean().default(true),
  creditsToApply: z.number().int().min(0).default(0).optional(),
  isCorporate: z.boolean().default(false).optional(),
  corporate_note: z.string().optional(),
  origin_request_id: z.string().optional(),
  // In real, cart already has line_items; we derive cook from first
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: cartId } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid complete payload", parse.error.format() as any) });
  }
  const { collection_date, collection_slot, paynow_reference, allergen_acked, pdpa_consent, creditsToApply = 0, isCorporate = false, origin_request_id, corporate_note } = parse.data;

  const cartService = req.scope.resolve("cartService") as any;
  const orderService = req.scope.resolve("orderService") as any; // after complete
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMetaService") as any;

  try {
    // Fetch cart + items (MVP enrichment)
    const cart = await cartService.retrieveCart(cartId, { relations: ["items"] });
    if (!cart.items?.length) {
      return res.status(400).json({ error: createSHCError("SHC-CART-001", "Empty cart") });
    }

    // Derive cook_id from product meta of first item (enforce one-cook already in rule)
    const productMetaService = req.scope.resolve("shcProductMetaService") as any;
    const firstItem = cart.items[0];
    const meta = await productMetaService.getMetaForProduct(firstItem.product_id || firstItem.variant?.product_id);
    const cookId = meta?.cook_id || "cook_unknown";

    // Run our workflow (validates rules + creates meta)
    const { result } = await createOrderWithMetaWorkflow.run({
      input: {
        // For Wave1 we pass order later; workflow will create meta on success path
        orderId: "pending", // replaced after actual complete
        cookId,
        collectionDate: collection_date,
        collectionSlot: collection_slot,
        paynowRef: paynow_reference,
        cartItems: cart.items.map((i: any) => ({
          cook_id: cookId,
          product_id: i.product_id,
          quantity: i.quantity,
          min_qty: meta?.min_qty || 1,
        })),
        allergenAck: allergen_acked,
        container: req.scope,
      } as any,
    });

    // Growth support (exact mock parity): credits redemption, request-originated, corporate flag. One-cook/allergen/PDPA/min-qty already in workflow.
    let creditsApplied = 0;
    if (creditsToApply > 0) {
      try {
        const credService = req.scope.resolve("shcCreditWalletService") as any;
        const r = await credService.redeemCredits("cust_demo", creditsToApply, req.scope);
        creditsApplied = r.used || creditsToApply;
        // Ledger redemption already posted inside credit service.
      } catch (e) { /* non-blocking */ }
    }

    // Now perform core complete (or in full compose core completeCartWorkflow)
    // Simplified: call order creation from cart
    const order = await orderService.createOrderFromCart({ cart_id: cartId });
    // Update meta with real order id + full growth metadata for /store/shc/orders
    await metaService.createOrUpdateMeta({
      order_id: order.id,
      cook_id: cookId,
      collection_date,
      collection_slot,
      paynow_reference,
      shc_status: "paid" as SHCOrderStatus,
      allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
      pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
      pdpa_consent_version: pdpa_consent ? 'v1.0-pdpa-2025' : undefined,
      origin_request_id,
      credits_applied_cents: creditsApplied || undefined,
      is_corporate: !!isCorporate,
      corporate_note: corporate_note || (isCorporate ? 'Corporate/group order from checkout per Phase 8.' : undefined),
    } as any);

    // Emit custom for subscriber (growth + credits earn later on complete)
    const eventBus = req.scope.resolve("eventBusService") as any;
    await eventBus.emit("shc.order.state_changed", { orderId: order.id, from: "cart", to: "paid", creditsApplied, isCorporate, origin_request_id });

    res.json({ order, shc_meta: await metaService.getOrderMetaWithMessages(order.id), credits_applied: creditsApplied, corporate: !!isCorporate });
  } catch (err: any) {
    const code = err.code || "SHC-GENERIC-001";
    return res.status(400).json({ error: createSHCError(code as any, err.message || "Complete failed", { details: err }) });
  }
}
