import { t, type ShcLocale } from './messages';
import { getLocalizedOrderStatus } from './order-detail';

export function getCookOrderActionLabel(locale: ShcLocale, status: string): string | null {
  const map: Record<string, string> = {
    paid: t(locale, 'cook.action.accept'),
    accepted: t(locale, 'cook.action.prepare'),
    preparing: t(locale, 'cook.action.ready'),
    ready_for_collection: t(locale, 'cook.action.collected'),
  };
  return map[status] ?? null;
}

export function getCookOrderTransitionActions(locale: ShcLocale) {
  return [
    { status: 'paid', to: 'accepted' as const, label: t(locale, 'cook.action.accept') },
    { status: 'accepted', to: 'preparing' as const, label: t(locale, 'cook.action.prepare') },
    { status: 'preparing', to: 'ready_for_collection' as const, label: t(locale, 'cook.action.ready') },
    { status: 'ready_for_collection', to: 'collected' as const, label: t(locale, 'cook.action.collected') },
  ];
}

export function getCookQuickActionLabels(locale: ShcLocale) {
  return {
    listings: t(locale, 'cook.quick.listings'),
    orders: t(locale, 'cook.quick.orders'),
    earnings: t(locale, 'cook.quick.earnings'),
    compliance: t(locale, 'cook.quick.compliance'),
  };
}

export function getCookOrderStatusLabel(locale: ShcLocale, status: string): string {
  return getLocalizedOrderStatus(locale, status);
}
