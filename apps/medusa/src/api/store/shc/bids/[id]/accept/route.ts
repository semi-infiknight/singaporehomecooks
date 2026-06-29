import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import ShcBidModuleService from "../../../../../../modules/shc-bid/service";
import ShcRequestModuleService from "../../../../../../modules/shc-request/service";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import ShcNotificationModuleService from "../../../../../../modules/shc-notification/service";
import { orderStateTransitionWorkflow } from "../../../../../../workflows/order-state-transition";
import { emitShcEvent } from "../../../../../../lib/shc-event-bus";
import { getAuthContext, getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import { notifyOrderStatusPush } from "../../../../../../lib/shc-order-push";

/**
 * POST /store/shc/bids/:id/accept
 * Customer accepts a pending cook bid → request matched, order meta created (request-originated).
 */
const BodySchema = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    collection_slot: z.string().optional(),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: bidId } = req.params as { id: string };
  const bodyParse = BodySchema.safeParse(req.body || {});
  if (!bodyParse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Invalid accept payload", bodyParse.error.format() as any),
    });
  }
  const parsedBody = bodyParse.data;
  const bidService: ShcBidModuleService = req.scope.resolve("shcBid") as any;
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequest") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const logger = (req.scope as any).resolve?.("logger") || console;

  getAuthContext(req);
  let customerId: string | undefined;
  try {
    customerId = getCustomerId(req);
  } catch {
    /* cook-led accept still supported for ops/e2e */
  }
  const actor = customerId || (req as any).auth?.actor_id || "user-unknown";

  try {
    const bid = await bidService.getBid(bidId);
    if (!bid || bid.status !== "pending") {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", "Bid not pending or not found") });
    }
    const request = await reqService.getRequest(bid.request_id);
    if (!request) {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", "Request not found for bid") });
    }
    if (customerId && request.customer_id && request.customer_id !== customerId) {
      return unauthorized(res, "Request does not belong to this customer");
    }
    const effectiveCustomerId = customerId || request.customer_id;
    if (!effectiveCustomerId) {
      return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Customer login required to accept bid") });
    }

    const beforeBid = { ...bid };
    const accepted = await bidService.acceptBid(bidId);
    await reqService.updateRequestStatus(bid.request_id, "matched");

    const orderId = `SHC-${Date.now().toString().slice(-8)}`;
    const collDate = parsedBody.collection_date || request.date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const collSlot = parsedBody.collection_slot || "18:00-19:00";
    const partySize = request.party_size || 1;
    const totalCents = bid.price_cents || request.budget_cents || 0;
    const items = [
      {
        product_id: `req_${bid.request_id}`,
        name: (request.body || "Custom dish request").slice(0, 120),
        qty: partySize,
        price: totalCents > 0 ? Math.round(totalCents / partySize) / 100 : 0,
      },
    ];

    await metaService.createOrUpdateMeta({
      order_id: orderId,
      cook_id: bid.cook_id,
      customer_id: effectiveCustomerId,
      collection_date: collDate,
      collection_slot: collSlot,
      shc_status: "paid" as SHCOrderStatus,
      origin_request_id: bid.request_id,
      allergen_acked_at: new Date().toISOString(),
      items,
      total_cents: totalCents,
    } as any);

    await metaService.addOrderMessage(
      orderId,
      "cook",
      bid.cook_id,
      "Bid accepted — I'll prepare your custom dish. Collection details released 2h before slot."
    );

    await orderStateTransitionWorkflow
      .run({ input: { orderId, to: "paid" as SHCOrderStatus, container: req.scope } as any })
      .catch(() => {});

    await notifService.push(effectiveCustomerId, {
      type: "order",
      body: `Order ${orderId} confirmed from your dish request.`,
    });
    await notifService.push(bid.cook_id, {
      type: "order",
      body: `Your bid was accepted — order ${orderId} is now active.`,
    });
    await notifyOrderStatusPush(req.scope, orderId, "paid", logger);

    const audit = {
      ts: new Date().toISOString(),
      actor,
      action: "bid.accept",
      before: { bid: beforeBid },
      after: { bid: accepted, order_id: orderId, request_id: bid.request_id, customer_id: effectiveCustomerId },
    };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    await emitShcEvent(req.scope, "shc.bid.accepted", {
      bidId,
      orderId,
      requestId: bid.request_id,
      cookId: bid.cook_id,
      customerId: effectiveCustomerId,
    });

    const order = {
      id: orderId,
      cook_id: bid.cook_id,
      customer_id: effectiveCustomerId,
      items,
      shc_status: "paid" as SHCOrderStatus,
      collection_date: collDate,
      collection_slot: collSlot,
      total: totalCents,
      origin_request_id: bid.request_id,
    };

    res.json({
      ok: true,
      bid: accepted,
      order_id: orderId,
      order,
      shc_meta: { origin_request_id: bid.request_id, customer_id: effectiveCustomerId, total_cents: totalCents },
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "Accept bid failed") });
  }
}
