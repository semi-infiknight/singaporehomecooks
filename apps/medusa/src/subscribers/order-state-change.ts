import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SHCOrderStatus, createSHCError } from "@shc/types";
import ShcLedgerModuleService from "../modules/shc-ledger/service";

/**
 * Subscriber for SHC order state changes.
 * Logs + stub for push/SMS/email notifications (Phase 2+ full impl).
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

  // Real push support: fetch token via shc-cook (expo_push_token) and simulate/send on key events.
  // Production: use Expo (expo-server-sdk) + real credentials; tokens registered via /store/shc/push-token.
  // Note: requires "expo-server-sdk" in prod backend; handle receipts, rate, invalid tokens cleanup.
  async function sendPushStub(token: string | undefined, title: string, body: string, data?: any) {
    if (!token) {
      logger.info?.(`[PUSH-STUB] no token for event; would have sent: ${title}`);
      return;
    }
    // Stub send (logs for demo/local). In prod:
    // const { Expo } = require('expo-server-sdk'); const expo = new Expo(); if(Expo.isExpoPushToken(token)) { await expo.sendPushNotificationsAsync([{to: token, title, body, data}]) }
    logger.info?.(`[PUSH] (Expo stub) to=${token.slice(0,22)}... title="${title}" body="${body}" order=${orderId}`);
    console.log(`[PUSH-STUB] Expo push dispatched (sim): ${title} — ${body}`);
  }

  try {
    const cookService = (container as any).resolve ? (container as any).resolve("shcCook") : null;
    let cookToken: string | undefined;
    if (cookService && orderId) {
      // Best effort: derive cook from meta if possible (subscriber data limited; in full join order meta)
      // For demo, use a known or passed; here attempt generic lookup on common demo cook if actor cook
      // Simplified: for paid/ready we target cook; for ready_to_customer we would need customer token (extend later)
      if (actor && actor.includes('cook')) {
        // naive; real use order cook_id from meta or enrich data payload
      }
      // Fallback demo token lookup (in real: metaService.get + cookService.getCookWithPushToken(meta.cook_id) )
      const demoCook = await cookService.getCookWithPushToken?.('cook_rose') || await cookService.getCookWithPushToken?.('cook_demo');
      cookToken = (demoCook as any)?.expo_push_token;
    }

    if (to === "paid") {
      await sendPushStub(cookToken, "New Order", `Paid order ${orderId} ready for your acceptance.`);
      console.log(`[NOTIFY-STUB] Notify cook for order ${orderId} acceptance needed. (address release logic in route)`);
    }
    if (to === "ready_for_collection") {
      // Target customer (extend with customer push tokens in future shc-customer); for now cook+log
      await sendPushStub(cookToken, "Ready for Collection", `Your order ${orderId} is ready. HDB address in chat.`);
      console.log(`[NOTIFY-STUB] Notify customer order ready for collection: ${orderId}`);
    }
    if (to === "collected" || to === "completed") {
      await sendPushStub(cookToken, "Order Complete", `Order ${orderId} collected/completed. Earnings updated.`);
    }
  } catch (pushErr: any) {
    logger.info?.({ event: "push.send.failed", orderId, err: pushErr.message });
  }

  // Phase 6 money engine: on completed -> ledger post + notify (idempotent in ledger)
  // Phase 8-9 growth: also award Home Credits (5%) to customer via credit-wallet (posts ledger issuance inside)
  if (to === "completed" && orderId) {
    try {
      const ledgerService: ShcLedgerModuleService = (container as any).resolve("shcLedger");
      // Derive total from order (items or total)
      let totalCents = 0;
      let custId: string | undefined;
      try {
        const orderService = (container as any).resolve("order");
        const order = await orderService.retrieveOrder(orderId, { relations: ["items", "customer"] });
        if (order?.items?.length) {
          totalCents = order.items.reduce((sum: number, item: any) => {
            const price = item.unit_price || (item.raw_unit_price && item.raw_unit_price.value) || 0;
            return sum + (Number(price) * (item.quantity || 1));
          }, 0);
        } else if (order?.total) {
          totalCents = Math.floor(Number(order.total));
        }
        custId = order?.customer?.id || order?.customer_id || "cust_demo";
      } catch {}

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

      // Award credits for growth flow
      if (custId && totalCents > 0) {
        try {
          const cred = (container as any).resolve("shcCreditWallet");
          const aw = await cred.awardCreditsOnComplete(custId, totalCents, orderId, container);
          logger.info?.({ event: "credit.awarded_on_completed", orderId, customer: custId, awarded: aw?.awarded });
        } catch {}
      }

      // Notify stub for payout eligibility + growth
      console.log(`[NOTIFY-STUB] Order ${orderId} completed. Earnings now eligible for weekly payout batch. Credits awarded to customer if applicable.`);
    } catch (e: any) {
      logger.error?.({ event: "ledger.post_on_completed.failed", orderId, error: e.message });
      // Do not block state; money can be reconciled manually via script
    }
  }

  // TODO Phase 5: integrate real Expo push, Resend email, Twilio SMS
}

export const config: SubscriberConfig = {
  event: ["order.updated", "shc.order.state_changed"], // listen to both Medusa native + custom
};
