import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SHCOrderStatus, createSHCError } from "@shc/types";
import ShcLedgerModuleService from "../modules/shc-ledger/service";
import { notifyOrderStatusChange } from "../lib/shc-order-push";
import { resolveOrderMoney } from "../lib/shc-order-money";

/**
 * Subscriber for SHC order state changes.
 * Logs + push/in-app notifications on key order transitions.
 * Phase 6: on 'completed' -> auto post commission ledger (double-entry, 15% platform/cook earnings) + audit.
 * Triggered by orderStateTransitionWorkflow or direct meta update.
 */
export default async function shcOrderStateHandler({ event, container }: SubscriberArgs<{ orderId: string; from?: SHCOrderStatus; to: SHCOrderStatus; actor?: string }>) {
  const { orderId, from, to, actor } = event.data || {};
  const eventName = event.name;
  const logger = (container && (container as any).resolve) ? (container as any).resolve("logger") : console;

  // Structured audit log (actor, action, before/after for state/money) per production-hardening, observability, compliance-pdpa
  const auditEntry = {
    ts: new Date().toISOString(),
    actor: actor || 'system',
    action: 'order.state_transition',
    before: { shc_status: from || 'unknown' },
    after: { shc_status: to },
    orderId,
    meta: { event: eventName },
  };
  logger.info?.(`[SHC-AUDIT] ${JSON.stringify(auditEntry)}`) || console.info('[SHC-AUDIT]', auditEntry);

  // Structured log using Medusa logger (pino under the hood in prod). Includes request context in full Medusa req flow.
  logger.info?.(`[SHC-SUBSCRIBER][${eventName}] Order ${orderId} transitioned ${from || "?"} -> ${to} by ${actor || "system"}`) || console.log(`[SHC-SUBSCRIBER][${eventName}] Order ${orderId} transitioned ${from || "?"} -> ${to} by ${actor || "system"}`);

  if (orderId && to) {
    try {
      await notifyOrderStatusChange(container, orderId, to, logger);
    } catch (pushErr: any) {
      logger.info?.({ event: "push.send.failed", orderId, err: pushErr.message });
    }
  }

  // Phase 6 money engine: on completed -> ledger post + notify (idempotent in ledger)
  if (to === "completed" && orderId) {
    try {
      const ledgerService: ShcLedgerModuleService = (container as any).resolve("shcLedger");
      const { totalCents } = await resolveOrderMoney(container, orderId);

      if (totalCents > 0) {
        await ledgerService.postCommission({
          orderId,
          totalCents,
          actor: actor || "subscriber-completed",
          container,
        });
        logger.info?.({ event: "ledger.auto_post_on_completed", orderId, totalCents });
      } else {
        logger.info?.({ event: "ledger.auto_post_on_completed.skip", orderId, reason: "no_total" });
      }
    } catch (e: any) {
      logger.error?.({ event: "ledger.post_on_completed.failed", orderId, error: e.message });
      // Do not block state; money can be reconciled manually via script
    }
  }
}

export const config: SubscriberConfig = {
  event: ["order.updated", "shc.order.state_changed"], // listen to both Medusa native + custom
};
