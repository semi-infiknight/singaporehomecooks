import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import {
  businessRulesCommissionRate,
  cookHasPaynowConfigured,
  getNextPayoutMondayIso,
  getSingaporeWeekBounds,
  isWithinSingaporeWeek,
} from "@shc/utils";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";
import ShcPayoutBatchModuleService from "../../../../modules/shc-payout-batch/service";
import ShcCookModuleService from "../../../../modules/shc-cook/service";
import { getCookId } from "../../../../lib/shc-actors";
import { loadBusinessRulesConfigFromScope } from "../../../../lib/shc-business-rules-config";

const QuerySchema = z
  .object({
    cook_id: z.string().optional(),
  })
  .strict();

function orderCompletedAt(meta: any): Date | null {
  const raw = meta?.updated_at || meta?.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** GET /store/shc/earnings — cook earnings summary (ledger-backed, Mon–Sun accrual window). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any) });
  }
  let cookId = parse.data.cook_id;
  try {
    cookId = cookId || getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedger") as any;
  const payoutService: ShcPayoutBatchModuleService = req.scope.resolve("shcPayoutBatch") as any;
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const rulesConfig = await loadBusinessRulesConfigFromScope(req.scope);
  const commissionRatePct = Math.round(businessRulesCommissionRate(rulesConfig) * 10000) / 100;

  const weekBounds = getSingaporeWeekBounds();
  const [metas] = await metaService.listAndCountOrderMetas({ cook_id: cookId } as any, { take: 500 });
  const completed = (metas || []).filter((m: any) => m.shc_status === "completed");
  const thisWeekCompleted = completed.filter((m: any) => {
    const at = orderCompletedAt(m);
    return at ? isWithinSingaporeWeek(at, weekBounds) : false;
  });
  const thisWeekOrderIds = thisWeekCompleted.map((m: any) => m.order_id);
  const allCompletedOrderIds = completed.map((m: any) => m.order_id);

  const weekSummary = thisWeekOrderIds.length
    ? await ledgerService.getLedgerSummaryForOrders(thisWeekOrderIds)
    : { totalCookEarnings: 0, totalPlatformFees: 0, entries: [] };
  const pendingSummary = allCompletedOrderIds.length
    ? await ledgerService.getCookEarningsSummaryForOrders(allCompletedOrderIds, { unbatchedOnly: true })
    : { totalCookEarnings: 0, totalPlatformFees: 0, entries: [] };

  const thisWeekCents = weekSummary.totalCookEarnings;
  const pendingPayoutCents = pendingSummary.totalCookEarnings;
  const platformFeeCents = weekSummary.totalPlatformFees;
  const grossCents = thisWeekCents + platformFeeCents;

  const [cookRows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cookRows as any[])?.[0];
  const paynowConfigured = cookHasPaynowConfigured(cook);

  const lastLine = await payoutService.getLastCookPayoutLine(cookId);
  const lastPayout = lastLine
    ? {
        amount_cents: Number(lastLine.amount_cents || 0),
        transfer_ref: lastLine.transfer_ref || lastLine.batch_transfer_ref || null,
        paid_at: lastLine.batch_approved_at || lastLine.updated_at || null,
        week_start: lastLine.batch_week_start || null,
      }
    : null;

  const nextPayout = {
    scheduled_day: "Mon",
    pending_cents: pendingPayoutCents,
    week_start: getNextPayoutMondayIso(),
  };

  res.json({
    cook_id: cookId,
    this_week_cents: thisWeekCents,
    projected_payout_cents: pendingPayoutCents,
    pending_payout_cents: pendingPayoutCents,
    gross_cents: grossCents,
    platform_fee_cents: platformFeeCents,
    orders_count: thisWeekCompleted.length,
    commission_rate_pct: commissionRatePct,
    paynow_configured: paynowConfigured,
    week_start: weekBounds.weekStartIso,
    last_payout: lastPayout,
    next_payout: nextPayout,
    // Backward-compatible aliases (dollars for legacy clients)
    thisWeek: thisWeekCents / 100,
    projectedPayout: pendingPayoutCents / 100,
    gross: grossCents / 100,
    net: thisWeekCents / 100,
    ledgerPreview: weekSummary.entries?.slice(0, 5) || [],
  });
}
