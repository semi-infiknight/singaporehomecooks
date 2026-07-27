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
  availability_paused?: boolean | null;
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
  const paused = Boolean(cook?.availability_paused);
  const closed =
    paused || status === 'paused' || status === 'inactive' || status === 'suspended';
  return {
    isOpen: !closed,
    label: closed ? (paused ? 'Paused' : 'Closed') : 'Open',
    detail: cook?.collection_instructions
      ? String(cook.collection_instructions).slice(0, 60)
      : 'HDB collection evenings',
  };
}

/** Props for kitchen list cards on tiffin browse screens only — not discover home. */
export function kitchenCardOpenProps(cook?: KitchenIdentity | null): {
  isOpen?: boolean;
  closesAt?: string;
} {
  if (!cook) return {};
  const open = kitchenOpenStatus(cook);
  return { isOpen: open.isOpen, closesAt: open.detail };
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

// function hashSeed(s: string): number {
//   return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
// }

/** Effective rating + count for kitchen hero — null when API sends no rating (never invent 4.8). */
export function kitchenRatingSummary(cook?: KitchenIdentity | null): {
  rating: number;
  reviewCount?: number;
  label: string;
} | null {
  const rating =
    cook?.rating != null && Number.isFinite(Number(cook.rating)) ? Number(cook.rating) : null;
  if (rating == null) return null;
  const reviewCount =
    cook?.review_count != null && Number(cook.review_count) > 0
      ? Number(cook.review_count)
      : undefined;
  const label = kitchenRatingLabel(rating, reviewCount) ?? rating.toFixed(1);
  return { rating, reviewCount, label };
}

function daysAgoFromIso(iso?: string | null): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Map API review row → kitchen UI model. */
export function kitchenReviewFromApi(row: {
  id: string;
  rating: number;
  body?: string | null;
  created_at?: string | null;
  author_label?: string | null;
}): KitchenReview {
  return {
    id: row.id,
    author: row.author_label || 'Guest',
    rating: Number(row.rating),
    body: row.body || '',
    daysAgo: daysAgoFromIso(row.created_at),
    hasPhoto: false,
  };
}

/** Star distribution from real reviews (5★ → excellent … 1★ → terrible). */
export function kitchenRatingBucketsFromReviews(
  reviews: Array<{ rating: number }>
): KitchenRatingBucket[] | null {
  if (!reviews.length) return null;
  const counts: Record<KitchenRatingBucket['key'], number> = {
    excellent: 0,
    very_good: 0,
    average: 0,
    poor: 0,
    terrible: 0,
  };
  for (const r of reviews) {
    const n = Number(r.rating);
    if (n >= 5) counts.excellent++;
    else if (n >= 4) counts.very_good++;
    else if (n >= 3) counts.average++;
    else if (n >= 2) counts.poor++;
    else counts.terrible++;
  }
  const total = reviews.length;
  return (['excellent', 'very_good', 'average', 'poor', 'terrible'] as const).map((key) => ({
    key,
    label: RATING_LABELS[key],
    share: counts[key] / total,
  }));
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
 * @deprecated Deterministic fake reviews — replaced by GET /store/shc/cooks/:slug/reviews.
 * Seeded by cook id so the same kitchen always showed the same sample set.
 */
// export function kitchenDemoReviews(cookId: string, count = 6): KitchenReview[] {
//   const seed = hashSeed(cookId || 'kitchen');
//   const authors = [
//     'Mei Ling',
//     'Priya S.',
//     'Aisha R.',
//     'David Tan',
//     'Siti N.',
//     'Wei Jie',
//     'Hannah L.',
//     'Raj K.',
//   ];
//   const bodies = [
//     'Excellent home-cooked meals. Good quantity and taste. Collection was smooth at the HDB lobby.',
//     'Food is really good. Would appreciate if portions can be slightly larger for family orders.',
//     'Been ordering for months. Packaging is careful and the menu has real heritage options.',
//     'Authentic flavours — tastes like my auntie’s kitchen. Clear allergen notes too.',
//     'On-time collection window. Dish was still warm and well packed for the MRT ride home.',
//     'Great for festive gatherings. Ordered ahead for our reunion and everything arrived as planned.',
//   ];
//   const n = Math.min(count, authors.length, bodies.length);
//   const out: KitchenReview[] = [];
//   for (let i = 0; i < n; i++) {
//     const idx = (seed + i * 3) % authors.length;
//     const rating = 5 - ((seed + i) % 5 === 0 ? 1 : 0) - ((seed + i) % 7 === 0 ? 1 : 0);
//     out.push({
//       id: `rev_${cookId}_${i}`,
//       author: authors[idx],
//       rating: Math.max(3, Math.min(5, rating)),
//       body: bodies[(seed + i) % bodies.length],
//       daysAgo: 1 + ((seed + i * 5) % 21),
//       hasPhoto: (seed + i) % 3 === 0,
//     });
//   }
//   return out;
// }

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

/** SHC collection windows (HDB) — derived from listing availability + tiffin config. */
export type KitchenCollectionHoursInput = {
  /** Kitchen dishes/listings — reads `shc_availability.collection_days` + `time_slots`. */
  products?: Record<string, unknown>[];
  /** Tiffin kitchen collection days (0=Sun … 6=Sat). */
  collection_days?: number[];
  /** Tiffin default slot, e.g. `18:00-19:00`. */
  default_collection_slot?: string | null;
  collection_instructions?: string | null;
};

const COLLECTION_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatTime12h(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  if (!Number.isFinite(h)) return hhmm;
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'am' : 'pm';
  if (m > 0) return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  return `${hour12} ${ampm}`;
}

/** Format `18:00-19:00` → `6:00 pm – 7:00 pm`. */
export function formatCollectionTimeSlot(slot: string): string {
  const parts = String(slot).split('-').map((s) => s.trim());
  if (parts.length >= 2) return `${formatTime12h(parts[0])} – ${formatTime12h(parts[1])}`;
  return String(slot).trim();
}

function slotStartHour(slot: string): number {
  const m = String(slot).match(/^(\d{1,2})/);
  return m ? Number(m[1]) : 18;
}

function collectionSlotLabel(startHour: number): string {
  if (startHour < 11) return 'Morning collection';
  if (startHour < 14) return 'Lunch collection';
  if (startHour < 17) return 'Afternoon collection';
  return 'Evening collection';
}

function formatCollectionDays(days: number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (!sorted.length) return '';
  return sorted.map((d) => COLLECTION_DAY_NAMES[d] || `Day ${d}`).join(', ');
}

/** Union collection days + time slots from listings and tiffin config. */
export function aggregateKitchenCollectionSchedule(
  input?: KitchenCollectionHoursInput
): { collection_days: number[]; time_slots: string[] } {
  const daySet = new Set<number>();
  const slotSet = new Set<string>();

  const addDays = (days?: number[]) => {
    (days || []).forEach((d) => {
      if (Number.isInteger(d) && d >= 0 && d <= 6) daySet.add(d);
    });
  };
  const addSlot = (slot?: string | null) => {
    const s = String(slot || '').trim();
    if (s) slotSet.add(s);
  };

  for (const product of input?.products || []) {
    const avail =
      (product.shc_availability as Record<string, unknown> | undefined) ||
      (product.availability as Record<string, unknown> | undefined);
    if (avail?.paused === true) continue;
    addDays(avail?.collection_days as number[] | undefined);
    addDays(product.collection_days as number[] | undefined);
    const slots =
      (avail?.time_slots as string[] | undefined) || (product.time_slots as string[] | undefined);
    slots?.forEach((slot) => addSlot(slot));
  }

  addDays(input?.collection_days);
  addSlot(input?.default_collection_slot);

  return {
    collection_days: [...daySet].sort((a, b) => a - b),
    time_slots: [...slotSet].sort((a, b) => slotStartHour(a) - slotStartHour(b) || a.localeCompare(b)),
  };
}

export function kitchenCollectionHours(input?: KitchenCollectionHoursInput): KitchenHourSlot[] {
  const { collection_days, time_slots } = aggregateKitchenCollectionSchedule(input);
  const daysLabel = formatCollectionDays(collection_days);
  const rows: KitchenHourSlot[] = [];

  if (time_slots.length) {
    time_slots.forEach((slot, i) => {
      const label = collectionSlotLabel(slotStartHour(slot));
      const window = daysLabel
        ? `${daysLabel} · ${formatCollectionTimeSlot(slot)}`
        : formatCollectionTimeSlot(slot);
      rows.push({ id: `slot-${i}`, label, window });
    });
  } else if (daysLabel) {
    rows.push({
      id: 'days',
      label: 'Collection days',
      window: daysLabel,
    });
  }

  rows.push({
    id: 'note',
    label: 'How it works',
    window: input?.collection_instructions
      ? String(input.collection_instructions).slice(0, 120)
      : collection_days.length || time_slots.length
        ? 'Collect from HDB lobby after cook accepts — exact slot on your order.'
        : 'Collection windows follow each dish listing — order for your slot.',
  });

  return rows;
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

/** Wireframe kitchen details — short chef background blurb. */
export function kitchenChefBackground(cook?: KitchenIdentity | null): string {
  const name = cook?.display_name || cook?.name || 'This cook';
  const area = cook?.area ? ` in ${cook.area}` : '';
  const cuisine = cook?.primary_cuisine || cook?.cuisine;
  const cu = cuisine ? ` Specialises in ${cuisine}.` : '';
  if (cook?.story && String(cook.story).trim()) return String(cook.story).trim();
  return `${name} cooks from a home kitchen${area}.${cu} Heritage recipes, HDB collection, PayNow escrow.`;
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
