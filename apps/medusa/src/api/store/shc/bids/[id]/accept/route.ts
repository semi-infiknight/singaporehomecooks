import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import ShcBidModuleService from "../../../../../../modules/shc-bid/service";
import ShcRequestModuleService from "../../../../../../modules/shc-request/service";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import ShcNotificationModuleService from "../../../../../../modules/shc-notification/service";
import { emitShcEvent } from "../../../../../../lib/shc-event-bus";
import { getAuthContext, getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import {
  buildOrderLinesFromQuote,
  parseQuoteLinesJson,
  validateCustomerAcceptSelection,
} from "../../../../../../lib/shc-quote-lines";

/**
 * POST /store/shc/bids/:id/accept
 * Customer accepts a pending cook quote → request matched, order meta created (awaiting PayNow).
 * Optional accepted_line_ids[] for partial accept (subset of cook-included dishes).
 */
const BodySchema = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    collection_slot: z.string().optional(),
    accepted_line_ids: z.array(z.string()).min(1).max(12).optional(),
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

    const quoteLines = parseQuoteLinesJson((bid as any).line_items_json);
    const selection = validateCustomerAcceptSelection(quoteLines, parsedBody.accepted_line_ids);
    if (!selection.ok) {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", selection.message) });
    }

    const beforeBid = { ...bid };
    const accepted = await bidService.acceptBid(bidId);
    const rejectedCount = await bidService.rejectPendingBidsForRequest(bid.request_id, bidId);
    await reqService.updateRequestStatus(bid.request_id, "matched");

    const orderId = `SHC-${Date.now().toString().slice(-8)}`;
    const collDate = parsedBody.collection_date || request.date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const collSlot = parsedBody.collection_slot || "18:00-19:00";
    const totalCents = selection.total_cents;

    const items = buildOrderLinesFromQuote(
      {
        items_json: (request as any).items_json,
        body: request.body,
        party_size: request.party_size,
        request_id: bid.request_id,
      },
      { price_cents: totalCents, line_items_json: (bid as any).line_items_json },
      bid.request_id,
      parsedBody.accepted_line_ids
    );

    await metaService.createOrUpdateMeta({
      order_id: orderId,
      cook_id: bid.cook_id,
      customer_id: effectiveCustomerId,
      collection_date: collDate,
      collection_slot: collSlot,
      // Cook already quoted — customer pays after accepting the quote
      shc_status: "accepted" as SHCOrderStatus,
      origin_request_id: bid.request_id,
      allergen_acked_at: new Date().toISOString(),
      items,
      total_cents: totalCents,
    } as any);

    await metaService.addOrderMessage(
      orderId,
      "cook",
      bid.cook_id,
      "Quote accepted — complete PayNow to confirm. Collection details released 2h before slot once paid."
    );

    await notifService.push(effectiveCustomerId, {
      type: "order",
      body: `Complete PayNow for order ${orderId} — your cook confirmed the quote.`,
    });
    await notifService.push(bid.cook_id, {
      type: "order",
      body: `Your quote was accepted — order ${orderId} awaits customer PayNow.`,
    });

    const audit = {
      ts: new Date().toISOString(),
      actor,
      action: "bid.accept",
      before: { bid: beforeBid },
      after: {
        bid: accepted,
        order_id: orderId,
        request_id: bid.request_id,
        customer_id: effectiveCustomerId,
        accepted_line_ids: parsedBody.accepted_line_ids || selection.lines.map((l) => l.request_line_id),
        rejected_sibling_quotes: rejectedCount,
        total_cents: totalCents,
      },
    };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    await emitShcEvent(req.scope, "shc.bid.accepted", {
      bidId,
      orderId,
      requestId: bid.request_id,
      cookId: bid.cook_id,
      customerId: effectiveCustomerId,
      acceptedLineIds: parsedBody.accepted_line_ids,
      rejectedSiblingQuotes: rejectedCount,
    });

    const order = {
      id: orderId,
      cook_id: bid.cook_id,
      customer_id: effectiveCustomerId,
      items,
      shc_status: "accepted" as SHCOrderStatus,
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
      requires_paynow: true,
      rejected_sibling_quotes: rejectedCount,
      shc_meta: { origin_request_id: bid.request_id, customer_id: effectiveCustomerId, total_cents: totalCents },
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "Accept bid failed") });
  }
}
