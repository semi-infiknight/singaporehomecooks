import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcBidModuleService from "../../../../modules/shc-bid/service";
import ShcRequestModuleService from "../../../../modules/shc-request/service";
import { getAuthContext, getCookId } from "../../../../lib/shc-actors";
import { emitShcEvent } from "../../../../lib/shc-event-bus";
import { parseRequestLines, validateAndNormalizeQuoteLines } from "../../../../lib/shc-quote-lines";

/**
 * GET /store/shc/bids?cook_id=... or ?request_id=...
 * List bids for cook (collab board) or for request.
 * POST /store/shc/bids
 * Create bid for a request (cook). Updates request to bidding. Zod, SHCError, audit, event.
 */
const QuoteLineSchema = z
  .object({
    request_line_id: z.string(),
    included: z.boolean(),
    servings: z.number().int().positive().optional(),
    price_cents: z.number().int().nonnegative(),
  })
  .strict();

const CreateBidSchema = z
  .object({
    request_id: z.string(),
    price_cents: z.number().int().positive().optional(),
    message: z.string().optional(),
    line_items: z.array(QuoteLineSchema).min(1).max(12).optional(),
  })
  .strict();

const QuerySchema = z.object({
  request_id: z.string().optional(),
  cook_id: z.string().optional(),
  limit: z.coerce.number().default(50),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad bids query", parse.error.format() as any) });
  }
  const bidService: ShcBidModuleService = req.scope.resolve("shcBid") as any;
  try {
    let bids: any[] = [];
    if (parse.data.request_id) {
      bids = await bidService.listBidsForRequest(parse.data.request_id);
    } else if (parse.data.cook_id) {
      bids = await bidService.listBidsForCook(parse.data.cook_id);
    } else {
      // broad recent for admin-ish; in prod scope to actor
      bids = [];
    }
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.bids.list", count: bids.length });
    res.json({ bids, count: bids.length });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "List bids failed") });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateBidSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid bid payload", parse.error.format() as any) });
  }
  getAuthContext(req);
  const bidService: ShcBidModuleService = req.scope.resolve("shcBid") as any;
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequest") as any;
  const actor = getCookId(req);
  try {
    const request = await reqService.getRequest(parse.data.request_id);
    if (!request) {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", "Request not found") });
    }
    const requestLines = parseRequestLines((request as any).items_json);
    const normalized = validateAndNormalizeQuoteLines(
      requestLines,
      parse.data.line_items,
      parse.data.price_cents || 0
    );
    if (!normalized.ok) {
      return res.status(400).json({ error: createSHCError("SHC-REQ-001", normalized.message) });
    }

    const before = { request_id: parse.data.request_id };
    const bidPayload: Record<string, unknown> = {
      request_id: parse.data.request_id,
      cook_id: actor,
      price_cents: normalized.price_cents,
      message: parse.data.message,
    };
    if (normalized.line_items_json) {
      bidPayload.line_items_json = normalized.line_items_json;
    }
    const bid = await bidService.createBid(bidPayload as any);
    // update request status to bidding
    await reqService.updateRequestStatus(parse.data.request_id, "bidding").catch(() => {});
    const logger = (req.scope as any).resolve?.("logger") || console;
    const audit = { ts: new Date().toISOString(), actor, action: "bid.create", before, after: bid };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    await emitShcEvent(req.scope, "shc.bid.created", { bidId: bid.id, requestId: parse.data.request_id, cookId: actor });
    res.status(201).json({ bid });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "Create bid failed") });
  }
}
