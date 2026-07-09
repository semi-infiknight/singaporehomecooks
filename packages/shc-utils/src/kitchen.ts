/**
 * Kitchen detail helpers — scope dishes to one cook/kitchen (Jakob’s Law restaurant page).
 * Pure functions for cook profile + tiffin kitchen screens.
 */

export type KitchenIdentity = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  name?: string | null;
  area?: string | null;
  story?: string | null;
  cuisine?: string | null;
  primary_cuisine?: string | null;
  rating?: number | null;
  review_count?: number | null;
  orders?: number | null;
  subscriber_count?: number | null;
  status?: string | null;
  sfa_reg_number?: string | null;
  collection_instructions?: string | null;
  collection_address?: string | null;
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Products belonging to a kitchen. Matches cook_id, slug-in-id, or cook display name.
 * Returns [] when cook identity is missing or no dishes match (honest empty menu).
 */
export function scopeProductsByKitchen(
  products: Record<string, unknown>[],
  cook: KitchenIdentity | null | undefined
): Record<string, unknown>[] {
  if (!cook) return [];
  const cookId = cook.id ? String(cook.id) : '';
  const slug = cook.slug ? String(cook.slug) : '';
  const names = new Set<string>();
  if (cook.display_name) names.add(normalizeName(String(cook.display_name)));
  if (cook.name) names.add(normalizeName(String(cook.name)));
  if (cook.display_name) {
    // "Auntie Rose (Tampines)" → also match "Auntie Rose"
    names.add(normalizeName(String(cook.display_name).split('(')[0] || ''));
  }
  names.delete('');

  if (!cookId && !slug && names.size === 0) return [];

  return products.filter((p) => {
    const pid = String(p.cook_id || '');
    if (cookId && pid === cookId) return true;
    if (slug && (pid === slug || pid.includes(slug) || String(p.cook_slug || '') === slug)) return true;
    const pName = normalizeName(String(p.cook_name || p.cook_display_name || ''));
    if (pName && names.has(pName)) return true;
    // partial: product cook_name contains kitchen first name token
    for (const n of names) {
      if (n.length >= 4 && (pName.includes(n) || n.includes(pName))) return true;
    }
    return false;
  });
}

/** Rating label for kitchen hero, e.g. "4.8 (12)". */
export function kitchenRatingLabel(
  rating?: number | null,
  reviewCount?: number | null
): string | null {
  if (rating == null || !Number.isFinite(Number(rating))) return null;
  const r = Number(rating).toFixed(1);
  if (reviewCount != null && Number(reviewCount) > 0) return `${r} (${reviewCount})`;
  return r;
}

/** Open/closed + collection hint for familiar food-app status row. */
export function kitchenOpenStatus(cook?: KitchenIdentity | null): {
  isOpen: boolean;
  label: string;
  detail: string;
} {
  const status = String(cook?.status || 'active').toLowerCase();
  const closed = status === 'paused' || status === 'inactive' || status === 'suspended';
  return {
    isOpen: !closed,
    label: closed ? 'Closed' : 'Open',
    detail: cook?.collection_instructions
      ? String(cook.collection_instructions).slice(0, 60)
      : 'HDB collection evenings',
  };
}

/** Short tags under the hero (cuisine, area, trust). */
export function kitchenTagList(cook?: KitchenIdentity | null): string[] {
  if (!cook) return [];
  const tags: string[] = [];
  const cuisine = cook.primary_cuisine || cook.cuisine;
  if (cuisine) tags.push(String(cuisine));
  if (cook.area) tags.push(String(cook.area));
  if (cook.sfa_reg_number) tags.push('SFA registered');
  if (cook.subscriber_count != null && Number(cook.subscriber_count) > 0) {
    tags.push(`${cook.subscriber_count} subscribers`);
  } else if (cook.orders != null && Number(cook.orders) > 0) {
    tags.push(`${cook.orders}+ orders`);
  }
  return tags.slice(0, 5);
}

/** Plan rows for tiffin kitchen (meals/week options → display). */
export function kitchenTiffinPlanRows(
  mealsOptions: number[] = [2, 3, 4],
  priceForMeals: (n: number) => number
): Array<{ meals: number; pricePerMeal: number; label: string }> {
  return mealsOptions.map((meals) => ({
    meals,
    pricePerMeal: priceForMeals(meals),
    label: `${meals} meals / week`,
  }));
}

/**
 * Dish price in SGD dollars for kitchen menu badges (matches GourmeatDishCard: S${price}).
 * Prefer explicit `price` as dollars. If only `price_cents` is set, convert cents → dollars.
 * Never apply “price > 50 means cents” heuristics (breaks S$60 → S$1).
 */
export function kitchenDishPriceDollars(dish: {
  price?: number | null;
  price_cents?: number | null;
}): number | null {
  if (dish.price != null && Number.isFinite(Number(dish.price))) {
    return Number(dish.price);
  }
  if (dish.price_cents != null && Number.isFinite(Number(dish.price_cents))) {
    return Number(dish.price_cents) / 100;
  }
  return null;
}

/** Format kitchen dish price label e.g. "S$12". */
export function kitchenDishPriceLabel(dish: {
  price?: number | null;
  price_cents?: number | null;
}): string | null {
  const dollars = kitchenDishPriceDollars(dish);
  if (dollars == null) return null;
  // Whole dollars when integer; else 2dp
  if (Number.isInteger(dollars)) return `S$${dollars}`;
  return `S$${dollars.toFixed(2)}`;
}

/* ── HomelyEats kitchen subpages: ratings, reviews, about, collection hours ── */

export type KitchenReview = {
  id: string;
  author: string;
  rating: number;
  body: string;
  daysAgo: number;
  hasPhoto?: boolean;
};

export type KitchenRatingBucket = {
  key: 'excellent' | 'very_good' | 'average' | 'poor' | 'terrible';
  label: string;
  /** 0–1 share of reviews */
  share: number;
};

export type KitchenHourSlot = {
  id: string;
  label: string;
  window: string;
};

const RATING_LABELS: Record<KitchenRatingBucket['key'], string> = {
  excellent: 'Excellent',
  very_good: 'Very good',
  average: 'Average',
  poor: 'Poor',
  terrible: 'Terrible',
};

function hashSeed(s: string): number {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Effective rating + count for hero (defaults when cook has no aggregates). */
export function kitchenRatingSummary(cook?: KitchenIdentity | null): {
  rating: number;
  reviewCount: number;
  label: string;
} {
  const rating =
    cook?.rating != null && Number.isFinite(Number(cook.rating)) ? Number(cook.rating) : 4.8;
  const reviewCount =
    cook?.review_count != null && Number(cook.review_count) > 0
      ? Number(cook.review_count)
      : cook?.orders != null && Number(cook.orders) > 0
        ? Math.min(Number(cook.orders), 99)
        : 24;
  return {
    rating,
    reviewCount,
    label: `${rating.toFixed(1)} (${reviewCount})`,
  };
}

/**
 * Distribution bars for rating breakdown (HomelyEats).
 * Skews higher when average rating is high — pure, deterministic.
 */
export function kitchenRatingBuckets(averageRating: number): KitchenRatingBucket[] {
  const r = Math.min(5, Math.max(1, averageRating));
  // Approximate shares that peak near the average star band
  const raw = [0.05, 0.1, 0.15, 0.25, 0.45]; // terrible → excellent base
  if (r >= 4.5) {
    raw[0] = 0.02;
    raw[1] = 0.03;
    raw[2] = 0.08;
    raw[3] = 0.22;
    raw[4] = 0.65;
  } else if (r >= 4.0) {
    raw[0] = 0.03;
    raw[1] = 0.07;
    raw[2] = 0.15;
    raw[3] = 0.35;
    raw[4] = 0.4;
  } else if (r >= 3.0) {
    raw[0] = 0.08;
    raw[1] = 0.15;
    raw[2] = 0.35;
    raw[3] = 0.28;
    raw[4] = 0.14;
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  // Return excellent-first for UI (HomelyEats order)
  return (['excellent', 'very_good', 'average', 'poor', 'terrible'] as const).map((key, i) => ({
    key,
    label: RATING_LABELS[key],
    share: raw[4 - i] / sum,
  }));
}

/**
 * Deterministic community reviews for a kitchen (until cook-level review API).
 * Seeded by cook id so the same kitchen always shows the same sample set.
 */
export function kitchenDemoReviews(cookId: string, count = 6): KitchenReview[] {
  const seed = hashSeed(cookId || 'kitchen');
  const authors = [
    'Mei Ling',
    'Priya S.',
    'Aisha R.',
    'David Tan',
    'Siti N.',
    'Wei Jie',
    'Hannah L.',
    'Raj K.',
  ];
  const bodies = [
    'Excellent home-cooked meals. Good quantity and taste. Collection was smooth at the HDB lobby.',
    'Food is really good. Would appreciate if portions can be slightly larger for family orders.',
    'Been ordering for months. Packaging is careful and the menu has real heritage options.',
    'Authentic flavours — tastes like my auntie’s kitchen. Clear allergen notes too.',
    'On-time collection window. Dish was still warm and well packed for the MRT ride home.',
    'Great for festive gatherings. Ordered ahead for our reunion and everything arrived as planned.',
  ];
  const n = Math.min(count, authors.length, bodies.length);
  const out: KitchenReview[] = [];
  for (let i = 0; i < n; i++) {
    const idx = (seed + i * 3) % authors.length;
    const rating = 5 - ((seed + i) % 5 === 0 ? 1 : 0) - ((seed + i) % 7 === 0 ? 1 : 0);
    out.push({
      id: `rev_${cookId}_${i}`,
      author: authors[idx],
      rating: Math.max(3, Math.min(5, rating)),
      body: bodies[(seed + i) % bodies.length],
      daysAgo: 1 + ((seed + i * 5) % 21),
      hasPhoto: (seed + i) % 3 === 0,
    });
  }
  return out;
}

export type KitchenReviewSort = 'recent' | 'highest' | 'lowest' | 'photos';

export function sortKitchenReviews(
  reviews: KitchenReview[],
  sort: KitchenReviewSort
): KitchenReview[] {
  const list = [...reviews];
  if (sort === 'highest') list.sort((a, b) => b.rating - a.rating || a.daysAgo - b.daysAgo);
  else if (sort === 'lowest') list.sort((a, b) => a.rating - b.rating || a.daysAgo - b.daysAgo);
  else if (sort === 'photos') list.sort((a, b) => Number(b.hasPhoto) - Number(a.hasPhoto) || a.daysAgo - b.daysAgo);
  else list.sort((a, b) => a.daysAgo - b.daysAgo);
  return list;
}

/** SHC collection windows (HDB) — HomelyEats “delivery hours” analogue. */
export function kitchenCollectionHours(opts?: {
  collection_days?: number[];
  collection_instructions?: string | null;
}): KitchenHourSlot[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = opts?.collection_days?.length
    ? opts.collection_days.map((d) => dayNames[d] || `Day ${d}`).join(', ')
    : 'Fri, Sat, Sun';
  return [
    {
      id: 'evening',
      label: 'Evening collection',
      window: `${days} · 5:00 pm – 8:00 pm`,
    },
    {
      id: 'lunch',
      label: 'Weekend lunch',
      window: 'Sat, Sun · 11:30 am – 1:30 pm',
    },
    {
      id: 'note',
      label: 'How it works',
      window: opts?.collection_instructions
        ? String(opts.collection_instructions).slice(0, 120)
        : 'Collect from HDB lobby after cook accepts — exact slot on your order.',
    },
  ];
}

/** Trust bullets for About kitchen (hygiene / care — HomelyEats about page). */
export function kitchenAboutPoints(cook?: KitchenIdentity | null): string[] {
  const points = [
    'Home kitchen · heritage recipes',
    'Allergen disclosure on every dish',
    'HDB collection only (no stranger delivery)',
    'Clear receipts for every order',
  ];
  if (cook?.sfa_reg_number) points.unshift('SFA-aware kitchen practices');
  return points;
}

/** Group dishes into expandable meal sections (occasion / cuisine). */
export function kitchenMenuSections(
  products: Record<string, unknown>[]
): Array<{ id: string; title: string; subtitle: string; dishes: Record<string, unknown>[] }> {
  if (!products.length) return [];
  const byOccasion = new Map<string, Record<string, unknown>[]>();
  for (const p of products) {
    const tags = Array.isArray(p.occasion_tags) ? (p.occasion_tags as string[]) : [];
    const key = tags[0] || (p.cuisine ? String(p.cuisine) : 'Signature dishes');
    if (!byOccasion.has(key)) byOccasion.set(key, []);
    byOccasion.get(key)!.push(p);
  }
  return Array.from(byOccasion.entries()).map(([title, dishes]) => ({
    id: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    subtitle: 'HDB collection · order ahead for best slots',
    dishes,
  }));
}
