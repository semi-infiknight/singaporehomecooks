import { describe, expect, it } from 'vitest';
import {
  COOK_ONBOARDING_STEPS,
  createEmptyCookOnboardingDraft,
  validateCookOnboardingStep,
  buildCookOnboardingProfilePayload,
  cookOnboardingChapterProgress,
} from './cook-onboarding';

describe('cook-onboarding steps', () => {
  it('has welcome and complete bookends', () => {
    expect(COOK_ONBOARDING_STEPS[0]?.id).toBe('welcome');
    expect(COOK_ONBOARDING_STEPS.at(-1)?.id).toBe('complete');
    expect(COOK_ONBOARDING_STEPS.length).toBeGreaterThanOrEqual(18);
  });

  it('validates paynow confirm match', () => {
    const draft = createEmptyCookOnboardingDraft();
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

  it('reports chapter progress', () => {
    const p = cookOnboardingChapterProgress('paynow');
    expect(p.chapterLabel).toBe('Get paid');
    expect(p.overallStep).toBeGreaterThan(1);
  });
});
