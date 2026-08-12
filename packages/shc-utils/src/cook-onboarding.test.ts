import { describe, expect, it } from 'vitest';
import {
  COOK_ONBOARDING_STEPS,
  createEmptyCookOnboardingDraft,
  validateCookOnboardingStep,
  validateCookOnboardingDish,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
  cookOnboardingChapterProgress,
  cookOnboardingNextStep,
  cookOnboardingPrevStep,
  cookOnboardingLinearProgress,
  coerceCookOnboardingStepId,
  cookOnboardingCookTakeHome,
  collectCookOnboardingDishes,
} from './cook-onboarding';

describe('cook-onboarding steps', () => {
  it('is a 9-screen kitchen-to-menu flow', () => {
    expect(COOK_ONBOARDING_STEPS.map((s) => s.id)).toEqual([
      'kitchen',
      'paynow',
      'legal',
      'responsible_person',
      'nric_fin',
      'alternate_contact',
      'halal',
      'certificates',
      'menu',
    ]);
    expect(COOK_ONBOARDING_STEPS[0]?.id).toBe('kitchen');
    expect(COOK_ONBOARDING_STEPS.at(-1)?.id).toBe('menu');
    expect(COOK_ONBOARDING_STEPS.length).toBe(9);
  });

  it('coerces stale draft step ids onto kitchen', () => {
    expect(coerceCookOnboardingStepId('welcome')).toBe('kitchen');
    expect(coerceCookOnboardingStepId('menu')).toBe('menu');
  });

  it('validates kitchen name + selected address together', () => {
    const draft = createEmptyCookOnboardingDraft();
    expect(validateCookOnboardingStep('kitchen', draft).ok).toBe(false);
    draft.display_name = 'Auntie Rose';
    draft.kitchen_address = 'Blk 88 Tampines Street 1';
    expect(validateCookOnboardingStep('kitchen', draft).ok).toBe(true);
  });

  it('validates paynow confirm match', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.paynow_mobile = '91234567';
    draft.paynow_mobile_confirm = '91234568';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(false);
    draft.paynow_mobile_confirm = '91234567';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(true);
  });

  it('lets cooks skip the menu card with no dish filled', () => {
    const draft = createEmptyCookOnboardingDraft();
    expect(validateCookOnboardingStep('menu', draft).ok).toBe(true);
  });

  it('validates a filled menu card before publish', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.dish_name = 'Nasi';
    expect(validateCookOnboardingStep('menu', draft).ok).toBe(false);
    draft.dish_cuisine = 'Malay';
    draft.dish_name = 'Nasi Lemak';
    draft.dish_price = '12';
    draft.dish_ingredients = 'Rice, sambal';
    draft.dish_description = 'Coconut rice with sambal';
    expect(validateCookOnboardingDish(draft).ok).toBe(true);
    expect(validateCookOnboardingStep('menu', draft).ok).toBe(true);
    draft.dish_recommended_pax = 0;
    expect(validateCookOnboardingDish(draft).ok).toBe(false);
    draft.dish_recommended_pax = 8;
    expect(validateCookOnboardingDish(draft).ok).toBe(true);
  });

  it('shows cook take-home after the 15% cut', () => {
    const preview = cookOnboardingCookTakeHome(12);
    expect(preview?.cook).toBe(10.2);
    expect(preview?.fee).toBe(1.8);
  });

  it('builds profile payload with onboarding completion', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.display_name = 'Auntie Rose';
    draft.area = 'Tampines';
    draft.kitchen_address = 'Blk 123 Tampines St 42 #05-123';
    draft.pdpa_consent = true;
    draft.terms_consent = true;
    const payload = buildCookOnboardingProfilePayload(draft);
    expect(payload.display_name).toBe('Auntie Rose');
    expect(payload.onboarding_completed_at).toBeTruthy();
  });

  it('builds listing payload with ingredient quantity/unit for API schema', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.dish_name = 'Nasi Lemak';
    draft.dish_description = 'Coconut rice with sambal';
    draft.dish_cuisine = 'Malay';
    draft.dish_price = '12';
    draft.dish_ingredients = 'Rice, sambal';
    draft.dish_lead_time_slot = 'Evening';
    const payload = buildCookOnboardingFirstListingPayload(draft);
    expect(payload.ingredients).toEqual([
      { name: 'Rice', quantity: 1, unit: 'serving' },
      { name: 'sambal', quantity: 1, unit: 'serving' },
    ]);
    expect(payload.min_qty).toBe(5);
    expect(collectCookOnboardingDishes(draft)).toHaveLength(1);
  });

  it('reports chapter progress', () => {
    const p = cookOnboardingChapterProgress('paynow');
    expect(p.chapterLabel).toBe('Get paid');
    expect(p.overallStep).toBe(2);
  });

  it('goes kitchen → paynow', () => {
    expect(cookOnboardingNextStep('kitchen')).toBe('paynow');
    expect(cookOnboardingPrevStep('paynow')).toBe('kitchen');
  });

  it('tracks linear progress across 9 screens', () => {
    const linear = cookOnboardingLinearProgress('menu');
    expect(linear.total).toBe(9);
    expect(linear.current).toBe(9);
    expect(linear.percent).toBe(100);
  });

  it('allows finishing menu when dishes are saved and the form is collapsed', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.saved_dishes = [
      {
        ...createEmptyCookOnboardingDraft(),
        dish_name: 'Nasi Lemak',
        dish_cuisine: 'Malay',
        dish_price: '12',
        dish_ingredients: 'Rice',
        dish_description: 'Coconut rice',
      },
    ];
    expect(validateCookOnboardingStep('menu', draft).ok).toBe(true);
    expect(collectCookOnboardingDishes(draft)).toHaveLength(1);
  });
});
