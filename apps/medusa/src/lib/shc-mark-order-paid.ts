/**
 * Shared "payment received" path — used by admin payment-confirm and HitPay webhook.
 */
import type { MedusaContainer } from "@medusajs/framework/types";
import { SHCOrderStatus } from "@shc/types";
import { orderStateTransitionWorkflow } from "../workflows/order-state-transition";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcLedgerModuleService from "../modules/shc-ledger/service";

export async function markOrderPaid(
  container: MedusaContainer | any,
  input: {
    order_id: string;
    paynow_reference: string;
    actor?: string;
    notes?: string;
  }
): Promise<{ success: boolean; total_cents: number; already_paid?: boolean; meta?: any }> {
  const order_id = String(input.order_id || "").trim();
  const paynow_reference = String(input.paynow_reference || "").trim();
  if (!order_id || paynow_reference.length < 3) {
    throw new Error("order_id and paynow_reference required");
  }

  const metaService: ShcOrderMetaModuleService = container.resolve("shcOrderMeta") as any;
  const existing = await metaService.getOrderMetaWithMessages(order_id);
  const prevStatus = (existing?.meta as any)?.shc_status;
  const prevRef = (existing?.meta as any)?.paynow_reference;

  // Idempotent: already paid with same (or any) ref
  if (prevStatus === "paid" || prevStatus === "accepted" || prevStatus === "preparing" ||
      prevStatus === "ready_for_collection" || prevStatus === "collected" || prevStatus === "completed") {
    if (prevRef && String(prevRef) === paynow_reference) {
      return { success: true, total_cents: 0, already_paid: true, meta: existing };
    }
    // Already past paid — still refresh ref if empty
    if (prevStatus !== "cart" && prevStatus !== "paid") {
      return { success: true, total_cents: 0, already_paid: true, meta: existing };
    }
  }

  await metaService.createOrUpdateMeta({
    order_id,
    paynow_reference,
    address_released_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
  } as any);

  await orderStateTransitionWorkflow
    .run({
      input: { orderId: order_id, to: "paid" as SHCOrderStatus, container },
    } as any)
    .catch(() => null);

  let totalCents = 0;
  try {
    const data = await metaService.getOrderMetaWithMessages(order_id);
    const m = data?.meta as any;
    if (m?.total_cents != null && Number(m.total_cents) > 0) {
      totalCents = Math.round(Number(m.total_cents));
    } else if (m?.total != null && Number(m.total) > 0) {
      totalCents = Math.round(Number(m.total) * 100);
    }
  } catch {
    /* optional */
  }

  if (totalCents <= 0) {
    try {
      const orderService = container.resolve("order") as any;
      const order = await orderService.retrieveOrder(order_id, { relations: ["items"] });
      if (order?.items?.length) {
        totalCents = order.items.reduce((sum: number, item: any) => {
          const price = item.unit_price || item.raw_unit_price?.value || 0;
          return sum + price * (item.quantity || 1);
        }, 0);
      } else if (order?.total) {
        totalCents = Math.floor(Number(order.total));
      }
    } catch {
      totalCents = 0;
    }
  }

  if (totalCents > 0) {
    try {
      const ledgerService: ShcLedgerModuleService = container.resolve("shcLedger") as any;
      await ledgerService.postCommission({
        orderId: order_id,
        totalCents,
        actor: input.actor || "payment-confirm",
        container,
      });
    } catch {
      /* ledger best-effort */
    }
  }

  const logger = (container as any).resolve?.("logger") || console;
  logger.info?.({
    event: "payment.mark_paid",
    order_id,
    paynow_reference,
    actor: input.actor || "system",
    total_cents: totalCents,
    notes: input.notes,
  });

  const updated = await metaService.getOrderMetaWithMessages(order_id);
  return { success: true, total_cents: totalCents, meta: updated };
}
