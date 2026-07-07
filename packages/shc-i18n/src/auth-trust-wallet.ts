import { t, type MessageKey, type ShcLocale } from './messages';

export type TrustLayerKey = 'kitchen' | 'tasting' | 'receipts' | 'guarantee' | 'collection';

const TRUST_LAYERS: TrustLayerKey[] = ['kitchen', 'tasting', 'receipts', 'guarantee', 'collection'];

export function getTrustPageLayers(locale: ShcLocale) {
  return TRUST_LAYERS.map((key) => ({
    key,
    title: t(locale, `trust.layer.${key}.title` as MessageKey),
    desc: t(locale, `trust.layer.${key}.desc` as MessageKey),
  }));
}

export function getTrustSafetyOnboardingCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'nav.trust_safety'),
    subtitle: t(locale, 'trust.page.subtitle'),
    layers: getTrustPageLayers(locale),
    allergenTitle: t(locale, 'trust.section.allergen.title'),
    allergenBody: t(locale, 'trust.section.allergen.body'),
    cancellationTitle: t(locale, 'trust.section.cancellation.title'),
    cancellationLines: [
      t(locale, 'trust.section.cancellation.line1'),
      t(locale, 'trust.section.cancellation.line2'),
      t(locale, 'trust.section.cancellation.line3'),
    ],
    pdpaTitle: t(locale, 'trust.section.pdpa.title'),
    pdpaBody: t(locale, 'trust.section.pdpa.body'),
    browseCta: t(locale, 'onboarding.trust.browse_cta'),
    meetCookCta: t(locale, 'onboarding.trust.meet_cook'),
  };
}

export function getWalletProfileCopy(locale: ShcLocale) {
  const statusKeys: Record<string, MessageKey> = {
    open: 'request.status.open',
    matched: 'request.status.matched',
    pending: 'request.status.pending',
    closed: 'request.status.closed',
  };
  return {
    guest: t(locale, 'cart.guest'),
    greeting: (firstName?: string) =>
      t(locale, 'wallet.greeting').replace('{name}', firstName || t(locale, 'cart.guest')),
    subtitle: (tier: string) => t(locale, 'wallet.profile_subtitle').replace('{tier}', tier),
    notificationsA11y: t(locale, 'wallet.notifications'),
    unreadPrefix: t(locale, 'wallet.unread_prefix'),
    requestMeta: (partySize?: number, budgetCents?: number) => {
      if (partySize && budgetCents) {
        return t(locale, 'wallet.request_meta')
          .replace('{size}', String(partySize))
          .replace('{amount}', String(Math.round(budgetCents / 100)));
      }
      if (partySize) {
        return t(locale, 'wallet.request_pax_only').replace('{size}', String(partySize));
      }
      return t(locale, 'wallet.open_budget');
    },
    requestStatusLabel: (status: string) =>
      statusKeys[status] ? t(locale, statusKeys[status]) : status,
  };
}
