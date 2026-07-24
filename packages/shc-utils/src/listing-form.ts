/** Shared cook listing wizard defaults + helpers (tri-platform). */

export type AllergenTiers = {
  tier1: string[];
  tier2?: string[];
  tier3?: string[];
};

export type ListingAvailabilityDraft = {
  portions_per_day: number;
  collection_days: number[];
  time_slots: string[];
};

/** Tier-1 allergens cooks must disclose (Singapore home-kitchen presets). */
export const ALLERGEN_TIER1_PRESETS = [
  'Shellfish',
  'Crustaceans',
  'Nuts (Peanuts)',
  'Tree nuts',
  'Eggs',
  'Dairy',
  'Gluten',
  'Soy',
  'Mustard seeds',
  'Chicken',
  'Beef',
  'Pork',
  'Chillies (nightshade)',
  'Sesame',
  'Fish',
] as const;

export const COLLECTION_TIME_SLOT_PRESETS = [
  '17:00-18:00',
  '18:00-19:00',
  '17:00-19:00',
  '18:00-20:00',
  '19:00-21:00',
] as const;

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DEFAULT_LISTING_AVAILABILITY: ListingAvailabilityDraft = {
  portions_per_day: 18,
  collection_days: [0, 1, 2, 3, 4, 5, 6],
  time_slots: ['17:00-19:00', '18:00-20:00'],
};

export function emptyAllergenTiers(): AllergenTiers {
  return { tier1: [], tier2: [], tier3: [] };
}

export function toggleAllergenTier1(tiers: AllergenTiers, allergen: string): AllergenTiers {
  const tier1 = tiers.tier1.includes(allergen)
    ? tiers.tier1.filter((a) => a !== allergen)
    : [...tiers.tier1, allergen];
  return { ...tiers, tier1 };
}

export function toggleCollectionDay(days: number[], day: number): number[] {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
}

export function toggleTimeSlot(slots: string[], slot: string): string[] {
  return slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot];
}

export function availabilityFromListing(
  avail?: Partial<ListingAvailabilityDraft> | null
): ListingAvailabilityDraft {
  return {
    portions_per_day: avail?.portions_per_day ?? DEFAULT_LISTING_AVAILABILITY.portions_per_day,
    collection_days:
      avail?.collection_days?.length
        ? [...avail.collection_days].sort((a, b) => a - b)
        : [...DEFAULT_LISTING_AVAILABILITY.collection_days],
    time_slots:
      avail?.time_slots?.length ? [...avail.time_slots] : [...DEFAULT_LISTING_AVAILABILITY.time_slots],
  };
}

export function allergenTiersFromListing(
  tiers?: Partial<AllergenTiers> | null
): AllergenTiers {
  return {
    tier1: tiers?.tier1?.length ? [...tiers.tier1] : [],
    tier2: tiers?.tier2 ?? [],
    tier3: tiers?.tier3 ?? [],
  };
}

export type CookListingFormDraft = {
  name: string;
  description?: string;
  price: number;
  min_qty: number;
  cuisine: string;
  occasion_tags: string[];
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  allergen_tiers: AllergenTiers;
  halal: boolean;
  image_url?: string;
  calories?: number;
  calories_confidence?: string;
  last_minute_premium_pct?: number | null;
  portions_per_day: number;
  collection_days: number[];
  time_slots: string[];
};

/** Build API payload for POST/PATCH /store/shc/listings. */
export function buildCookListingPayload(draft: CookListingFormDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: draft.name,
    price: draft.price,
    min_qty: draft.min_qty,
    cuisine: draft.cuisine,
    occasion_tags: draft.occasion_tags,
    ingredients: draft.ingredients,
    allergen_tiers: draft.allergen_tiers,
    halal: draft.halal,
    portions_per_day: draft.portions_per_day,
    collection_days: draft.collection_days,
    time_slots: draft.time_slots,
  };
  if (draft.description?.trim()) payload.description = draft.description.trim();
  if (draft.image_url) payload.image_url = draft.image_url;
  if (draft.calories != null) {
    payload.calories = draft.calories;
    payload.calories_confidence = draft.calories_confidence || 'category';
  }
  if (draft.last_minute_premium_pct != null && draft.last_minute_premium_pct > 0) {
    payload.last_minute_premium_pct = draft.last_minute_premium_pct;
  }
  return payload;
}
