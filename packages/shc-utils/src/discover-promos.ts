/**
 * Discover home promo carousel — admin-managed via platform stat, with code defaults.
 */

import {
  DEFAULT_PROMOS,
  PROMO_BANNER_IMAGES,
  resolveImageUrl,
  type PromoBannerKey,
} from './food-visuals';
import { occasionBrowseRoute } from './occasion-browse';

export const DISCOVER_PROMOS_STAT_KEY = 'discover_promo_carousel';

export type DiscoverPromoIconKey = 'discover' | 'home' | 'people';

/** Stored shape (snake_case) in platform stat + admin API. */
export type DiscoverPromoConfig = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image_url: string;
  icon_key?: DiscoverPromoIconKey;
  mobile_route: string;
  web_route: string;
  occasion_filter?: string;
  enabled: boolean;
  sort_order: number;
};

/** Client carousel slide (camelCase). */
export type DiscoverHomePromo = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  iconKey?: DiscoverPromoIconKey;
  mobileRoute: string;
  webRoute: string;
  occasionFilter?: string;
};

const PROMO_ICON: Partial<Record<string, DiscoverPromoIconKey>> = {
  'promo-tiffin': 'home',
  'promo-raya': 'people',
  'promo-request': 'discover',
  'promo-family': 'people',
};

const PROMO_ROUTES: Record<
  string,
  Pick<DiscoverPromoConfig, 'mobile_route' | 'web_route' | 'occasion_filter'>
> = {
  'promo-tiffin': { mobile_route: '/(customer)/tiffin', web_route: '/tiffin' },
  'promo-raya': {
    mobile_route: occasionBrowseRoute('Hari Raya').mobile,
    web_route: occasionBrowseRoute('Hari Raya').web,
    occasion_filter: 'Hari Raya',
  },
  'promo-request': { mobile_route: '/(customer)/request', web_route: '/request' },
  'promo-family': { mobile_route: '/(customer)/tiffin', web_route: '/tiffin' },
  'promo-paynow': { mobile_route: '/(customer)/cart', web_route: '/cart' },
};

export function defaultDiscoverPromoConfigs(): DiscoverPromoConfig[] {
  return DEFAULT_PROMOS.map((promo, i) => {
    const routes = PROMO_ROUTES[promo.id] ?? { mobile_route: '/(customer)/', web_route: '/' };
    return {
      id: promo.id,
      title: promo.title,
      subtitle: promo.subtitle,
      badge: promo.badge,
      image_url: PROMO_BANNER_IMAGES[promo.imageKey as PromoBannerKey],
      icon_key: PROMO_ICON[promo.id],
      mobile_route: routes.mobile_route,
      web_route: routes.web_route,
      occasion_filter: routes.occasion_filter,
      enabled: true,
      sort_order: (i + 1) * 10,
    };
  });
}

export function normalizeDiscoverPromoConfigs(raw: unknown): DiscoverPromoConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultDiscoverPromoConfigs().map((c) => ({ ...c }));
  }
  return raw
    .map((row: any, i: number) => ({
      id: String(row.id || `promo_${i}`).trim(),
      title: String(row.title || '').trim(),
      subtitle: String(row.subtitle || '').trim(),
      badge: row.badge ? String(row.badge).trim() : undefined,
      image_url: String(row.image_url || row.imageUrl || '').trim(),
      icon_key: row.icon_key || row.iconKey || undefined,
      mobile_route: String(row.mobile_route || row.mobileRoute || '/(customer)/').trim(),
      web_route: String(row.web_route || row.webRoute || '/').trim(),
      occasion_filter: row.occasion_filter || row.occasionFilter
        ? String(row.occasion_filter || row.occasionFilter).trim()
        : undefined,
      enabled: row.enabled !== false,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : (i + 1) * 10,
    }))
    .filter((c) => c.id && c.title)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function discoverPromoConfigsToSlides(configs: DiscoverPromoConfig[]): DiscoverHomePromo[] {
  return configs
    .filter((c) => c.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      badge: c.badge,
      imageUrl: resolveImageUrl(c.image_url) || c.image_url,
      iconKey: c.icon_key,
      mobileRoute: c.mobile_route,
      webRoute: c.web_route,
      occasionFilter: c.occasion_filter || undefined,
    }))
    .filter((c) => c.imageUrl);
}

/** Default carousel slides when API has no admin overrides. */
export function discoverHomePromoCarousel(): DiscoverHomePromo[] {
  return discoverPromoConfigsToSlides(defaultDiscoverPromoConfigs());
}
