import { sendExpoPush } from "./shc-expo-push";
import { getCustomerPushToken, getCustomerPushTokenAsync } from "./shc-push-tokens";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import type { SHCOrderStatus } from "@shc/types";

const STATUS_COPY: Partial<Record<SHCOrderStatus, { cook?: { title: string; body: string }; customer?: { title: string; body: string } }>> = {
  paid: {
    cook: { title: "New order", body: "A customer paid — accept when ready." },
    customer: { title: "Order placed", body: "Your order is confirmed. We'll notify you when it's ready." },
  },
  accepted: {
    customer: { title: "Cook accepted", body: "Your home cook accepted the order." },
  },
  preparing: {
    customer: { title: "Preparing your meal", body: "Your cook is preparing your order." },
  },
  ready_for_collection: {
    customer: { title: "Ready for collection", body: "Your order is ready — check chat for HDB collection details." },
    cook: { title: "Customer notified", body: "Order marked ready for collection." },
  },
  collected: {
    customer: { title: "Order collected", body: "Thanks for collecting — enjoy your meal!" },
  },
  completed: {
    customer: { title: "Order complete", body: "Order completed. Home Credits may be on the way." },
    cook: { title: "Order complete", body: "Earnings updated for this order." },
  },
};

export async function notifyOrderStatusPush(
  container: any,
  orderId: string,
  to: SHCOrderStatus,
  logger: { info?: (msg: string) => void } = console
) {
  let cookId: string | undefined;
  let customerId: string | undefined;
  try {
    const metaService: ShcOrderMetaModuleService = container.resolve("shcOrderMeta");
    const meta = await metaService.getOrderMetaWithMessages(orderId);
    cookId = (meta?.meta as any)?.cook_id;
    customerId = String((meta?.meta as any)?.customer_id || "");
  } catch {
    /* best effort */
  }

  const copy = STATUS_COPY[to];
  if (!copy) return;

  const cookService: ShcCookModuleService | null = container.resolve?.("shcCook") ?? null;
  let cookToken: string | undefined;
  if (cookId && cookService) {
    const cook = await cookService.getCookWithPushToken(cookId);
    cookToken = (cook as any)?.expo_push_token;
  }
  let customerToken = customerId ? getCustomerPushToken(customerId) : undefined;
  if (!customerToken && customerId) {
    customerToken = await getCustomerPushTokenAsync(customerId, container).catch(() => undefined);
  }

  if (copy.cook) {
    await sendExpoPush(cookToken, { ...copy.cook, data: { orderId, status: to } }, logger);
  }
  if (copy.customer) {
    await sendExpoPush(customerToken, { ...copy.customer, data: { orderId, status: to } }, logger);
  }
}