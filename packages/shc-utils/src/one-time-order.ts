/**
 * One-time order flow helpers (HomelyEats one-time delivery IA).
 * SHC: HDB collection + PayNow — not door delivery / UPI.
 */

import { formatSGD, summarizeCart, type CartLineInput } from './cart';

export type OneTimeOrderSummary = {
  itemTotal: number;
  itemTotalLabel: string;
  /** Platform fee analogue (shown as service fee) */
  serviceFee: number;
  serviceFeeLabel: string;
  /** Collection is free for HDB — still show line for transparency */
  collectionFee: number;
  collectionFeeLabel: string;
  total: number;
  totalLabel: string;
  itemCount: number;
  countLabel: string;
  proceedLabel: string;
  cancelNote: string;
};

/** Flat service fee for one-time orders (S$). */
export const ONE_TIME_SERVICE_FEE = 1.5;

export function computeOneTimeOrderSummary(items: CartLineInput[] = []): OneTimeOrderSummary {
  const s = summarizeCart(items);
  const serviceFee = s.hasItems ? ONE_TIME_SERVICE_FEE : 0;
  const collectionFee = 0;
  const total = s.total + serviceFee + collectionFee;
  return {
    itemTotal: s.total,
    itemTotalLabel: formatSGD(s.total),
    serviceFee,
    serviceFeeLabel: formatSGD(serviceFee),
    collectionFee,
    collectionFeeLabel: collectionFee === 0 ? 'Free' : formatSGD(collectionFee),
    total,
    totalLabel: formatSGD(total),
    itemCount: s.itemCount,
    countLabel: s.countLabel,
    proceedLabel: 'Proceed to pay',
    cancelNote: 'One-time orders cannot be cancelled once placed — change slot via Manage before collection.',
  };
}

export function cartKitchenLabel(items: Array<Record<string, unknown>> = []): string {
  for (const it of items) {
    const name = it.cook_name || it.cookName || it.kitchen_name;
    if (name) return String(name);
  }
  return 'Home kitchen';
}

export function cartCollectionHint(): string {
  return 'HDB collection · book a slot at checkout';
}

export function orderSuccessfulCopy(): { title: string; subtitle: string } {
  return {
    title: 'Order placed!',
    subtitle: 'Your cook will confirm shortly — we’ll notify you when it’s time to pay.',
  };
}

export function orderAwaitingCookCopy(): { title: string; subtitle: string } {
  return {
    title: 'Waiting for cook to confirm',
    subtitle: 'You’ll get a notification to complete PayNow once your cook accepts.',
  };
}

export function orderTrackingBanner(status: string, slotLabel?: string): {
  tone: 'active' | 'done' | 'idle';
  title: string;
  subtitle?: string;
} {
  const s = String(status || '').toLowerCase();
  if (s === 'collected' || s === 'completed') {
    return {
      tone: 'done',
      title: slotLabel
        ? `Your order was collected · ${slotLabel}`
        : 'Your order was collected',
    };
  }
  if (['paid', 'preparing', 'ready_for_collection'].includes(s)) {
    return {
      tone: 'active',
      title: slotLabel ? `Order in progress · ${slotLabel}` : 'Order in progress',
    };
  }
  if (s === 'accepted') {
    return {
      tone: 'active',
      title: 'Cook confirmed — complete PayNow',
      subtitle: 'Pay only after your cook has accepted the order',
    };
  }
  if (s === 'cart') {
    return {
      tone: 'idle',
      title: 'Waiting for cook to confirm',
      subtitle: 'You will pay with PayNow once your cook accepts',
    };
  }
  return {
    tone: 'idle',
    title: 'Order update',
  };
}

export function orderDeliveredRateCopy(): {
  title: string;
  subtitle: string;
  cta: string;
} {
  return {
    title: 'Rate this kitchen',
    subtitle: 'Share your experience with us.',
    cta: 'Continue browsing',
  };
}

export function cartStickyViewLabel(itemCount: number, total: number): string {
  if (itemCount <= 0) return 'View cart';
  return `View cart ${formatSGD(total)}`;
}

export function cartItemsAddedLabel(itemCount: number): string {
  return itemCount === 1 ? '1 item added' : `${itemCount} items added`;
}
