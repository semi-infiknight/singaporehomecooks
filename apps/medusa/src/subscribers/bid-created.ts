import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import ShcRequestModuleService from "../modules/shc-request/service";
import ShcNotificationModuleService from "../modules/shc-notification/service";
import { sendExpoPush } from "../lib/shc-expo-push";
import { getCustomerPushTokenAsync } from "../lib/shc-push-tokens";

/**
 * Notify customer when a cook sends a quote on their custom request.
 */
export default async function bidCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ bidId: string; requestId: string; cookId: string }>) {
  const { bidId, requestId, cookId } = event.data || {};
  if (!requestId || !bidId) return;

  const logger = (container as any).resolve?.("logger") || console;
  try {
    const reqService: ShcRequestModuleService = (container as any).resolve("shcRequest");
    const notifService: ShcNotificationModuleService = (container as any).resolve("shcNotification");
    const request = await reqService.getRequest(requestId);
    const customerId = request?.customer_id;
    if (!customerId) return;

    const body = "A home cook sent a quote on your custom dish request. Tap to review.";
    await notifService.push(customerId, { type: "request", body });

    const token = await getCustomerPushTokenAsync(customerId, container);
    if (token) {
      await sendExpoPush(token, {
        title: "New cook quote",
        body,
        data: { type: "custom_request_quote", requestId, bidId, cookId },
      }).catch((err: Error) => {
        logger.info?.({ event: "push.bid_created.failed", requestId, err: err.message });
      });
    }
    logger.info?.({ event: "push.bid_created.sent", requestId, bidId, customerId });
  } catch (e: any) {
    logger.info?.({ event: "subscriber.bid_created.failed", requestId, err: e?.message });
  }
}

export const config: SubscriberConfig = {
  event: "shc.bid.created",
};
