/** Platform-agnostic food imagery — used by web + both mobile apps. */

const img = (photoId: string, w = 800) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=80&auto=format&fit=crop`;

export const DISH_IMAGE_BY_ID: Record<string, string> = {
  dish_nasi_lemak_sambal_prawn_001: img('photo-1512058564366-7f7d7ae6d47d', 900),
  dish_ayam_buah_keluak_002: img('photo-1585937421612-70a008356fbe', 900),
  dish_devils_curry_003: img('photo-1596797038530-2c107229654b', 900),
};

export const CUISINE_IMAGE: Record<string, string> = {
  Peranakan: img('photo-1603133872878-684f208fb84a', 800),
  Eurasian: img('photo-1596797038530-2c107229654b', 800),
  Malay: img('photo-1563245372-f21724e3856d', 800),
  Chinese: img('photo-1525755662778-989dcdf1cd25', 800),
  Indian: img('photo-1589302168064-964664aafa85', 800),
};

/** Zomato "What's on your mind?" cuisine circles — heritage SG kitchens */
export const MIND_CUISINE_CATEGORIES: Array<{ id: string; label: string; imageUrl: string }> = [
  { id: '', label: 'All', imageUrl: img('photo-1546069901-ba9599a1e63c', 400) },
  { id: 'Peranakan', label: 'Nyonya', imageUrl: CUISINE_IMAGE.Peranakan },
  { id: 'Malay', label: 'Malay', imageUrl: CUISINE_IMAGE.Malay },
  { id: 'Chinese', label: 'Chinese', imageUrl: CUISINE_IMAGE.Chinese },
  { id: 'Indian', label: 'Indian', imageUrl: CUISINE_IMAGE.Indian },
  { id: 'Eurasian', label: 'Eurasian', imageUrl: CUISINE_IMAGE.Eurasian },
];

export const COOK_KITCHEN_HERO = img('photo-1556911220-bff31c812dba', 900);
export const COLLECTION_SLOT_LABELS = ['Sat 6pm', 'Sun 12pm', 'Fri 7pm', 'Collect HDB'];

export const OCCASION_IMAGE: Record<string, string> = {
  '': img('photo-1546069901-ba9599a1e63c', 400),
  'Hari Raya': img('photo-1544025162-d76694265947', 400),
  Deepavali: img('photo-1589302168064-964664aafa85', 400),
  'Chinese New Year': img('photo-1525755662778-989dcdf1cd25', 400),
  'Family Gathering': img('photo-1556910103-1c02745aae4d', 400),
  Birthday: img('photo-1578985545062-69928b1d9587', 400),
  Wedding: img('photo-1464349095439-9a172c786ab5', 400),
  Christmas: img('photo-1482049016688-a3be451caed7', 400),
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
  cart: img('photo-1546069901-ba9599a1e63c', 500),
  checkout: img('photo-1414235077428-338989a2e8c0', 500),
  orders: img('photo-1414235077428-338989a2e8c0', 500),
  credits: img('photo-1504674900247-0877df9cc836', 500),
  request: img('photo-1555939594-58d7cb561ad1', 500),
  listings: img('photo-1556911220-bff31c812dba', 500),
  earnings: img('photo-1504674900247-0877df9cc836', 500),
  compliance: img('photo-1556911220-e6b0d55b4e0c', 500),
} as const;

/** Zomato-style horizontal promo banner backgrounds */
export const PROMO_BANNER_IMAGES = {
  hariRaya: img('photo-1544025162-d76694265947', 640),
  credits: img('photo-1504674900247-0877df9cc836', 640),
  newCook: img('photo-1556911220-bff31c812dba', 640),
  family: img('photo-1556910103-1c02745aae4d', 640),
  paynow: img('photo-1414235077428-338989a2e8c0', 640),
} as const;

export type PromoBannerKey = keyof typeof PROMO_BANNER_IMAGES;

export const DEFAULT_PROMOS: Array<{
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageKey: PromoBannerKey;
}> = [
  { id: 'promo-raya', title: 'Hari Raya spreads', subtitle: 'Order 3 days ahead', badge: '20% OFF', imageKey: 'hariRaya' },
  { id: 'promo-credits', title: 'Home Credits', subtitle: 'Earn 5% on every order', badge: 'NEW', imageKey: 'credits' },
  { id: 'promo-family', title: 'Family feasts', subtitle: 'Min portions for parties', imageKey: 'family' },
  { id: 'promo-paynow', title: 'PayNow checkout', subtitle: 'Instant confirmation', imageKey: 'paynow' },
];

const DEFAULT_DISH = img('photo-1563245372-f21724e3856d', 900);

export function getDishImageUrl(opts: {
  id?: string;
  cuisine?: string;
  name?: string;
}): string {
  if (opts.id && DISH_IMAGE_BY_ID[opts.id]) return DISH_IMAGE_BY_ID[opts.id];
  const lower = (opts.name || '').toLowerCase();
  if (lower.includes('nasi') || lower.includes('lemak')) return DISH_IMAGE_BY_ID.dish_nasi_lemak_sambal_prawn_001;
  if (lower.includes('keluak') || lower.includes('ayam')) return DISH_IMAGE_BY_ID.dish_ayam_buah_keluak_002;
  if (lower.includes('curry') || lower.includes('devil')) return DISH_IMAGE_BY_ID.dish_devils_curry_003;
  if (opts.cuisine && CUISINE_IMAGE[opts.cuisine]) return CUISINE_IMAGE[opts.cuisine];
  return DEFAULT_DISH;
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
    img('photo-1556910103-1c02745aae4d', 900),
    img('photo-1414235077428-338989a2e8c0', 900),
    img('photo-1504674900247-0877df9cc836', 900),
  ];
  return heroes[n % heroes.length];
}

/** Stable collection slot label for list cards (Zomato delivery-time analogue). */
export function getCollectionSlotLabel(id?: string): string {
  if (!id) return COLLECTION_SLOT_LABELS[0];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLLECTION_SLOT_LABELS[n % COLLECTION_SLOT_LABELS.length];
}