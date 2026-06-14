import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import ShcBidModuleService from "../../../../../../modules/shc-bid/service";
import ShcRequestModuleService from "../../../../../../modules/shc-request/service";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { orderStateTransitionWorkflow } from "../../../../../../workflows/order-state-transition";

/**
 * POST /store/shc/bids/:id/accept
 * Cook or customer accepts bid -> mark accepted, request matched, create shc_order_meta (request-originated).
 * Supports growth flow: spins order from bid. Full audit, events, ledger tie via complete later.
 * In prod: creates real cart/order; here meta + stub order ref. Emits for notif.
 */
const BodySchema = z.object({
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  collection_slot: z.string().optional(),
}).strict().optional();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: bidId } = req.params as { id: string };
  const bodyParse = (BodySchema || z.object({}).strict()).safeParse(req.body || {});
  if (!bodyParse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid accept payload", (bodyParse as any).error?.format?.() as any) });
  }
  const parsedBody = bodyParse.success ? bodyParse.data : {};
  const bidService: ShcBidModuleService = req.scope.resolve("shcBidService") as any;
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequestService") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMetaService") as any;
  const actor = (req as any).auth?.actor_id || "user-unknown";
  try {
    const bid = await bidService.getBid(bidId);
    if (!bid || bid.status !== "pending") {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", "Bid not pending or not found") });
    }
    const beforeBid = { ...bid };
    const accepted = await bidService.acceptBid(bidId);
    const request = await reqService.getRequest(bid.request_id);
    if (request) {
      await reqService.updateRequestStatus(bid.request_id, "matched");
    }
    // Create request-originated order meta (growth flow). Real order creation delegated to complete/cart in full.
    const orderId = `SHC-REQ-${bidId.slice(-8)}`;
    const collDate = (parsedBody as any)?.collection_date || request?.date || "2026-07-01";
    const collSlot = (parsedBody as any)?.collection_slot || "18:00-19:00";
    await metaService.createOrUpdateMeta({
      order_id: orderId,
      cook_id: bid.cook_id,
      collection_date: collDate,
      collection_slot: collSlot,
      shc_status: "paid" as SHCOrderStatus,
      origin_request_id: bid.request_id,
      allergen_acked_at: new Date().toISOString(),
    } as any);
    // Transition to record
    await orderStateTransitionWorkflow.run({ input: { orderId, to: "paid" as SHCOrderStatus, container: req.scope } as any }).catch(() => {});
    const logger = (req.scope as any).resolve?.("logger") || console;
    const audit = {
      ts: new Date().toISOString(),
      actor,
      action: "bid.accept",
      before: { bid: beforeBid },
      after: { bid: accepted, order_id: orderId, request_id: bid.request_id },
    };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    const eventBus = req.scope.resolve("eventBusService") as any;
    await eventBus.emit("shc.bid.accepted", { bidId, orderId, requestId: bid.request_id, cookId: bid.cook_id });
    res.json({ ok: true, bid: accepted, order_id: orderId, shc_meta: { origin_request_id: bid.request_id } });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "Accept bid failed") });
  }
}
