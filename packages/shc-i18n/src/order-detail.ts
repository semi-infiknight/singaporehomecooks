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
