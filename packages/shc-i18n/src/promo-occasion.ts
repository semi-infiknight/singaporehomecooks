import { t, type ShcLocale } from './messages';

export type LocalizedPromo = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
};

export type LocalizedOccasion = {
  id: string;
  label: string;
  chipLabel: string;
};

const WEB_PROMO_IDS = ['promo-raya', 'promo-credits', 'promo-family', 'promo-paynow'] as const;
const MOBILE_PROMO_IDS = ['hari-raya', 'credits', 'paynow'] as const;

const PROMO_KEY_MAP: Record<string, 'hari_raya' | 'credits' | 'family' | 'paynow'> = {
  'promo-raya': 'hari_raya',
  'hari-raya': 'hari_raya',
  'promo-credits': 'credits',
  credits: 'credits',
  'promo-family': 'family',
  'promo-paynow': 'paynow',
  paynow: 'paynow',
};

function promoMsg(locale: ShcLocale, key: string, field: 'title' | 'subtitle' | 'badge'): string {
  return t(locale, `promo.${key}.${field}` as any);
}

export function getLocalizedPromo(locale: ShcLocale, id: string): LocalizedPromo | null {
  const key = PROMO_KEY_MAP[id];
  if (!key) return null;
  const badge = promoMsg(locale, key, 'badge');
  return {
    id,
    title: promoMsg(locale, key, 'title'),
    subtitle: promoMsg(locale, key, 'subtitle'),
    badge: badge || undefined,
  };
}

export function getWebLocalizedPromos(locale: ShcLocale): LocalizedPromo[] {
  return WEB_PROMO_IDS.map((id) => getLocalizedPromo(locale, id)!);
}

export function getMobileLocalizedPromos(locale: ShcLocale): LocalizedPromo[] {
  return MOBILE_PROMO_IDS.map((id) => getLocalizedPromo(locale, id)!);
}

const OCCASION_ENTRIES: Array<{ id: string; key: string; chipKey?: string }> = [
  { id: '', key: 'all', chipKey: 'all' },
  { id: 'Hari Raya', key: 'hari_raya' },
  { id: 'Deepavali', key: 'deepavali' },
  { id: 'Chinese New Year', key: 'cny', chipKey: 'cny_short' },
  { id: 'Family Gathering', key: 'family_gathering', chipKey: 'family_short' },
  { id: 'Birthday', key: 'birthday' },
  { id: 'Wedding', key: 'wedding', chipKey: 'wedding_short' },
  { id: 'Christmas', key: 'christmas' },
];

export function getLocalizedOccasions(locale: ShcLocale): LocalizedOccasion[] {
  return OCCASION_ENTRIES.map(({ id, key, chipKey }) => ({
    id,
    label: t(locale, `occasion.${key}` as any),
    chipLabel: t(locale, `occasion.${chipKey || key}` as any),
  }));
}

export function getOccasionDishesTitle(locale: ShcLocale, occasionFilter: string): string {
  if (!occasionFilter) return t(locale, 'discover.popular_near_you');
  const match = OCCASION_ENTRIES.find((o) => o.id === occasionFilter);
  const name = match ? t(locale, `occasion.${match.chipKey || match.key}` as any) : occasionFilter.split(' ')[0];
  return t(locale, 'discover.occasion_dishes').replace('{occasion}', name);
}
