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
  return {
    guest: t(locale, 'cart.guest'),
    subtitle: (tier: string) => t(locale, 'wallet.profile_subtitle').replace('{tier}', tier),
    notificationsA11y: t(locale, 'wallet.notifications'),
  };
}
