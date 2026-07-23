/**
 * Restaurant mobile-app UX tips (Bhartendu Kumar) — discover shortcuts, menu badges, checkout trust.
 * SHC maps table booking → HDB collection slots; push notifications stay out of scope here.
 */

export type DiscoverQuickAction = {
  id: string;
  label: string;
  iconKey: 'restaurant' | 'home' | 'cart' | 'location' | 'orders';
  /** Mobile expo-router path */
  mobileRoute: string;
  /** Web app path */
  webHref: string;
  testID: string;
  accessibilityLabel: string;
};

/** Icon + word quick actions on discover home — common restaurant-app pattern. */
export function discoverQuickActions(): DiscoverQuickAction[] {
  return [
    {
      id: 'browse',
      label: 'Browse',
      iconKey: 'restaurant',
      mobileRoute: '/(customer)/',
      webHref: '/',
      testID: 'quick-action-browse',
      accessibilityLabel: 'Browse dishes and kitchens',
    },
    {
      id: 'tiffin',
      label: 'Tiffin',
      iconKey: 'home',
      mobileRoute: '/(customer)/tiffin',
      webHref: '/tiffin',
      testID: 'quick-action-tiffin',
      accessibilityLabel: 'Explore weekly tiffin plans',
    },
    {
      id: 'cart',
      label: 'Cart',
      iconKey: 'cart',
      mobileRoute: '/(customer)/cart',
      webHref: '/cart',
      testID: 'quick-action-cart',
      accessibilityLabel: 'View your cart',
    },
    {
      id: 'location',
      label: 'Location',
      iconKey: 'location',
      mobileRoute: '/(customer)/location',
      webHref: '/location',
      testID: 'quick-action-location',
      accessibilityLabel: 'Set HDB collection location',
    },
  ];
}

const VEG_KEYWORDS = [
  'vegetable',
  'veggie',
  'salad',
  'tofu',
  'dal',
  'dhal',
  'paneer',
  'acar',
  'sayur',
  'ulam',
  'gado',
  'rojak',
  'thoran',
  'poriyal',
];

const MEAT_KEYWORDS = [
  'chicken',
  'beef',
  'mutton',
  'lamb',
  'pork',
  'fish',
  'prawn',
  'shrimp',
  'seafood',
  'duck',
  'sambal stingray',
  'ikan',
  'ayam',
  'daging',
];

/** Heuristic vegetarian filter when products lack a dedicated flag. */
export function isVegetarianDish(product: Record<string, unknown>): boolean {
  const name = String(product.name || '').toLowerCase();
  const cuisine = String(product.cuisine || '').toLowerCase();
  const tags = (Array.isArray(product.occasion_tags) ? product.occasion_tags : []).map((t) =>
    String(t).toLowerCase()
  );
  const haystack = [name, cuisine, ...tags].join(' ');
  if (MEAT_KEYWORDS.some((k) => haystack.includes(k))) return false;
  if (VEG_KEYWORDS.some((k) => haystack.includes(k))) return true;
  if (tags.some((t) => t.includes('vegetarian') || t.includes('vegan'))) return true;
  return false;
}

/** Popular badge — high rating or top tier among the catalog. */
export function isPopularDish(
  product: Record<string, unknown>,
  allProducts?: Record<string, unknown>[]
): boolean {
  const rating = Number(product.rating ?? 0);
  if (rating >= 4.7) return true;
  if (!allProducts?.length) return false;
  const sorted = [...allProducts]
    .map((p) => Number(p.rating ?? 0))
    .sort((a, b) => b - a);
  const cutoffIndex = Math.max(0, Math.floor(sorted.length * 0.2) - 1);
  const cutoff = sorted[cutoffIndex] ?? 4.5;
  return rating >= cutoff && rating >= 4.5;
}

/** Smooth checkout trust line — no hidden fees, PayNow, final price. */
export function checkoutTrustLine(): string {
  return 'No hidden fees · PayNow · price shown is final';
}

/** Collection ETA hint for kitchen/cart — maps table-booking tip to HDB slots. */
export function collectionEtaHint(area?: string | null): string {
  const place = area?.trim();
  if (place) {
    return `HDB collection near ${place} · slots from 30 min after order`;
  }
  return 'HDB collection · book a slot at checkout · usually ready in 30–60 min';
}
