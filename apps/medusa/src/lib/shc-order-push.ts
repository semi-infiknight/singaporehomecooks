import { sendExpoPush } from "./shc-expo-push";
import { sendWebPush } from "./shc-web-push";
import { getCustomerPushToken, getCustomerPushTokenAsync, getCustomerWebPushSubscriptionAsync } from "./shc-push-tokens";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcNotificationModuleService from "../modules/shc-notification/service";
import { productTitleFromId } from "./shc-product-titles";
import type { SHCOrderStatus } from "@shc/types";

export type OrderNotifyContext = {
  orderId: string;
  orderRef: string;
  cookId?: string;
  cookName: string;
  customerId?: string;
  dishSummary: string;
  collectionDate?: string;
  collectionSlot?: string;
};

type StatusCopy = { title: string; body: string };

const STATUS_TEMPLATES: Partial<
  Record<SHCOrderStatus, { cook?: StatusCopy; customer?: StatusCopy }>
> = {
  paid: {
    cook: {
      title: "New paid order",
      body: "{dishes} · collection {date} {slot}. Tap to accept.",
    },
    customer: {
      title: "Order confirmed",
      body: "{cook} received your order for {dishes}. We'll ping you when it's ready.",
    },
  },
  accepted: {
    customer: {
      title: "Cook accepted",
      body: "{cook} accepted order #{ref} — they're getting started.",
    },
    cook: {
      title: "Order accepted",
      body: "You accepted #{ref}. Move to preparing when you start cooking.",
    },
  },
  preparing: {
    customer: {
      title: "Preparing your meal",
      body: "{cook} is preparing {dishes} for {date} {slot}.",
    },
  },
  ready_for_collection: {
    customer: {
      title: "Ready for collection",
      body: "{dishes} from {cook} is ready — {date} {slot}. Check chat for HDB collection details.",
    },
    cook: {
      title: "Marked ready",
      body: "Customer notified for #{ref}. Share collection details in chat if needed.",
    },
  },
  collected: {
    customer: {
      title: "Enjoy your meal",
      body: "Thanks for collecting {dishes} from {cook}. Rate your meal when you're ready.",
    },
    cook: {
      title: "Order collected",
      body: "#{ref} collected. Mark complete after handoff is confirmed.",
    },
  },
  completed: {
    customer: {
      title: "Order complete",
      body: "Order #{ref} with {cook} is complete. Leave a review when you're ready.",
    },
    cook: {
      title: "Order complete",
      body: "#{ref} completed — earnings updated for this order.",
    },
  },
  cancelled: {
    customer: {
      title: "Order cancelled",
      body: "Order #{ref} with {cook} was cancelled. Credits or refunds follow platform policy.",
    },
    cook: {
      title: "Order cancelled",
      body: "Order #{ref} was cancelled and removed from your active queue.",
    },
  },
};

function interpolate(template: string, ctx: OrderNotifyContext): string {
  const date = ctx.collectionDate ? ctx.collectionDate.slice(0, 10) : "";
  const slot = ctx.collectionSlot || "";
  return template
    .replace(/\{cook\}/g, ctx.cookName)
    .replace(/\{dishes\}/g, ctx.dishSummary)
    .replace(/\{slot\}/g, slot)
    .replace(/\{date\}/g, date)
    .replace(/\{ref\}/g, ctx.orderRef);
}

function buildStatusCopy(
  status: SHCOrderStatus,
  ctx: OrderNotifyContext
): { cook?: StatusCopy; customer?: StatusCopy } {
  const raw = STATUS_TEMPLATES[status];
  if (!raw) return {};
  const out: { cook?: StatusCopy; customer?: StatusCopy } = {};
  if (raw.cook) {
    out.cook = { title: raw.cook.title, body: interpolate(raw.cook.body, ctx) };
  }
  if (raw.customer) {
    out.customer = { title: raw.customer.title, body: interpolate(raw.customer.body, ctx) };
  }
  return out;
}

export async function resolveOrderNotifyContext(container: any, orderId: string): Promise<OrderNotifyContext> {
  const ctx: OrderNotifyContext = {
    orderId,
    orderRef: orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase(),
    cookName: "Your cook",
    dishSummary: "your meal",
  };

  try {
    const metaService: ShcOrderMetaModuleService = container.resolve("shcOrderMeta");
    const data = await metaService.getOrderMetaWithMessages(orderId);
    const m = data?.meta as any;
    if (!m) return ctx;

    ctx.cookId = m.cook_id ? String(m.cook_id) : undefined;
    ctx.customerId = m.customer_id ? String(m.customer_id) : undefined;
    ctx.collectionDate = m.collection_date ? String(m.collection_date) : undefined;
    ctx.collectionSlot = m.collection_slot ? String(m.collection_slot) : undefined;

    const items = Array.isArray(m.items) ? m.items : [];
    const names = items
      .map((i: any) => String(i.name || productTitleFromId(String(i.product_id || i.productId || ""))).trim())
      .filter(Boolean);
    if (names.length) {
      ctx.dishSummary = names.slice(0, 2).join(" · ");
      if (names.length > 2) ctx.dishSummary += ` +${names.length - 2}`;
    }

    if (ctx.cookId) {
      const cookService: ShcCookModuleService | null = container.resolve?.("shcCook") ?? null;
      if (cookService) {
        const cook = await cookService.getCookWithPushToken(ctx.cookId);
        const name = (cook as any)?.display_name || (cook as any)?.name;
        if (name) ctx.cookName = String(name);
      }
    }
  } catch {
    /* best effort */
  }

  return ctx;
}

async function persistInApp(
  container: any,
  actorId: string,
  orderId: string,
  copy: StatusCopy
) {
  if (!actorId) return;
  try {
    const notifService: ShcNotificationModuleService = container.resolve("shcNotification");
    await notifService.push(actorId, {
      type: `order:${orderId}`,
      body: `${copy.title} — ${copy.body}`,
    });
  } catch {
    /* non-fatal */
  }
}

/** Push + in-app notifications for an order status change (single entry point). */
export async function notifyOrderStatusChange(
  container: any,
  orderId: string,
  to: SHCOrderStatus,
  logger: { info?: (msg: string) => void } = console
) {
  const ctx = await resolveOrderNotifyContext(container, orderId);
  const copy = buildStatusCopy(to, ctx);
  if (!copy.cook && !copy.customer) return;

  let cookToken: string | undefined;
  if (ctx.cookId) {
    try {
      const cookService: ShcCookModuleService = container.resolve("shcCook");
      const cook = await cookService.getCookWithPushToken(ctx.cookId);
      cookToken = (cook as any)?.expo_push_token;
    } catch {
      /* optional */
    }
  }

  let customerToken = ctx.customerId ? getCustomerPushToken(ctx.customerId) : undefined;
  if (!customerToken && ctx.customerId) {
    customerToken = await getCustomerPushTokenAsync(ctx.customerId, container).catch(() => undefined);
  }
  const webPushSub = ctx.customerId
    ? await getCustomerWebPushSubscriptionAsync(ctx.customerId, container).catch(() => undefined)
    : undefined;

  if (copy.cook && ctx.cookId) {
    await sendExpoPush(cookToken, { ...copy.cook, data: { orderId, status: to } }, logger);
    await persistInApp(container, ctx.cookId, orderId, copy.cook);
  }

  if (copy.customer && ctx.customerId) {
    const customerPayload = { ...copy.customer, data: { orderId, status: to } };
    await sendExpoPush(customerToken, customerPayload, logger);
    await sendWebPush(webPushSub as any, customerPayload, logger);
    await persistInApp(container, ctx.customerId, orderId, copy.customer);
  }
}

/** @deprecated use notifyOrderStatusChange */
export const notifyOrderStatusPush = notifyOrderStatusChange;

/** Push + in-app when a new chat message is sent (other party only). */
export async function notifyChatMessage(
  container: any,
  orderId: string,
  senderActor: "customer" | "cook" | "ops",
  body: string,
  logger: { info?: (msg: string) => void } = console
) {
  const ctx = await resolveOrderNotifyContext(container, orderId);
  const preview = body.length > 80 ? `${body.slice(0, 77)}…` : body;
  const data = { orderId, type: "chat" };

  if (senderActor === "customer" && ctx.cookId) {
    const cookService: ShcCookModuleService = container.resolve("shcCook");
    const cook = await cookService.getCookWithPushToken(ctx.cookId);
    const cookToken = (cook as any)?.expo_push_token;
    const copy = { title: "New customer message", body: preview };
    await sendExpoPush(cookToken, { ...copy, data }, logger);
    await persistInApp(container, ctx.cookId, orderId, copy);
    return;
  }

  if (senderActor === "cook" && ctx.customerId) {
    let customerToken = getCustomerPushToken(ctx.customerId);
    if (!customerToken) {
      customerToken = await getCustomerPushTokenAsync(ctx.customerId, container).catch(() => undefined);
    }
    const webPushSub = await getCustomerWebPushSubscriptionAsync(ctx.customerId, container).catch(() => undefined);
    const copy = {
      title: `Message from ${ctx.cookName}`,
      body: preview,
    };
    await sendExpoPush(customerToken, { ...copy, data }, logger);
    await sendWebPush(webPushSub as any, { ...copy, data }, logger);
    await persistInApp(container, ctx.customerId, orderId, copy);
  }
}
