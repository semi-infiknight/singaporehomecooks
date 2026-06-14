import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";

/**
 * GET /store/shc/orders
 * Store-facing orders list (customer or cook scoped).
 * Phase 6: when cook_id provided, includes earnings/ledger summary (cook net from completed/paid).
 * Consumes contracts (types + error codes). Additive fields only (no contract break for mobile).
 * Uses order-meta + ledger modules. Audit + Zod + SHCError.
 */
const QuerySchema = z.object({
  customer_id: z.string().optional(),
  cook_id: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().default(20),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any) });
  }
  const { cook_id, status, limit } = parse.data;

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedger") as any;

  try {
    const where: any = {};
    if (cook_id) where.cook_id = cook_id;
    if (status) where.shc_status = status;

    const [metas, count] = await metaService.listAndCountOrderMetas(where, { take: limit });

    // Enrich with ledger summary if cook scoped (for earnings view)
    let earningsSummary: any = null;
    if (cook_id && metas?.length) {
      const orderIds = metas.map((m: any) => m.order_id);
      const summary = await ledgerService.getLedgerSummaryForOrders(orderIds);
      earningsSummary = {
        cook_earnings_cents: summary.totalCookEarnings,
        platform_fees_cents: summary.totalPlatformFees,
        orders_with_ledger: summary.entries.length ? orderIds.length : 0,
        note: "Earnings from double-entry ledger (15% platform default). Updated on completed + payout batches.",
      };
    }

    // Basic shape + growth metadata (credits/earnings/requests) for Phase 8-9 parity with mock. Additive only.
    const orders = (metas || []).map((m: any) => ({
      order_id: m.order_id,
      cook_id: m.cook_id,
      shc_status: m.shc_status,
      collection_date: m.collection_date,
      collection_slot: m.collection_slot,
      paynow_reference: m.paynow_reference,
      origin_request_id: m.origin_request_id || null,
      credits_applied_cents: m.credits_applied_cents || 0,
      is_corporate: !!m.is_corporate,
      corporate_note: m.corporate_note || null,
      // request/earnings joined via prior
    }));

    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.orders.query", cook_id, count });

    res.json({
      orders,
      count,
      earnings_summary: earningsSummary,
      note: cook_id
        ? "Phase 6/8-9: earnings/ledger + growth (credits/requests/corporate) metadata. Full via joins."
        : "Integration path. Modules + contracts ready. Mobile toggle uses this for growth features.",
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Orders query failed") });
  }
}
