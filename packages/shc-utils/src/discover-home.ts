/**
 * Discover home greeting — HomelyEats “Hi {name}” personalization.
 */

import { DEFAULT_PROMOS, PROMO_BANNER_IMAGES, type PromoBannerKey } from './food-visuals';
import { occasionBrowseRoute } from './occasion-browse';

export type DiscoverHomePromo = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  iconKey?: 'discover' | 'home' | 'people';
  mobileRoute: string;
  webRoute: string;
  occasionFilter?: string;
};

const PROMO_ICON: Partial<Record<string, DiscoverHomePromo['iconKey']>> = {
  'promo-tiffin': 'home',
  'promo-raya': 'people',
  'promo-request': 'discover',
  'promo-family': 'people',
};

const PROMO_ROUTES: Record<string, Pick<DiscoverHomePromo, 'mobileRoute' | 'webRoute' | 'occasionFilter'>> = {
  'promo-tiffin': { mobileRoute: '/(customer)/tiffin', webRoute: '/tiffin' },
  'promo-raya': {
    mobileRoute: occasionBrowseRoute('Hari Raya').mobile,
    webRoute: occasionBrowseRoute('Hari Raya').web,
  },
  'promo-request': { mobileRoute: '/(customer)/request', webRoute: '/request' },
  'promo-family': { mobileRoute: '/(customer)/tiffin', webRoute: '/tiffin' },
  'promo-paynow': { mobileRoute: '/(customer)/cart', webRoute: '/cart' },
};

/** Image-led promo carousel for discover home — tiffin, events, offers. */
export function discoverHomePromoCarousel(): DiscoverHomePromo[] {
  return DEFAULT_PROMOS.map((promo) => {
    const routes = PROMO_ROUTES[promo.id] ?? { mobileRoute: '/(customer)/', webRoute: '/' };
    return {
      id: promo.id,
      title: promo.title,
      subtitle: promo.subtitle,
      badge: promo.badge,
      imageUrl: PROMO_BANNER_IMAGES[promo.imageKey as PromoBannerKey],
      iconKey: PROMO_ICON[promo.id],
      ...routes,
    };
  });
}

function greetingFirstName(name?: string | null, email?: string | null): string | null {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0] ?? null;
  const mail = email?.trim();
  if (mail?.includes('@')) {
    const local = mail.split('@')[0]?.trim();
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return null;
}

export function discoverHomeHeadline(userName?: string | null, userEmail?: string | null): {
  headline: string;
  subtitle?: string;
} {
  const first = greetingFirstName(userName, userEmail);
  if (first) {
    return {
      headline: `Hi, ${first}`,
      subtitle: 'What would you like today?',
    };
  }
  return { headline: 'Hungry? Order & Eat.' };
}
