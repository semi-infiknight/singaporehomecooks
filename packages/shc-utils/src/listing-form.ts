import type { MealOptionDraft, RecipeStepDraft } from './product-meta-form';
import { mealOptionsToApiPayload, recipeStepsToApiPayload } from './product-meta-form';

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

export const DEFAULT_COLLECTION_SLOT = '18:00-19:00' as const;

const COLLECTION_SLOT_PATTERN = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

/** Validate HH:MM-HH:MM collection window format. */
export function isValidCollectionSlotFormat(slot: string): boolean {
  return COLLECTION_SLOT_PATTERN.test(String(slot || '').trim());
}

/** Cook-owned collection windows — falls back to platform presets when unset. */
export function normalizeCookCollectionTimeSlots(raw: unknown): string[] {
  const fallback = [...COLLECTION_TIME_SLOT_PRESETS];
  if (!raw) return fallback;
  const list = Array.isArray(raw) ? raw : [];
  const cleaned = list
    .map((s) => String(s || '').trim())
    .filter((s) => isValidCollectionSlotFormat(s));
  const unique = [...new Set(cleaned)];
  return unique.length ? unique : fallback;
}

/** Slots a cook offers across listings, batches, and tiffin. */
export function resolveCookCollectionTimeSlots(
  cook?: { collection_time_slots?: unknown } | null
): readonly string[] {
  const raw = cook?.collection_time_slots;
  if (raw == null) return COLLECTION_TIME_SLOT_PRESETS;
  const normalized = normalizeCookCollectionTimeSlots(raw);
  return normalized.length ? normalized : COLLECTION_TIME_SLOT_PRESETS;
}

export function toggleCookCollectionTimeSlot(slots: string[], slot: string): string[] {
  const trimmed = String(slot || '').trim();
  if (!isValidCollectionSlotFormat(trimmed)) return slots;
  return slots.includes(trimmed) ? slots.filter((s) => s !== trimmed) : [...slots, trimmed];
}

export function isCollectionTimeSlotPreset(slot: string): boolean {
  return (COLLECTION_TIME_SLOT_PRESETS as readonly string[]).includes(slot);
}

/** Normalize a collection slot for drops, listings, and tiffin. */
export function normalizeCollectionSlot(
  slot?: string | null,
  fallback: string = DEFAULT_COLLECTION_SLOT,
  allowedSlots?: readonly string[]
): string {
  const trimmed = String(slot || '').trim();
  if (!trimmed) return fallback;
  const allowed = allowedSlots?.length ? allowedSlots : COLLECTION_TIME_SLOT_PRESETS;
  if ((allowed as readonly string[]).includes(trimmed)) return trimmed;
  if (isValidCollectionSlotFormat(trimmed)) return trimmed;
  return fallback;
}

/** Default slot when posting a Cooking soon batch (prefers tiffin kitchen default). */
export function resolveDefaultBatchCollectionSlot(
  prefs?: { tiffinDefaultSlot?: string | null } | null
): string {
  return normalizeCollectionSlot(prefs?.tiffinDefaultSlot, DEFAULT_COLLECTION_SLOT);
}

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
  allergen_none_confirmed?: boolean;
  halal: boolean;
  portions_per_day: number;
  image_url?: string;
  calories?: number;
  calories_confidence?: string;
  collection_days: number[];
  time_slots: string[];
  meal_extras?: MealOptionDraft[];
  meal_addons?: MealOptionDraft[];
  recipe_steps?: RecipeStepDraft[];
};

/** Minimum order value (price × min_qty) for a publishable listing. */
export const MIN_LISTING_ORDER_VALUE_SGD = 50;

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
    const confidence = draft.calories_confidence;
    payload.calories_confidence = confidence === 'full' || confidence === 'category' ? confidence : 'category';
  }
  if (draft.meal_extras?.length) payload.meal_extras = mealOptionsToApiPayload(draft.meal_extras);
  if (draft.meal_addons?.length) payload.meal_addons = mealOptionsToApiPayload(draft.meal_addons);
  if (draft.recipe_steps?.length) payload.recipe_steps = recipeStepsToApiPayload(draft.recipe_steps);
  if (draft.allergen_none_confirmed !== undefined) {
    payload.allergen_none_confirmed = draft.allergen_none_confirmed;
  }
  return payload;
}

export type CookListingFieldErrors = {
  name?: string;
  price?: string;
  min_qty?: string;
};

export type CookListingValidationResult = {
  valid: boolean;
  errors: string[];
  fieldErrors: CookListingFieldErrors;
};

/** Client-side gate before publish or leaving step 1. */
export function validateCookListingDraft(
  draft: Pick<CookListingFormDraft, 'name' | 'price' | 'min_qty'>
): CookListingValidationResult {
  const errors: string[] = [];
  const fieldErrors: CookListingFieldErrors = {};
  const name = String(draft.name || '').trim();
  if (name.length < 3) {
    const msg = 'Dish name must be at least 3 characters.';
    errors.push(msg);
    fieldErrors.name = msg;
  }
  const price = Number(draft.price);
  if (!Number.isFinite(price) || price <= 0) {
    const msg = 'Enter a price greater than S$0.';
    errors.push(msg);
    fieldErrors.price = msg;
  }
  const minQty = Number(draft.min_qty);
  if (!Number.isFinite(minQty) || minQty < 1 || !Number.isInteger(minQty)) {
    const msg = 'Minimum order must be at least 1 serving.';
    errors.push(msg);
    fieldErrors.min_qty = msg;
  }
  return { valid: errors.length === 0, errors, fieldErrors };
}

function hasValidIngredients(ingredients: CookListingFormDraft['ingredients']): boolean {
  return (ingredients || []).some((row) => String(row?.name || '').trim().length >= 2);
}

function hasAllergenDisclosure(draft: Pick<CookListingFormDraft, 'allergen_tiers' | 'allergen_none_confirmed'>): boolean {
  if (draft.allergen_none_confirmed) return true;
  return (draft.allergen_tiers?.tier1 || []).length >= 1;
}

/** Full publish gate — steps 2–4 + order minimum. */
export function validateCookListingForPublish(draft: CookListingFormDraft): CookListingValidationResult {
  const basics = validateCookListingDraft(draft);
  const errors = [...basics.errors];
  const fieldErrors = { ...basics.fieldErrors };

  const cuisine = String(draft.cuisine || '').trim();
  if (cuisine.length < 2) {
    errors.push('Select or enter a cuisine.');
  }
  if (!hasValidIngredients(draft.ingredients)) {
    errors.push('Add at least one ingredient with a name.');
  }
  if (!hasAllergenDisclosure(draft)) {
    errors.push('Disclose tier-1 allergens or confirm none apply.');
  }
  if (!(draft.collection_days || []).length) {
    errors.push('Select at least one collection day.');
  }
  if (!(draft.time_slots || []).length) {
    errors.push('Select at least one collection time slot.');
  }
  const orderValue = Number(draft.price) * Number(draft.min_qty);
  if (Number.isFinite(orderValue) && orderValue < MIN_LISTING_ORDER_VALUE_SGD) {
    errors.push(`Minimum order value must be at least S$${MIN_LISTING_ORDER_VALUE_SGD} (price × servings).`);
  }

  return { valid: errors.length === 0, errors, fieldErrors };
}

export function validateCookListingWizardStep(
  step: number,
  draft: CookListingFormDraft
): { ok: boolean; message?: string } {
  if (step === 1) {
    const result = validateCookListingDraft(draft);
    return { ok: result.valid, message: result.errors[0] };
  }
  if (step === 2) {
    const cuisine = String(draft.cuisine || '').trim();
    if (cuisine.length < 2) return { ok: false, message: 'Select a cuisine.' };
    return { ok: true };
  }
  if (step === 3) {
    if (!hasValidIngredients(draft.ingredients)) {
      return { ok: false, message: 'Add at least one ingredient.' };
    }
    if (!hasAllergenDisclosure(draft)) {
      return { ok: false, message: 'Disclose allergens or confirm none apply.' };
    }
    return { ok: true };
  }
  if (step === 4) {
    const publish = validateCookListingForPublish(draft);
    return { ok: publish.valid, message: publish.errors[0] };
  }
  return { ok: true };
}
