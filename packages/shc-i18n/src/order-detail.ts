import { t, type MessageKey, type ShcLocale } from './messages';

const STATUS_KEYS: Record<string, MessageKey> = {
  paid: 'orders.status.paid',
  accepted: 'orders.status.accepted',
  preparing: 'orders.status.preparing',
  ready_for_collection: 'orders.status.ready',
  collected: 'orders.status.collected',
  completed: 'orders.status.completed',
  cancelled: 'orders.status.cancelled',
  disputed: 'orders.status.disputed',
  resolved: 'orders.status.resolved',
};

export function getLocalizedOrderStatus(locale: ShcLocale, status: string): string {
  const key = STATUS_KEYS[status];
  if (key) return t(locale, key);
  return status.replace(/_/g, ' ');
}

export function formatOrderRef(locale: ShcLocale, id: string): string {
  return t(locale, 'orders.detail.order_ref').replace('{id}', id);
}

const TIMELINE_IDS = ['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'] as const;

export type LocalizedTimelineStep = { id: string; label: string; detail: string };

export function getLocalizedOrderTimeline(locale: ShcLocale): LocalizedTimelineStep[] {
  return TIMELINE_IDS.map((id) => ({
    id,
    label: t(locale, `orders.timeline.${id}.label` as MessageKey),
    detail: t(locale, `orders.timeline.${id}.detail` as MessageKey),
  }));
}
