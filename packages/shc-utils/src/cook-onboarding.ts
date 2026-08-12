/**
 * Cook first-time onboarding — 9 production screens (not a 26-step micro-wizard).
 * Tri-platform: mobile-cook + web cook-portal import this module.
 */

import { DEFAULT_COMMISSION_RATE } from '@shc/business-rules';
import { normalizeCookAreaInput } from './sg-areas';
import { normalizePaynowMobile } from './cook-payout';

export const COOK_ONBOARDING_VERSION = 'v4';
export const COOK_ONBOARDING_DEMO_OTP = '123456';

export type CookOnboardingChapterId =
  | 'kitchen'
  | 'payout'
  | 'legal'
  | 'identity'
  | 'compliance'
  | 'menu';

export type CookOnboardingStepId =
  | 'kitchen'
  | 'paynow'
  | 'legal'
  | 'responsible_person'
  | 'nric_fin'
  | 'alternate_contact'
  | 'halal'
  | 'certificates'
  | 'menu';

export type CookOnboardingStepMeta = {
  id: CookOnboardingStepId;
  chapter: CookOnboardingChapterId;
  title: string;
  subtitle: string;
  imageKey: 'listings' | 'compliance' | 'orders' | 'family' | 'checkout';
  nextLabel?: string;
  skippable?: boolean;
  /** Large hero illustration (welcome / intro screens). */
  hero?: boolean;
};

export const COOK_ONBOARDING_CHAPTER_LABELS: Record<CookOnboardingChapterId, string> = {
  kitchen: 'Your kitchen',
  payout: 'Get paid',
  legal: 'Trust & safety',
  identity: 'Your profile',
  compliance: 'Certifications',
  menu: 'Menu card',
};

export const COOK_ONBOARDING_CHAPTER_ORDER: CookOnboardingChapterId[] = [
  'kitchen',
  'payout',
  'legal',
  'identity',
  'compliance',
  'menu',
];

export const COOK_ONBOARDING_LEAD_TIME_SLOTS = [
  'Morning (9am–12pm)',
  'Afternoon (12pm–5pm)',
  'Evening (5pm–9pm)',
] as const;

/** Nine cook-facing screens — kitchen through first menu card. */
export const COOK_ONBOARDING_STEPS: CookOnboardingStepMeta[] = [
  {
    id: 'kitchen',
    chapter: 'kitchen',
    title: 'Your kitchen',
    subtitle: 'Name your kitchen, then search and pick the exact collection address.',
    imageKey: 'listings',
  },
  {
    id: 'paynow',
    chapter: 'payout',
    title: 'PayNow mobile',
    subtitle: 'Weekly earnings go here. Enter the number twice so we don’t mistype it.',
    imageKey: 'checkout',
  },
  {
    id: 'legal',
    chapter: 'legal',
    title: 'Legal & PDPA',
    subtitle: 'Home kitchens must disclose allergens. Accept our terms to continue.',
    imageKey: 'orders',
  },
  {
    id: 'responsible_person',
    chapter: 'identity',
    title: 'Person responsible',
    subtitle: 'Legal name of the person operating this home kitchen.',
    imageKey: 'family',
  },
  {
    id: 'nric_fin',
    chapter: 'identity',
    title: 'NRIC / FIN (last 4)',
    subtitle: 'Last four characters only — e.g. xxx123B.',
    imageKey: 'family',
  },
  {
    id: 'alternate_contact',
    chapter: 'identity',
    title: 'Alternate contact',
    subtitle: 'Backup number if you’re unreachable on collection day.',
    imageKey: 'family',
    skippable: true,
  },
  {
    id: 'halal',
    chapter: 'compliance',
    title: 'Is your kitchen halal certified?',
    subtitle: 'If yes, you can upload the certificate next.',
    imageKey: 'compliance',
  },
  {
    id: 'certificates',
    chapter: 'compliance',
    title: 'Certificates',
    subtitle: 'SFA, workplace safety, and Halal if it applies. Skip and finish later from Compliance.',
    imageKey: 'compliance',
    skippable: true,
  },
  {
    id: 'menu',
    chapter: 'menu',
    title: 'Create your menu card',
    subtitle: 'Add your first dish, or finish setup and add dishes later.',
    imageKey: 'listings',
    skippable: true,
    nextLabel: 'Complete onboarding',
  },
];

export type CookOnboardingDishDraft = {
  dish_cuisine: string;
  dish_name: string;
  dish_portion_unit: 'plate' | 'piece';
  dish_recommended_pax: number;
  dish_price: string;
  dish_ingredients: string;
  dish_description: string;
  dish_lead_days: number;
  dish_lead_time_slot: string;
  dish_available: boolean;
  dish_calories: string;
  dish_image_url: string;
};

export type CookOnboardingDraft = {
  area: string;
  kitchen_address: string;
  collection_instructions: string;
  contact_mobile: string;
  whatsapp_same: boolean;
  mobile_verified: boolean;
  paynow_mobile: string;
  paynow_mobile_confirm: string;
  pdpa_consent: boolean;
  terms_consent: boolean;
  avatar_url: string;
  display_name: string;
  responsible_person_name: string;
  nric_fin_last4: string;
  alternate_contact: string;
  kitchen_halal_certified: boolean | null;
  compliance_uploaded: { sfa: boolean; wsq: boolean; halal: boolean };
  kitchen_available: boolean;
  saved_dishes: CookOnboardingDishDraft[];
} & CookOnboardingDishDraft;

export function createEmptyCookOnboardingDish(): CookOnboardingDishDraft {
  return {
    dish_cuisine: '',
    dish_name: '',
    dish_portion_unit: 'plate',
    dish_recommended_pax: 2,
    dish_price: '',
    dish_ingredients: '',
    dish_description: '',
    dish_lead_days: 2,
    dish_lead_time_slot: COOK_ONBOARDING_LEAD_TIME_SLOTS[2],
    dish_available: true,
    dish_calories: '',
    dish_image_url: '',
  };
}

export function snapshotCookOnboardingDish(draft: CookOnboardingDraft): CookOnboardingDishDraft {
  return {
    dish_cuisine: draft.dish_cuisine,
    dish_name: draft.dish_name,
    dish_portion_unit: draft.dish_portion_unit,
    dish_recommended_pax: draft.dish_recommended_pax,
    dish_price: draft.dish_price,
    dish_ingredients: draft.dish_ingredients,
    dish_description: draft.dish_description,
    dish_lead_days: draft.dish_lead_days,
    dish_lead_time_slot: draft.dish_lead_time_slot,
    dish_available: draft.dish_available,
    dish_calories: draft.dish_calories,
    dish_image_url: draft.dish_image_url,
  };
}

export function createEmptyCookOnboardingDraft(): CookOnboardingDraft {
  return {
    area: '',
    kitchen_address: '',
    collection_instructions: '',
    contact_mobile: '',
    whatsapp_same: false,
    mobile_verified: false,
    paynow_mobile: '',
    paynow_mobile_confirm: '',
    pdpa_consent: false,
    terms_consent: false,
    avatar_url: '',
    display_name: '',
    responsible_person_name: '',
    nric_fin_last4: '',
    alternate_contact: '',
    kitchen_halal_certified: null,
    compliance_uploaded: { sfa: false, wsq: false, halal: false },
    kitchen_available: true,
    saved_dishes: [],
    ...createEmptyCookOnboardingDish(),
  };
}

export function isCookOnboardingStepId(id: string): id is CookOnboardingStepId {
  return COOK_ONBOARDING_STEPS.some((s) => s.id === id);
}

export function coerceCookOnboardingStepId(id: string | undefined | null): CookOnboardingStepId {
  if (id && isCookOnboardingStepId(id)) return id;
  return 'kitchen';
}

export function cookOnboardingHasDishDraft(draft: CookOnboardingDishDraft): boolean {
  return draft.dish_name.trim().length > 0 || draft.dish_price.trim().length > 0;
}

export function cookOnboardingCookTakeHome(listPrice: number): { list: number; cook: number; fee: number } | null {
  if (!Number.isFinite(listPrice) || listPrice <= 0) return null;
  const cents = Math.round(listPrice * 100);
  const fee = Math.floor(cents * DEFAULT_COMMISSION_RATE);
  const cook = cents - fee;
  return { list: listPrice, cook: cook / 100, fee: fee / 100 };
}

export type CookOnboardingValidation = { ok: true } | { ok: false; message: string };

export function resolveCookPaynowMobile(draft: CookOnboardingDraft): string | null {
  if (draft.whatsapp_same) {
    return (
      normalizePaynowMobile(draft.contact_mobile) ||
      normalizePaynowMobile(draft.paynow_mobile) ||
      normalizePaynowMobile(draft.paynow_mobile_confirm)
    );
  }
  return normalizePaynowMobile(draft.paynow_mobile);
}

export function validateCookOnboardingDish(draft: CookOnboardingDishDraft): CookOnboardingValidation {
  if (draft.dish_cuisine.trim().length < 2) return { ok: false, message: 'Select a cuisine.' };
  if (draft.dish_name.trim().length < 3) return { ok: false, message: 'Dish name must be at least 3 characters.' };
  const price = Number(draft.dish_price);
  if (!Number.isFinite(price) || price <= 0) return { ok: false, message: 'Enter a valid list price.' };
  if (draft.dish_ingredients.trim().length < 3) {
    return { ok: false, message: 'List at least one main ingredient.' };
  }
  if (draft.dish_description.trim().length < 10) {
    return { ok: false, message: 'Add a brief description (10+ characters).' };
  }
  if (!Number.isFinite(draft.dish_recommended_pax) || draft.dish_recommended_pax < 1) {
    return { ok: false, message: 'Enter how many people this dish serves.' };
  }
  if (!Number.isFinite(draft.dish_lead_days) || draft.dish_lead_days < 1) {
    return { ok: false, message: 'Minimum order time must be at least 1 day.' };
  }
  if (!draft.dish_lead_time_slot.trim()) {
    return { ok: false, message: 'Pick a preferred collection time window.' };
  }
  return { ok: true };
}

export function validateCookOnboardingStep(
  stepId: CookOnboardingStepId,
  draft: CookOnboardingDraft
): CookOnboardingValidation {
  switch (stepId) {
    case 'kitchen': {
      if (draft.display_name.trim().length < 3) {
        return { ok: false, message: 'Kitchen name must be at least 3 characters.' };
      }
      if (draft.kitchen_address.trim().length < 8) {
        return { ok: false, message: 'Search and select your kitchen address.' };
      }
      return { ok: true };
    }
    case 'paynow': {
      const a = normalizePaynowMobile(draft.paynow_mobile);
      const b = normalizePaynowMobile(draft.paynow_mobile_confirm);
      if (!a) return { ok: false, message: 'Enter your PayNow mobile number.' };
      if (a !== b) return { ok: false, message: 'PayNow numbers do not match. Check both fields.' };
      return { ok: true };
    }
    case 'legal':
      if (!draft.pdpa_consent || !draft.terms_consent) {
        return { ok: false, message: 'Accept PDPA and Terms & Conditions to continue.' };
      }
      return { ok: true };
    case 'alternate_contact':
    case 'certificates':
      return { ok: true };
    case 'responsible_person':
      if (draft.responsible_person_name.trim().length < 2) {
        return { ok: false, message: 'Enter the person responsible for this kitchen.' };
      }
      return { ok: true };
    case 'nric_fin': {
      const nric = draft.nric_fin_last4.trim().toUpperCase();
      if (!/^[0-9]{3}[A-Z]$/.test(nric) && !/^[A-Z][0-9]{3}[A-Z]$/.test(nric)) {
        return { ok: false, message: 'Enter last 4 characters of NRIC/FIN (e.g. 123B or A123B).' };
      }
      return { ok: true };
    }
    case 'halal':
      if (draft.kitchen_halal_certified === null) {
        return { ok: false, message: 'Let us know if your kitchen is halal certified.' };
      }
      return { ok: true };
    case 'menu':
      if (!cookOnboardingHasDishDraft(draft)) return { ok: true };
      return validateCookOnboardingDish(draft);
    default:
      return { ok: true };
  }
}

export function cookOnboardingStepIndex(stepId: CookOnboardingStepId): number {
  return COOK_ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
}

export function cookOnboardingNextStep(stepId: CookOnboardingStepId): CookOnboardingStepId | null {
  const idx = cookOnboardingStepIndex(stepId);
  if (idx < 0 || idx >= COOK_ONBOARDING_STEPS.length - 1) return null;
  return COOK_ONBOARDING_STEPS[idx + 1].id;
}

export function cookOnboardingPrevStep(stepId: CookOnboardingStepId): CookOnboardingStepId | null {
  const idx = cookOnboardingStepIndex(stepId);
  if (idx <= 0) return null;
  return COOK_ONBOARDING_STEPS[idx - 1].id;
}

export function cookOnboardingChapterDotProgress(stepId: CookOnboardingStepId): {
  chapterIndex: number;
  totalChapters: number;
  chapterLabel: string;
  percentComplete: number;
} {
  const step = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId);
  const chapter = step?.chapter ?? 'kitchen';
  const chapterIndex = COOK_ONBOARDING_CHAPTER_ORDER.indexOf(chapter);
  const totalChapters = COOK_ONBOARDING_CHAPTER_ORDER.length;
  const overallStep = cookOnboardingStepIndex(stepId) + 1;
  const overallTotal = COOK_ONBOARDING_STEPS.length;
  return {
    chapterIndex: Math.max(0, chapterIndex),
    totalChapters,
    chapterLabel: COOK_ONBOARDING_CHAPTER_LABELS[chapter],
    percentComplete: Math.round((overallStep / overallTotal) * 100),
  };
}

export function cookOnboardingLinearProgress(stepId: CookOnboardingStepId): {
  current: number;
  total: number;
  percent: number;
} {
  const current = cookOnboardingStepIndex(stepId) + 1;
  const total = COOK_ONBOARDING_STEPS.length;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
  };
}

export function cookOnboardingChapterProgress(stepId: CookOnboardingStepId): {
  chapter: CookOnboardingChapterId;
  chapterLabel: string;
  stepInChapter: number;
  stepsInChapter: number;
  overallStep: number;
  overallTotal: number;
} {
  const step = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId);
  const chapter = step?.chapter ?? 'kitchen';
  const chapterSteps = COOK_ONBOARDING_STEPS.filter((s) => s.chapter === chapter);
  const stepInChapter = chapterSteps.findIndex((s) => s.id === stepId) + 1;
  return {
    chapter,
    chapterLabel: COOK_ONBOARDING_CHAPTER_LABELS[chapter],
    stepInChapter,
    stepsInChapter: chapterSteps.length,
    overallStep: cookOnboardingStepIndex(stepId) + 1,
    overallTotal: COOK_ONBOARDING_STEPS.length,
  };
}

export function buildCookOnboardingProfilePayload(draft: CookOnboardingDraft): Record<string, unknown> {
  const paynow = resolveCookPaynowMobile(draft);
  return {
    display_name: draft.display_name.trim(),
    area: normalizeCookAreaInput(draft.area),
    collection_address: draft.kitchen_address.trim(),
    collection_instructions: draft.collection_instructions.trim() || undefined,
    contact_mobile: normalizePaynowMobile(draft.contact_mobile) || paynow,
    whatsapp_number: draft.whatsapp_same ? paynow : undefined,
    paynow_mobile: paynow,
    responsible_person_name: draft.responsible_person_name.trim(),
    nric_fin_last4: draft.nric_fin_last4.trim().toUpperCase(),
    alternate_contact: draft.alternate_contact.trim() || undefined,
    kitchen_halal_certified: draft.kitchen_halal_certified,
    availability_paused: !draft.kitchen_available,
    avatar_url: draft.avatar_url.trim() || undefined,
    pdpa_consent: draft.pdpa_consent,
    terms_consent: draft.terms_consent,
    onboarding_completed_at: new Date().toISOString(),
  };
}

export function buildCookOnboardingFirstListingPayload(
  draft: CookOnboardingDishDraft & Pick<CookOnboardingDraft, 'kitchen_halal_certified'>
): Record<string, unknown> {
  const price = Number(draft.dish_price);
  const ingredientUnit = draft.dish_portion_unit === 'piece' ? 'pc' : 'serving';
  const ingredients = draft.dish_ingredients
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((name) => ({ name, quantity: 1, unit: ingredientUnit }));

  const minOrderQty = Number.isFinite(price) && price > 0 ? Math.max(5, Math.ceil(50 / price)) : 5;

  return {
    name: draft.dish_name.trim(),
    description: draft.dish_description.trim(),
    cuisine: draft.dish_cuisine.trim(),
    price,
    min_qty: minOrderQty,
    halal: draft.kitchen_halal_certified === true,
    ingredients: ingredients.length ? ingredients : [{ name: 'See description', quantity: 1, unit: ingredientUnit }],
    allergen_none_confirmed: true,
    portions_per_day: 12,
    collection_days: [0, 1, 2, 3, 4, 5, 6],
    time_slots: draft.dish_lead_time_slot.includes('Morning')
      ? ['09:00-12:00']
      : draft.dish_lead_time_slot.includes('Afternoon')
        ? ['12:00-17:00']
        : ['17:00-21:00'],
    paused: !draft.dish_available,
    image_url: draft.dish_image_url.trim() || undefined,
    calories: draft.dish_calories ? Number(draft.dish_calories) : undefined,
    occasion_tags: [],
  };
}

export function collectCookOnboardingDishes(draft: CookOnboardingDraft): CookOnboardingDishDraft[] {
  const saved = draft.saved_dishes.filter((d) => d.dish_name.trim().length >= 3);
  if (cookOnboardingHasDishDraft(draft) && validateCookOnboardingDish(draft).ok) {
    return [...saved, snapshotCookOnboardingDish(draft)];
  }
  return saved;
}

export const COOK_ONBOARDING_CUISINE_PRESETS = [
  'Chinese',
  'Malay',
  'Indian',
  'Peranakan',
  'Western',
  'Fusion',
  'Singapore',
] as const;

export const COOK_ONBOARDING_INGREDIENT_SUGGESTIONS = [
  'Rice',
  'Chicken',
  'Prawn',
  'Coconut milk',
  'Chilli',
  'Lemongrass',
  'Egg',
  'Tofu',
  'Fish',
  'Beef',
  'Pork',
  'Garlic',
  'Ginger',
  'Onion',
  'Shallot',
  'Turmeric',
  'Coriander',
  'Kaffir lime',
  'Belacan',
  'Sambal',
  'Coconut',
  'Noodles',
  'Tamarind',
  'Peanut',
  'Cabbage',
  'Bean sprout',
] as const;

export function filterIngredientSuggestions(query: string, selected: string[] = []): string[] {
  const q = query.trim().toLowerCase();
  const selectedLc = new Set(selected.map((s) => s.toLowerCase()));
  return COOK_ONBOARDING_INGREDIENT_SUGGESTIONS.filter((ing) => {
    if (selectedLc.has(ing.toLowerCase())) return false;
    if (!q) return true;
    return ing.toLowerCase().includes(q);
  }).slice(0, 8);
}
