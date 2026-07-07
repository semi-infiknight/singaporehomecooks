import { t, type MessageKey, type ShcLocale } from './messages';

export type PlatformCountersInput = {
  cooks: number;
  meals_this_month: number;
  areas: number;
};

export type TrustStripItemCopy = {
  cooksLabel: string;
  cooksSub: string;
  mealsLabel: string;
  mealsSub: string;
  allergenLabel: string;
  allergenSub: string;
  paynowLabel: string;
  paynowSub: string;
  collectionLabel: string;
  collectionSub: string;
};

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

function formatCount(n: number, locale: ShcLocale): string {
  return n.toLocaleString(locale === 'zh-Hans' ? 'zh-Hans-SG' : 'en-SG');
}

export function formatTrustStripCopy(locale: ShcLocale, counters: PlatformCountersInput): TrustStripItemCopy {
  const cooks = formatCount(counters.cooks, locale);
  const meals = formatCount(counters.meals_this_month, locale);
  const areas = formatCount(counters.areas, locale);
  const cooksPlus = counters.cooks >= 10 ? '+' : '';

  const msg = (key: MessageKey, vars?: Record<string, string | number>) =>
    interpolate(t(locale, key), vars ?? {});

  return {
    cooksLabel: msg('trust.cooks_label', { count: `${cooks}${cooksPlus}` }),
    cooksSub: msg('trust.cooks_sub', { areas }),
    mealsLabel: msg('trust.meals_label', { count: meals }),
    mealsSub: msg('trust.meals_sub'),
    allergenLabel: msg('trust.allergen_label'),
    allergenSub: msg('trust.allergen_sub'),
    paynowLabel: msg('trust.paynow_label'),
    paynowSub: msg('trust.paynow_sub'),
    collectionLabel: msg('trust.collection_label'),
    collectionSub: msg('trust.collection_sub'),
  };
}
