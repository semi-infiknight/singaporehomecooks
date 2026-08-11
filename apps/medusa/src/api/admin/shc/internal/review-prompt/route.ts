import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  buildReviewPromptCopy,
  reviewPromptNotificationType,
  shouldSendReviewPrompt,
} from "@shc/utils";
import { requireWorker } from "../../../../../lib/shc-worker-auth";
import { resolveOrderNotifyContext } from "../../../../../lib/shc-order-push";
import { sendExpoPush } from "../../../../../lib/shc-expo-push";
import { sendWebPush } from "../../../../../lib/shc-web-push";
import {
  getCustomerPushToken,
  getCustomerPushTokenAsync,
  getCustomerWebPushSubscriptionAsync,
} from "../../../../../lib/shc-push-tokens";
import ShcNotificationModuleService from "../../../../../modules/shc-notification/service";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import ShcReviewModuleService from "../../../../../modules/shc-review/service";
import { loadBusinessRulesConfigFromScope } from "../../../../../lib/shc-business-rules-config";

/**
 * POST /admin/shc/internal/review-prompt
 * Worker job: ~1 hour after collection, auto-notify customers to review
 * (taste, communication, presentation, quantity, oily, spicy).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!requireWorker(req, res)) return;

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const reviewService: ShcReviewModuleService = req.scope.resolve("shcReview") as any;
  const rules = await loadBusinessRulesConfigFromScope(req.scope);
  const logger = (req.scope as any).resolve?.("logger") || console;
  const nowMs = Date.now();

  const statuses = rules.review?.eligible_statuses?.length
    ? rules.review.eligible_statuses
    : ["collected", "completed"];

  let scanned = 0;
  let prompted = 0;
  let skipped = 0;

  for (const status of statuses) {
    const [orders] = await metaService
      .listAndCountOrderMetas({ shc_status: status } as any, { take: 80 })
      .catch(() => [[]]);

    for (const order of orders || []) {
      scanned += 1;
      const orderId = String(order.order_id || order.id || "");
      const customerId = order.customer_id ? String(order.customer_id) : "";
      if (!orderId || !customerId) {
        skipped += 1;
        continue;
      }

      const existingReview = await reviewService.getReviewForOrder(orderId).catch(() => null);
      const promptType = reviewPromptNotificationType(orderId);
      const existingNotifs = await notifService.listForActor(customerId, 100).catch(() => []);
      const alreadyPrompted = (existingNotifs as any[]).some((n) => n?.type === promptType);

      // Prefer updated_at (set when status last changed to collected/completed)
      const collectedAt = order.updated_at || order.created_at || null;

      if (
        !shouldSendReviewPrompt({
          shcStatus: String(order.shc_status || status),
          collectedAt,
          hasReview: Boolean(existingReview),
          alreadyPrompted,
          nowMs,
          eligibleStatuses: statuses,
        })
      ) {
        skipped += 1;
        continue;
      }

      try {
        const ctx = await resolveOrderNotifyContext(req.scope, orderId);
        const copy = buildReviewPromptCopy({
          cookName: ctx.cookName,
          dishSummary: ctx.dishSummary,
          orderRef: ctx.orderRef,
        });

        // In-app (idempotent type)
        await notifService.push(customerId, {
          type: promptType,
          body: `${copy.title} — ${copy.body}`,
        });

        // Push channels
        let customerToken = getCustomerPushToken(customerId);
        if (!customerToken) {
          customerToken = await getCustomerPushTokenAsync(customerId, req.scope).catch(() => undefined);
        }
        const webPushSub = await getCustomerWebPushSubscriptionAsync(customerId, req.scope).catch(
          () => undefined
        );
        const payload = {
          title: copy.title,
          body: copy.body,
          data: { orderId, type: "review_prompt" },
        };
        await sendExpoPush(customerToken, payload, logger);
        await sendWebPush(webPushSub as any, payload, logger);

        prompted += 1;
        logger.info?.({
          event: "worker.review_prompt.sent",
          orderId,
          customerId,
        });
      } catch (e: any) {
        skipped += 1;
        logger.info?.({
          event: "worker.review_prompt.failed",
          orderId,
          err: e?.message || String(e),
        });
      }
    }
  }

  logger.info?.({ event: "worker.review_prompt", scanned, prompted, skipped });
  res.json({ ok: true, scanned, prompted, skipped });
}
