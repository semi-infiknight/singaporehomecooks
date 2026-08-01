/**
 * Cook first-time onboarding — shared step registry, validation, and payload builders.
 * Tri-platform: mobile-cook + web cook-portal import this module.
 */

import { normalizeCookAreaInput } from './sg-areas';
import { normalizePaynowMobile } from './cook-payout';

export const COOK_ONBOARDING_VERSION = 'v2';
export const COOK_ONBOARDING_DEMO_OTP = '123456';

export type CookOnboardingChapterId =
  | 'welcome'
  | 'location'
  | 'contact'
  | 'payout'
  | 'legal'
  | 'identity'
  | 'compliance'
  | 'menu'
  | 'complete';

export type CookOnboardingStepId =
  | 'welcome'
  | 'area'
  | 'kitchen_address'
  | 'mobile'
  | 'verify_mobile'
  | 'paynow'
  | 'legal'
  | 'profile_photo'
  | 'cook_name'
  | 'responsible_person'
  | 'nric_fin'
  | 'alternate_contact'
  | 'halal'
  | 'certificates'
  | 'kitchen_available'
  | 'menu_basics'
  | 'menu_details'
  | 'menu_photo'
  | 'complete';

export type CookOnboardingStepMeta = {
  id: CookOnboardingStepId;
  chapter: CookOnboardingChapterId;
  title: string;
  subtitle: string;
  imageKey: 'listings' | 'compliance' | 'orders' | 'family' | 'checkout';
  nextLabel?: string;
  skippable?: boolean;
};

export const COOK_ONBOARDING_CHAPTER_LABELS: Record<CookOnboardingChapterId, string> = {
  welcome: 'Welcome',
  location: 'Your kitchen',
  contact: 'Stay in touch',
  payout: 'Get paid',
  legal: 'Trust & safety',
  identity: 'Your profile',
  compliance: 'Certifications',
  menu: 'First dish',
  complete: 'Go live',
};

/** Chapter order for immersive progress (9 dots, not 20). */
export const COOK_ONBOARDING_CHAPTER_ORDER: CookOnboardingChapterId[] = [
  'welcome',
  'location',
  'contact',
  'payout',
  'legal',
  'identity',
  'compliance',
  'menu',
  'complete',
];

export const COOK_ONBOARDING_LEAD_TIME_SLOTS = [
  'Morning (9am–12pm)',
  'Afternoon (12pm–5pm)',
  'Evening (5pm–9pm)',
] as const;

export const COOK_ONBOARDING_STEPS: CookOnboardingStepMeta[] = [
  {
    id: 'welcome',
    chapter: 'welcome',
    title: 'Welcome, home cook',
    subtitle: 'Join Singapore’s heritage kitchen marketplace. We’ll walk you through setup — one step at a time.',
    imageKey: 'listings',
    nextLabel: 'Begin setup',
  },
  {
    id: 'area',
    chapter: 'location',
    title: 'Where is your kitchen?',
    subtitle: 'Pick your HDB neighbourhood so nearby customers can discover you.',
    imageKey: 'compliance',
  },
  {
    id: 'kitchen_address',
    chapter: 'location',
    title: 'Kitchen address',
    subtitle: 'Your HDB block address — shared with customers only after they pay and you accept.',
    imageKey: 'compliance',
  },
  {
    id: 'mobile',
    chapter: 'contact',
    title: 'Mobile & WhatsApp',
    subtitle: 'Customers and ops reach you here for collection day updates.',
    imageKey: 'orders',
  },
  {
    id: 'verify_mobile',
    chapter: 'contact',
    title: 'Verify your mobile',
    subtitle: 'Tap Get verify code — we confirm your number (WhatsApp when live, demo code until then).',
    imageKey: 'orders',
  },
  {
    id: 'paynow',
    chapter: 'payout',
    title: 'PayNow mobile',
    subtitle: 'Weekly payouts go to this number. Enter it twice to avoid typos.',
    imageKey: 'checkout',
  },
  {
    id: 'legal',
    chapter: 'legal',
    title: 'Legal & PDPA',
    subtitle: 'Home kitchens must disclose allergens. Read and accept our terms to continue.',
    imageKey: 'orders',
  },
  {
    id: 'profile_photo',
    chapter: 'identity',
    title: 'Create your profile',
    subtitle: 'Add a warm photo of you or your kitchen — builds trust with customers.',
    imageKey: 'family',
    skippable: true,
  },
  {
    id: 'cook_name',
    chapter: 'identity',
    title: 'Kitchen / cook name',
    subtitle: 'How customers see you on discover — e.g. “Auntie Rose’s Kitchen”.',
    imageKey: 'family',
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
    subtitle: 'Last four characters only — e.g. xxx123B. Used for payout verification.',
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
    title: 'Halal certified kitchen?',
    subtitle: 'If yes, upload your halal certificate in the next step.',
    imageKey: 'compliance',
  },
  {
    id: 'certificates',
    chapter: 'compliance',
    title: 'Upload certificates',
    subtitle: 'SFA food hygiene, WSQ workplace safety, and Halal (if applicable).',
    imageKey: 'compliance',
  },
  {
    id: 'kitchen_available',
    chapter: 'compliance',
    title: 'Kitchen available?',
    subtitle: 'Toggle off if you need a break — you can change this anytime in settings.',
    imageKey: 'listings',
  },
  {
    id: 'menu_basics',
    chapter: 'menu',
    title: 'Create your menu card',
    subtitle: 'Your first listing — cuisine, dish name, portion, pax, and price.',
    imageKey: 'listings',
  },
  {
    id: 'menu_details',
    chapter: 'menu',
    title: 'Ingredients & timing',
    subtitle: 'What’s in the dish, how far ahead customers must order, and optional calories.',
    imageKey: 'listings',
  },
  {
    id: 'menu_photo',
    chapter: 'menu',
    title: 'Dish photo',
    subtitle: 'A clear photo helps customers choose your heritage dish.',
    imageKey: 'listings',
    skippable: true,
  },
  {
    id: 'complete',
    chapter: 'complete',
    title: 'Onboarding complete!',
    subtitle: 'Your kitchen profile is ready. Ops may review certificates before featured placement.',
    imageKey: 'listings',
    nextLabel: 'Go to dashboard',
  },
];

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
  dish_cuisine: string;
  dish_name: string;
  dish_portion_unit: 'plate' | 'piece';
  dish_recommended_pax: 2 | 3 | 4;
  dish_price: string;
  dish_ingredients: string;
  dish_description: string;
  dish_lead_days: number;
  dish_lead_time_slot: string;
  dish_available: boolean;
  dish_calories: string;
  dish_image_url: string;
};

export function createEmptyCookOnboardingDraft(): CookOnboardingDraft {
  return {
    area: '',
    kitchen_address: '',
    collection_instructions: '',
    contact_mobile: '',
    whatsapp_same: true,
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

export type CookOnboardingValidation = { ok: true } | { ok: false; message: string };

export function validateCookOnboardingStep(
  stepId: CookOnboardingStepId,
  draft: CookOnboardingDraft
): CookOnboardingValidation {
  switch (stepId) {
    case 'welcome':
      return { ok: true };
    case 'area': {
      const area = normalizeCookAreaInput(draft.area);
      if (!area || area.length < 2) return { ok: false, message: 'Select your kitchen area.' };
      return { ok: true };
    }
    case 'kitchen_address':
      if (draft.kitchen_address.trim().length < 8) {
        return { ok: false, message: 'Enter your HDB kitchen address (block, street, unit).' };
      }
      return { ok: true };
    case 'mobile': {
      const m = normalizePaynowMobile(draft.contact_mobile);
      if (!m || m.length < 10) return { ok: false, message: 'Enter a valid Singapore mobile number.' };
      return { ok: true };
    }
    case 'verify_mobile':
      if (!draft.mobile_verified) return { ok: false, message: 'Tap Get verify code and enter the code we show you.' };
      return { ok: true };
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
    case 'profile_photo':
      return { ok: true };
    case 'cook_name':
      if (draft.display_name.trim().length < 3) {
        return { ok: false, message: 'Kitchen name must be at least 3 characters.' };
      }
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
    case 'alternate_contact':
      return { ok: true };
    case 'halal':
      if (draft.kitchen_halal_certified === null) {
        return { ok: false, message: 'Let us know if your kitchen is halal certified.' };
      }
      return { ok: true };
    case 'certificates': {
      const { sfa, wsq, halal } = draft.compliance_uploaded;
      if (!sfa || !wsq) return { ok: false, message: 'Upload SFA and WSQ certificates to continue.' };
      if (draft.kitchen_halal_certified && !halal) {
        return { ok: false, message: 'Upload your Halal certificate or mark kitchen as non-halal.' };
      }
      return { ok: true };
    }
    case 'kitchen_available':
      return { ok: true };
    case 'menu_basics': {
      if (draft.dish_cuisine.trim().length < 2) return { ok: false, message: 'Select a cuisine.' };
      if (draft.dish_name.trim().length < 3) return { ok: false, message: 'Dish name must be at least 3 characters.' };
      const price = Number(draft.dish_price);
      if (!Number.isFinite(price) || price <= 0) return { ok: false, message: 'Enter a valid list price.' };
      return { ok: true };
    }
    case 'menu_details':
      if (draft.dish_ingredients.trim().length < 3) {
        return { ok: false, message: 'List at least one main ingredient.' };
      }
      if (draft.dish_description.trim().length < 10) {
        return { ok: false, message: 'Add a brief description (10+ characters).' };
      }
      if (!Number.isFinite(draft.dish_lead_days) || draft.dish_lead_days < 1) {
        return { ok: false, message: 'Minimum order time must be at least 1 day.' };
      }
      if (!draft.dish_lead_time_slot.trim()) {
        return { ok: false, message: 'Pick a preferred collection time window.' };
      }
      return { ok: true };
    case 'menu_photo':
      return { ok: true };
    case 'complete':
      return { ok: true };
    default:
      return { ok: true };
  }
}

export function cookOnboardingStepIndex(stepId: CookOnboardingStepId): number {
  return COOK_ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
}

export type CookOnboardingNavOptions = {
  /** Skip verify_mobile when mobile was already verified at signup. */
  mobileVerified?: boolean;
};

export function cookOnboardingNextStep(
  stepId: CookOnboardingStepId,
  options?: CookOnboardingNavOptions
): CookOnboardingStepId | null {
  const idx = cookOnboardingStepIndex(stepId);
  if (idx < 0 || idx >= COOK_ONBOARDING_STEPS.length - 1) return null;
  let nextIdx = idx + 1;
  if (options?.mobileVerified && COOK_ONBOARDING_STEPS[nextIdx]?.id === 'verify_mobile') {
    nextIdx += 1;
    if (nextIdx >= COOK_ONBOARDING_STEPS.length) return null;
  }
  return COOK_ONBOARDING_STEPS[nextIdx].id;
}

export function cookOnboardingPrevStep(
  stepId: CookOnboardingStepId,
  options?: CookOnboardingNavOptions
): CookOnboardingStepId | null {
  const idx = cookOnboardingStepIndex(stepId);
  if (idx <= 0) return null;
  let prevIdx = idx - 1;
  if (options?.mobileVerified && COOK_ONBOARDING_STEPS[prevIdx]?.id === 'verify_mobile') {
    prevIdx -= 1;
    if (prevIdx < 0) return null;
  }
  return COOK_ONBOARDING_STEPS[prevIdx].id;
}

export function cookOnboardingChapterDotProgress(stepId: CookOnboardingStepId): {
  chapterIndex: number;
  totalChapters: number;
  chapterLabel: string;
  percentComplete: number;
} {
  const step = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId);
  const chapter = step?.chapter ?? 'welcome';
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

export function cookOnboardingChapterProgress(stepId: CookOnboardingStepId): {
  chapter: CookOnboardingChapterId;
  chapterLabel: string;
  stepInChapter: number;
  stepsInChapter: number;
  overallStep: number;
  overallTotal: number;
} {
  const step = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId);
  const chapter = step?.chapter ?? 'welcome';
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
  return {
    display_name: draft.display_name.trim(),
    area: normalizeCookAreaInput(draft.area),
    collection_address: draft.kitchen_address.trim(),
    collection_instructions: draft.collection_instructions.trim() || undefined,
    contact_mobile: normalizePaynowMobile(draft.contact_mobile),
    whatsapp_number: draft.whatsapp_same ? normalizePaynowMobile(draft.contact_mobile) : undefined,
    paynow_mobile: normalizePaynowMobile(draft.paynow_mobile),
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

export function buildCookOnboardingFirstListingPayload(draft: CookOnboardingDraft): Record<string, unknown> {
  const price = Number(draft.dish_price);
  const minQty = draft.dish_recommended_pax;
  const ingredients = draft.dish_ingredients
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((name) => ({ name, quantity: 1, unit: draft.dish_portion_unit }));

  return {
    name: draft.dish_name.trim(),
    description: draft.dish_description.trim(),
    cuisine: draft.dish_cuisine.trim(),
    price,
    min_qty: minQty,
    halal: draft.kitchen_halal_certified === true,
    ingredients: ingredients.length ? ingredients : [{ name: 'See description', quantity: 1, unit: 'portion' }],
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
] as const;
