/**
 * HomelyEats-style empty screen copy for My Orders + My Subscriptions.
 * Pure helpers — no I/O.
 */

export type EmptyIllustrationKind = 'no_orders' | 'no_active_sub' | 'no_past_sub';

export function emptyOrdersDayCopy(opts: { isToday?: boolean } = {}): {
  title: string;
  illustration: EmptyIllustrationKind;
} {
  return {
    illustration: 'no_orders',
    title: opts.isToday
      ? 'Oh uh! No orders scheduled for today.'
      : 'Oh uh! No orders scheduled for this day.',
  };
}

export function emptyActiveSubscriptionsCopy(): {
  title: string;
  ctaLabel: string;
  illustration: EmptyIllustrationKind;
} {
  return {
    illustration: 'no_active_sub',
    title: 'You have no active subscriptions.',
    ctaLabel: 'Subscribe now',
  };
}

export function emptyPastSubscriptionsCopy(): {
  title: string;
  illustration: EmptyIllustrationKind;
} {
  return {
    illustration: 'no_past_sub',
    title: 'You have no past subscriptions.',
  };
}
