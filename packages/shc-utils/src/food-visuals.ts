/** Platform-agnostic food imagery — used by web + both mobile apps. */

/** Verified Unsplash photo IDs (404-checked 2026-07). Do not swap without re-checking GET. */
const PHOTOS = {
  all: 'photo-1414235077428-338989a2e8c0',
  spread: 'photo-1544025162-d76694265947',
  curry: 'photo-1596797038530-2c107229654b',
  riceBowl: 'photo-1585937421612-70a008356fbe',
  malay: 'photo-1563245372-f21724e3856d',
  chinese: 'photo-1498654896293-37aacf113fd9',
  salad: 'photo-1540189549336-e6e99c3679fe',
  grill: 'photo-1555939594-58d7cb561ad1',
  pizza: 'photo-1565299624946-b28f40a0ae38',
  kitchen: 'photo-1556911220-bff31c812dba',
  family: 'photo-1556910103-1c02745aae4d',
  restaurant: 'photo-1414235077428-338989a2e8c0',
  brunch: 'photo-1504674900247-0877df9cc836',
  birthday: 'photo-1578985545062-69928b1d9587',
  pancakes: 'photo-1567620905732-2d1ec7ab7445',
} as const;

const img = (photoId: string, w = 800) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=80&auto=format&fit=crop`;

export const DISH_IMAGE_BY_ID: Record<string, string> = {
  dish_nasi_lemak_sambal_prawn_001: img(PHOTOS.riceBowl, 900),
  dish_ayam_buah_keluak_002: img(PHOTOS.curry, 900),
  dish_devils_curry_003: img(PHOTOS.curry, 900),
};

export const CUISINE_IMAGE: Record<string, string> = {
  Peranakan: img(PHOTOS.curry, 800),
  Eurasian: img(PHOTOS.grill, 800),
  Malay: img(PHOTOS.malay, 800),
  Chinese: img(PHOTOS.chinese, 800),
  Indian: img(PHOTOS.riceBowl, 800),
};

/** Zomato "What's on your mind?" cuisine circles — heritage SG kitchens */
export const MIND_CUISINE_CATEGORIES: Array<{ id: string; label: string; imageUrl: string }> = [
  { id: '', label: 'All', imageUrl: img(PHOTOS.all, 400) },
  { id: 'Peranakan', label: 'Nyonya', imageUrl: CUISINE_IMAGE.Peranakan },
  { id: 'Malay', label: 'Malay', imageUrl: CUISINE_IMAGE.Malay },
  { id: 'Chinese', label: 'Chinese', imageUrl: CUISINE_IMAGE.Chinese },
  { id: 'Indian', label: 'Indian', imageUrl: CUISINE_IMAGE.Indian },
  { id: 'Eurasian', label: 'Eurasian', imageUrl: CUISINE_IMAGE.Eurasian },
];

export const COOK_KITCHEN_HERO = img(PHOTOS.kitchen, 900);
export const COLLECTION_SLOT_LABELS = ['Sat 6pm', 'Sun 12pm', 'Fri 7pm', 'Collect HDB'];

export const OCCASION_IMAGE: Record<string, string> = {
  '': img(PHOTOS.all, 400),
  'Hari Raya': img(PHOTOS.spread, 400),
  Deepavali: img(PHOTOS.riceBowl, 400),
  'Chinese New Year': img(PHOTOS.chinese, 400),
  'Family Gathering': img(PHOTOS.family, 400),
  Birthday: img(PHOTOS.birthday, 400),
  Wedding: img(PHOTOS.family, 400),
  Christmas: img(PHOTOS.spread, 400),
};

export const OCCASION_EMOJI: Record<string, string> = {
  '': '🍽️',
  'Hari Raya': '🌙',
  Deepavali: '🪔',
  'Chinese New Year': '🧧',
  'Family Gathering': '👨‍👩‍👧',
  Birthday: '🎂',
  Wedding: '💒',
  Christmas: '🎄',
};

export const BENTO_ACTION_IMAGES = {
  cart: img(PHOTOS.pizza, 500),
  checkout: img(PHOTOS.restaurant, 500),
  orders: img(PHOTOS.restaurant, 500),
  request: img(PHOTOS.grill, 500),
  listings: img(PHOTOS.kitchen, 500),
  earnings: img(PHOTOS.brunch, 500),
  compliance: img(PHOTOS.kitchen, 500),
} as const;

/** Zomato-style horizontal promo banner backgrounds */
export const PROMO_BANNER_IMAGES = {
  hariRaya: img(PHOTOS.spread, 640),
  request: img(PHOTOS.grill, 640),
  newCook: img(PHOTOS.kitchen, 640),
  family: img(PHOTOS.family, 640),
  paynow: img(PHOTOS.restaurant, 640),
} as const;

export type PromoBannerKey = keyof typeof PROMO_BANNER_IMAGES;

export const DEFAULT_PROMOS: Array<{
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageKey: PromoBannerKey;
}> = [
  { id: 'promo-tiffin', title: 'Weekly tiffin', subtitle: '2–4 meals from one kitchen', badge: 'Subscribe', imageKey: 'family' },
  { id: 'promo-raya', title: 'Hari Raya spreads', subtitle: 'Order 3 days ahead', badge: '20% OFF', imageKey: 'hariRaya' },
  { id: 'promo-request', title: 'Request a dish', subtitle: 'Custom occasion menu', badge: 'Custom', imageKey: 'request' },
  { id: 'promo-family', title: 'Family feasts', subtitle: 'Min portions for parties', imageKey: 'family' },
  { id: 'promo-paynow', title: 'PayNow checkout', subtitle: 'Instant confirmation', imageKey: 'paynow' },
];

const DEFAULT_DISH = img(PHOTOS.malay, 900);

export function resolveImageUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  return undefined;
}

export function getDishImageUrl(opts: {
  id?: string;
  cuisine?: string;
  name?: string;
  image_url?: string | null;
}): string {
  const resolved = resolveImageUrl(opts.image_url);
  if (resolved) return resolved;
  if (opts.id && DISH_IMAGE_BY_ID[opts.id]) return DISH_IMAGE_BY_ID[opts.id];
  const lower = (opts.name || '').toLowerCase();
  if (lower.includes('nasi') || lower.includes('lemak')) return DISH_IMAGE_BY_ID.dish_nasi_lemak_sambal_prawn_001;
  if (lower.includes('keluak') || lower.includes('ayam')) return DISH_IMAGE_BY_ID.dish_ayam_buah_keluak_002;
  if (lower.includes('curry') || lower.includes('devil')) return DISH_IMAGE_BY_ID.dish_devils_curry_003;
  if (opts.cuisine && CUISINE_IMAGE[opts.cuisine]) return CUISINE_IMAGE[opts.cuisine];
  return DEFAULT_DISH;
}

/** Cooking-soon batch / drop card imagery */
export function getDropImageUrl(opts: {
  title?: string;
  image_url?: string | null;
  cook_id?: string;
  cuisine?: string;
}): string {
  return getDishImageUrl({
    id: opts.cook_id,
    name: opts.title,
    cuisine: opts.cuisine,
    image_url: opts.image_url,
  });
}

export function getOccasionImageUrl(occasion: string): string {
  return OCCASION_IMAGE[occasion] ?? OCCASION_IMAGE[''];
}

export function getCookAvatarUrl(cookId?: string, name?: string): string {
  const label = encodeURIComponent((name || cookId || 'Cook').slice(0, 16));
  return `https://ui-avatars.com/api/?name=${label}&background=D96C4A&color=fff&size=128&bold=true`;
}

export function getCookKitchenHeroUrl(cookId?: string): string {
  if (!cookId) return COOK_KITCHEN_HERO;
  const n = cookId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const heroes = [
    COOK_KITCHEN_HERO,
    img(PHOTOS.family, 900),
    img(PHOTOS.restaurant, 900),
    img(PHOTOS.brunch, 900),
  ];
  return heroes[n % heroes.length];
}

/** @deprecated Do not use for browse cards — only show collection_slot when API sends it. */
export function getCollectionSlotLabel(id?: string): string {
  if (!id) return COLLECTION_SLOT_LABELS[0];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLLECTION_SLOT_LABELS[n % COLLECTION_SLOT_LABELS.length];
}
