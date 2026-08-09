import { describe, expect, it } from 'vitest';
import {
  COOK_ONBOARDING_STEPS,
  createEmptyCookOnboardingDraft,
  validateCookOnboardingStep,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
  cookOnboardingChapterProgress,
  cookOnboardingNextStep,
  cookOnboardingPrevStep,
  cookOnboardingChapterDotProgress,
  cookOnboardingLinearProgress,
} from './cook-onboarding';

describe('cook-onboarding steps', () => {
  it('has welcome and complete bookends (Notion Flow order)', () => {
    expect(COOK_ONBOARDING_STEPS[0]?.id).toBe('welcome');
    expect(COOK_ONBOARDING_STEPS.at(-1)?.id).toBe('complete');
    expect(COOK_ONBOARDING_STEPS.length).toBe(26);
    expect(COOK_ONBOARDING_STEPS[1]?.id).toBe('area');
    expect(COOK_ONBOARDING_STEPS[2]?.id).toBe('paynow');
    expect(COOK_ONBOARDING_STEPS.find((s) => s.id === 'mobile')).toBeUndefined();
    expect(COOK_ONBOARDING_STEPS.find((s) => s.id === 'kitchen_address')?.chapter).toBe('identity');
    expect(COOK_ONBOARDING_STEPS.find((s) => s.id === 'menu_cuisine')).toBeTruthy();
  });

  it('validates paynow from WhatsApp when same-as toggle is on', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.whatsapp_same = true;
    draft.contact_mobile = '91234567';
    draft.paynow_mobile = '';
    draft.paynow_mobile_confirm = '';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(true);
  });

  it('validates paynow same-as when only prefilled paynow fields exist', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.whatsapp_same = true;
    draft.contact_mobile = '';
    draft.paynow_mobile = '91234567';
    draft.paynow_mobile_confirm = '91234567';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(true);
  });

  it('validates paynow confirm match', () => {
    const draft = createEmptyCookOnboardingDraft();
    draft.whatsapp_same = false;
    draft.paynow_mobile = '91234567';
    draft.paynow_mobile_confirm = '91234568';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(false);
    draft.paynow_mobile_confirm = '91234567';
    expect(validateCookOnboardingStep('paynow', draft).ok).toBe(true);
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
  });

  it('reports chapter progress', () => {
    const p = cookOnboardingChapterProgress('paynow');
    expect(p.chapterLabel).toBe('Get paid');
    expect(p.overallStep).toBeGreaterThan(1);
  });

  it('goes area → paynow after phone auth (no mobile steps in wizard)', () => {
    expect(cookOnboardingNextStep('area')).toBe('paynow');
    expect(cookOnboardingPrevStep('paynow')).toBe('area');
  });

  it('supports back navigation, chapter dots, and linear progress', () => {
    const dots = cookOnboardingChapterDotProgress('menu_cuisine');
    expect(dots.totalChapters).toBe(8);
    expect(dots.percentComplete).toBeGreaterThan(50);
    const linear = cookOnboardingLinearProgress('menu_cuisine');
    expect(linear.total).toBe(26);
    expect(linear.percent).toBeGreaterThan(50);
  });
});
