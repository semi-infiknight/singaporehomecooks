import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";

/**
 * GET /admin/shc/ledger?order_id=xxx&cook_id=yyy
 * Query ledger entries (double-entry). Supports filter by order or cook (enriches via order_meta).
 * Uses Zod + SHC errors. Audit logged. Mobile later uses similar /store/shc for cook earnings.
 */
const QuerySchema = z.object({
  order_id: z.string().optional(),
  cook_id: z.string().optional(),
  batch_id: z.string().optional(),
  limit: z.coerce.number().default(50),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad ledger query", parse.error.format() as any) });
  }
  const { order_id, cook_id, batch_id, limit } = parse.data;

  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedgerService") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMetaService") as any;

  try {
    let entries: any[] = [];
    let summary = { totalCookEarnings: 0, totalPlatformFees: 0 };

    if (order_id) {
      entries = await ledgerService.listLedgerEntries({ order_id, limit });
      const s = await ledgerService.getLedgerSummaryForOrders([order_id]);
      summary = { totalCookEarnings: s.totalCookEarnings, totalPlatformFees: s.totalPlatformFees };
    } else if (cook_id) {
      // Enrich: find orders for cook, then their ledgers
      const metas = await metaService.listOrderMetas({ filters: { cook_id }, take: 200 } as any);
      const orderIds = (metas || []).map((m: any) => m.order_id).filter(Boolean);
      if (orderIds.length) {
        entries = await ledgerService.listLedgerEntries({ limit });
        // Filter client side for those orders (MVP)
        entries = entries.filter((e: any) => orderIds.includes(e.order_id));
        const s = await ledgerService.getLedgerSummaryForOrders(orderIds);
        summary = { totalCookEarnings: s.totalCookEarnings, totalPlatformFees: s.totalPlatformFees };
      }
    } else if (batch_id) {
      entries = await ledgerService.listLedgerEntries({ batch_id, limit });
    } else {
      // Broad recent
      entries = await ledgerService.listLedgerEntries({ limit });
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "admin.ledger.query", actor: "admin", order_id, cook_id, batch_id, count: entries.length });

    res.json({
      entries,
      count: entries.length,
      summary,
      filters: { order_id, cook_id, batch_id },
      note: "Double-entry: each entry debits one account, credits another. Use weekly-payout.ts or payment-confirm to populate.",
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-LEDGER-001", e.message || "Ledger query failed") });
  }
}
