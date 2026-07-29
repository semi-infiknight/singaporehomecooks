/** Real-time order tracking helpers (dev.to: provide live status updates). */

import { todayIsoInSingapore } from './my-orders';

export type OrderTimelineStep = {
  id: string;
  label: string;
  detail: string;
};

export const COLLECTION_ORDER_TIMELINE: OrderTimelineStep[] = [
  { id: 'paid', label: 'Payment confirmed', detail: 'PayNow received — cook notified' },
  { id: 'accepted', label: 'Cook accepted', detail: 'Your home cook confirmed the order' },
  { id: 'preparing', label: 'Preparing', detail: 'Fresh cooking in HDB kitchen' },
  { id: 'ready_for_collection', label: 'Ready to collect', detail: 'Head to the collection slot' },
  { id: 'collected', label: 'Collected', detail: 'Enjoy your heritage meal' },
  { id: 'completed', label: 'Completed', detail: 'Order closed — leave a review' },
];

const STATUS_INDEX: Record<string, number> = {
  cart: -1,
  paid: 0,
  accepted: 1,
  preparing: 2,
  ready_for_collection: 3,
  collected: 4,
  completed: 5,
  cancelled: -2,
  disputed: -2,
  resolved: 5,
};

const HUMAN_STATUS: Record<string, string> = {
  paid: 'Payment confirmed',
  accepted: 'Cook accepted your order',
  preparing: 'Cook is preparing your meal',
  ready_for_collection: 'Ready for HDB collection',
  collected: 'Collected — thank you!',
  completed: 'Order completed',
  cancelled: 'Order cancelled',
  disputed: 'Issue reported',
  resolved: 'Issue resolved',
};

export const ACTIVE_ORDER_STATUSES = [
  'paid',
  'accepted',
  'preparing',
  'ready_for_collection',
] as const;

export function getOrderStatusLabel(status: string): string {
  return HUMAN_STATUS[status] || status.replace(/_/g, ' ');
}

export function getOrderTimelineIndex(status: string): number {
  return STATUS_INDEX[status] ?? -1;
}

export function isActiveOrderStatus(status: string): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(status);
}

/** Cook must Accept or Decline — paid, awaiting cook action */
export const COOK_NEEDS_ACTION_STATUSES = ["paid"] as const;

export function isCookNeedsActionOrder(order: { shc_status?: string; status?: string }): boolean {
  const status = String(order.shc_status || order.status || "");
  return (COOK_NEEDS_ACTION_STATUSES as readonly string[]).includes(status);
}

export function partitionCookOrders<T extends { shc_status?: string; status?: string }>(orders: T[]) {
  const needsAction: T[] = [];
  const inProgress: T[] = [];
  const done: T[] = [];
  for (const o of orders) {
    const status = String(o.shc_status || o.status || "");
    if (isCookNeedsActionOrder(o)) needsAction.push(o);
    else if (["collected", "completed", "cancelled"].includes(status)) done.push(o);
    else inProgress.push(o);
  }
  return { needsAction, inProgress, done };
}

export function getActiveOrders<T extends { shc_status?: string; status?: string }>(orders: T[]): T[] {
  return orders.filter((o) => isActiveOrderStatus(String(o.shc_status || o.status || '')));
}

/** Cook dashboard chat CTA — newest active order (paid/accepted/preparing/ready). */
export function latestActiveCookOrder<
  T extends { id?: string; shc_status?: string; status?: string; updated_at?: string; created_at?: string }
>(orders: T[]): T | null {
  const active = getActiveOrders(orders);
  if (!active.length) return null;
  const needsAction = active.filter(isCookNeedsActionOrder);
  const pool = needsAction.length ? needsAction : active;
  return [...pool].sort((a, b) => {
    const ta = Date.parse(String(a.updated_at || a.created_at || '')) || 0;
    const tb = Date.parse(String(b.updated_at || b.created_at || '')) || 0;
    return tb - ta;
  })[0] ?? null;
}

/** Cook actively at the stove — only `preparing` (not paid/accepted/ready). */
export const COOKING_ORDER_STATUSES = ['preparing'] as const;

export function isOrderCookingStatus(status: string): boolean {
  return (COOKING_ORDER_STATUSES as readonly string[]).includes(status);
}

export type OrdersTabLiveCue = 'cooking';

/** Tab-bar steam animation — only when an order is preparing for today (SG). */
export function getOrdersTabLiveCue<T extends { shc_status?: string; status?: string; collection_date?: string }>(
  orders: T[],
  todayIso = todayIsoInSingapore()
): OrdersTabLiveCue | null {
  const cookingNow = orders.some((o) => {
    const status = String(o.shc_status || o.status || '');
    if (!isOrderCookingStatus(status)) return false;
    const collectionDate = String(o.collection_date || '').trim();
    if (!collectionDate) return false;
    return collectionDate === todayIso;
  });
  return cookingNow ? 'cooking' : null;
}