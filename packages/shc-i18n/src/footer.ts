import { t, type ShcLocale } from './messages';

export function getFooterCopy(locale: ShcLocale) {
  return {
    tagline: t(locale, 'footer.tagline'),
    customersHeading: t(locale, 'footer.customers_heading'),
    browseDishes: t(locale, 'footer.browse_dishes'),
    trustSafety: t(locale, 'footer.trust_safety'),
    homeCredits: t(locale, 'footer.home_credits'),
    cooksHeading: t(locale, 'footer.cooks_heading'),
    cookDashboard: t(locale, 'footer.cook_dashboard'),
    sfaWsq: t(locale, 'footer.sfa_wsq'),
    weeklyPayouts: t(locale, 'footer.weekly_payouts'),
    copyright: (year: number) => t(locale, 'footer.copyright').replace('{year}', String(year)),
  };
}

export function getWebPushCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'push.title'),
    description: t(locale, 'push.description'),
    enable: t(locale, 'push.enable'),
    enabling: t(locale, 'push.enabling'),
    enabled: t(locale, 'push.enabled'),
    denied: t(locale, 'push.denied'),
    notConfigured: t(locale, 'push.not_configured'),
    promptBanner: t(locale, 'push.prompt_banner'),
    unsupportedDevice: t(locale, 'push.unsupported_device'),
    enableFailed: t(locale, 'push.enable_failed'),
    notNow: t(locale, 'push.not_now'),
  };
}
