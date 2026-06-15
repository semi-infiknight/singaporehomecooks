import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";
import { getCookId } from "../../../../lib/shc-actors";

const QuerySchema = z.object({
  cook_id: z.string().optional(),
}).strict();

/** GET /store/shc/earnings — cook earnings summary */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any) });
  }
  let cookId = parse.data.cook_id;
  try {
    cookId = cookId || getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedger") as any;
  const [metas] = await metaService.listAndCountOrderMetas({ cook_id: cookId } as any, { take: 100 });
  const completed = (metas || []).filter((m: any) => m.shc_status === "completed" || m.shc_status === "paid");
  const orderIds = completed.map((m: any) => m.order_id);
  const summary = orderIds.length ? await ledgerService.getLedgerSummaryForOrders(orderIds) : { totalCookEarnings: 0, totalPlatformFees: 0, entries: [] };
  res.json({
    cook_id: cookId,
    thisWeek: summary.totalCookEarnings,
    projectedPayout: summary.totalCookEarnings,
    gross: summary.totalCookEarnings + summary.totalPlatformFees,
    net: summary.totalCookEarnings,
    orders_count: completed.length,
    ledgerPreview: summary.entries?.slice(0, 5) || [],
  });
}