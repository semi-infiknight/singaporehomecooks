import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { businessRulesCommissionRate } from "@shc/utils";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";
import { getCookId } from "../../../../lib/shc-actors";
import { loadBusinessRulesConfigFromScope } from "../../../../lib/shc-business-rules-config";

const QuerySchema = z.object({
  cook_id: z.string().optional(),
}).strict();

/** GET /store/shc/earnings — cook earnings summary (ledger-backed, completed orders only). */
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
  const rulesConfig = await loadBusinessRulesConfigFromScope(req.scope);
  const commissionRatePct = Math.round(businessRulesCommissionRate(rulesConfig) * 10000) / 100;

  const [metas] = await metaService.listAndCountOrderMetas({ cook_id: cookId } as any, { take: 100 });
  const completed = (metas || []).filter((m: any) => m.shc_status === "completed");
  const orderIds = completed.map((m: any) => m.order_id);
  const summary = orderIds.length
    ? await ledgerService.getLedgerSummaryForOrders(orderIds)
    : { totalCookEarnings: 0, totalPlatformFees: 0, entries: [] };

  const thisWeekCents = summary.totalCookEarnings;
  const platformFeeCents = summary.totalPlatformFees;
  const grossCents = thisWeekCents + platformFeeCents;

  res.json({
    cook_id: cookId,
    this_week_cents: thisWeekCents,
    projected_payout_cents: thisWeekCents,
    gross_cents: grossCents,
    platform_fee_cents: platformFeeCents,
    orders_count: completed.length,
    commission_rate_pct: commissionRatePct,
    // Backward-compatible aliases (dollars for legacy clients that treated thisWeek as dollars)
    thisWeek: thisWeekCents / 100,
    projectedPayout: thisWeekCents / 100,
    gross: grossCents / 100,
    net: thisWeekCents / 100,
    ledgerPreview: summary.entries?.slice(0, 5) || [],
  });
}
