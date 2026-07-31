import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../../../../../modules/shc-ledger/service";
import ShcPayoutBatchModuleService from "../../../../../modules/shc-payout-batch/service";
import { getCookId } from "../../../../../lib/shc-actors";

/** GET /store/shc/earnings/payouts — cook payout history (ledger-backed batches). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedger") as any;
  const payoutService: ShcPayoutBatchModuleService = req.scope.resolve("shcPayoutBatch") as any;

  const [metas] = await metaService.listAndCountOrderMetas({ cook_id: cookId } as any, { take: 500 });
  const orderIds = (metas || [])
    .filter((m: any) => m.shc_status === "completed")
    .map((m: any) => m.order_id);

  const batchTotals = new Map<string, { amount_cents: number; order_count: number }>();
  for (const orderId of orderIds) {
    const entries = await ledgerService.listLedgerEntries({ order_id: orderId });
    for (const entry of entries) {
      if (entry.debit_account !== "Cook-Earnings-Payable" || !entry.batch_id) continue;
      const current = batchTotals.get(entry.batch_id) || { amount_cents: 0, order_count: 0 };
      current.amount_cents += Number(entry.amount_cents || 0);
      current.order_count += 1;
      batchTotals.set(entry.batch_id, current);
    }
  }

  const batches = await payoutService.listPayoutBatches({ limit: 100 });
  const payouts = [...batchTotals.entries()]
    .map(([batchId, totals]) => {
      const batch = batches.find((b: any) => b.id === batchId);
      if (!batch) return null;
      return {
        batch_id: batchId,
        week_start: batch.week_start,
        status: batch.status,
        amount_cents: totals.amount_cents,
        order_count: totals.order_count,
        transfer_ref: batch.transfer_ref || null,
        paid_at: batch.approved_at || batch.updated_at || null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => String(b.week_start).localeCompare(String(a.week_start)));

  res.json({ cook_id: cookId, payouts });
}
