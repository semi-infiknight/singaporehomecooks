import {
  buildPayoutInvoice,
  getWeekBoundsFromStartIso,
  type PayoutInvoiceDoc,
} from "@shc/utils";
import { calculatePlatformFee, DEFAULT_COMMISSION_RATE } from "@shc/business-rules";
import { cookSupplierFromProfile } from "./shc-order-invoice-build";

export async function buildPayoutInvoiceForCook(
  scope: any,
  batchId: string,
  cookId: string
): Promise<PayoutInvoiceDoc | null> {
  const ledgerService = scope.resolve("shcLedger") as any;
  const metaService = scope.resolve("shcOrderMeta") as any;
  const payoutService = scope.resolve("shcPayoutBatch") as any;
  const cookSvc = scope.resolve("shcCook") as any;

  const batches = await payoutService.listPayoutBatches({ limit: 200 });
  const batch = (batches || []).find((b: any) => String(b.id) === String(batchId));
  if (!batch) return null;

  const entries = await ledgerService.listLedgerEntries({ batch_id: batchId, limit: 500 });
  const [metas] = await metaService.listAndCountOrderMetas({ cook_id: cookId } as any, { take: 500 });
  const cookOrderIds = new Set(
    (metas || []).filter((m: any) => m.shc_status === "completed").map((m: any) => String(m.order_id))
  );
  const cookEntries = (entries || []).filter(
    (e: any) =>
      e.debit_account === "Cook-Earnings-Payable" &&
      e.order_id &&
      cookOrderIds.has(String(e.order_id))
  );
  if (!cookEntries.length) return null;

  const [cooks] = await cookSvc.listAndCountCooks({ id: cookId } as any, { take: 1 });
  const cook = cooks?.[0] as any;
  const supplier = cookSupplierFromProfile(cook);

  const lines: Array<{ description: string; qty: number; unit_cents: number; line_cents: number; order_id?: string }> =
    [];
  let grossOrderCents = 0;
  let netPayoutCents = 0;

  for (const entry of cookEntries) {
    const orderId = String(entry.order_id || "");
    const earnCents = Number(entry.amount_cents || 0);
    netPayoutCents += earnCents;
    let orderTotal = 0;
    let label = orderId || "Completed order";
    if (orderId) {
      const data = await metaService.getOrderMetaWithMessages(orderId);
      const m = data.meta as any;
      if (m) {
        orderTotal =
          m.total_cents != null && Number(m.total_cents) > 0
            ? Math.round(Number(m.total_cents))
            : m.total != null && Number(m.total) > 0
              ? Math.round(Number(m.total) * 100)
              : 0;
        const dish = (m.items || []).map((it: any) => it.name).filter(Boolean).join(", ");
        label = dish ? `${dish} · ${orderId}` : orderId;
      }
    }
    if (orderTotal <= 0 && earnCents > 0) {
      orderTotal = Math.round(earnCents / (1 - DEFAULT_COMMISSION_RATE));
    }
    grossOrderCents += orderTotal;
    lines.push({
      description: label,
      qty: 1,
      unit_cents: earnCents,
      line_cents: earnCents,
      order_id: orderId || undefined,
    });
  }

  const platformFeeCents = Math.max(0, grossOrderCents - netPayoutCents);
  const weekBounds = getWeekBoundsFromStartIso(String(batch.week_start || ""));

  return buildPayoutInvoice({
    batch_id: batchId,
    week_start: String(batch.week_start || ""),
    week_end: weekBounds.weekEnd.toISOString().slice(0, 10),
    cook: {
      cook_id: cookId,
      legal_name: supplier.legal_name,
      paynow_mobile: cook?.paynow_mobile || null,
      paynow_uen: cook?.paynow_uen || null,
      area: cook?.area || null,
    },
    lines,
    gross_order_cents: grossOrderCents,
    platform_fee_cents: platformFeeCents || calculatePlatformFee(grossOrderCents, DEFAULT_COMMISSION_RATE),
    net_payout_cents: netPayoutCents,
    transfer_ref: batch.transfer_ref || null,
    status: batch.status || null,
    paid_at:
      batch.approved_at instanceof Date
        ? batch.approved_at.toISOString()
        : batch.approved_at || batch.updated_at || null,
  });
}
