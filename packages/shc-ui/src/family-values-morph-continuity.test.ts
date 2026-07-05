import { describe, expect, it } from 'vitest';
import {
  clearSharedDishLayout,
  computeSharedHeroTransform,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  HERO_RECT_WEB,
  morphCentersAlign,
  navigateSharedDishPress,
  registerSharedDishLayout,
  scaledOriginBoundsAtMorphStart,
  validateMorphContinuity,
  isCardOnScreen,
  wizardCtaMorphOnStepEnter,
  morphingLabelInitialText,
  morphingLabelFinalText,
} from './family-values-core';

describe('discover→PDP morph continuity', () => {
  const mobileCard = { x: 12, y: 218, w: 171, h: 140 };
  const webCard = { x: 16, y: 192, w: 358, h: 140 };

  it('mobile card thumbnail scales into hero with center alignment', () => {
    const t = computeSharedHeroTransform(mobileCard, HERO_RECT_MOBILE);
    expect(t.initialScale).toBeCloseTo(Math.max(mobileCard.w / HERO_RECT_MOBILE.w, mobileCard.h / HERO_RECT_MOBILE.h), 5);
    const originCx = mobileCard.x + mobileCard.w / 2;
    const heroCx = HERO_RECT_MOBILE.w / 2;
    expect(t.translateX).toBeCloseTo(originCx - heroCx, 1);
    expect(morphCentersAlign(mobileCard, HERO_RECT_MOBILE)).toBe(true);
    const scaled = scaledOriginBoundsAtMorphStart(mobileCard, HERO_RECT_MOBILE);
    expect(t.initialScale).toBeLessThan(1);
    expect(scaled.w).toBeLessThan(HERO_RECT_MOBILE.w);
    expect(scaled.h).toBeLessThan(HERO_RECT_MOBILE.h);
  });

  it('web card layout registers and produces hero origin', () => {
    clearSharedDishLayout('fv-web-dish');
    navigateSharedDishPress('fv-web-dish', webCard);
    const sync = getSyncHeroTransformForDish('fv-web-dish', HERO_RECT_WEB);
    expect(sync.hasOrigin).toBe(true);
    expect(sync.initialScale).toBeLessThan(1);
    expect(morphCentersAlign(webCard, HERO_RECT_WEB)).toBe(true);
    clearSharedDishLayout('fv-web-dish');
  });

  it('validateMorphContinuity rejects off-screen card (y=833 on 844h viewport)', () => {
    const offScreen = { x: 16, y: 833, w: 173, h: 140 };
    const hero = { x: 0, y: 0, w: 390, h: 224 };
    expect(isCardOnScreen(offScreen)).toBe(false);
    const result = validateMorphContinuity(offScreen, hero);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('card off-screen');
  });

  it('validateMorphContinuity passes on-screen card with measured hero', () => {
    const onScreen = { x: 16, y: 420, w: 173, h: 140 };
    const hero = { x: 0, y: 0, w: 390, h: 224 };
    expect(validateMorphContinuity(onScreen, hero).ok).toBe(true);
  });

  it('identity fallback when no origin (no silent morph failure)', () => {
    clearSharedDishLayout('fv-none');
    const sync = getSyncHeroTransformForDish('fv-none', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(false);
    expect(sync.initialScale).toBe(1);
    expect(sync.translateX).toBe(0);
    expect(sync.translateY).toBe(0);
  });
});

describe('wizard morph label visible phases', () => {
  const steps = [
    { step: 1, from: 'Start', to: 'Continue' },
    { step: 2, from: 'Continue', to: 'Next' },
    { step: 3, from: 'Next', to: 'Review' },
    { step: 4, from: 'Review', to: 'Publish' },
  ];

  it.each(steps)('step $step shows "$from" then morphs to "$to"', ({ step, from, to }) => {
    const morph = wizardCtaMorphOnStepEnter(step, 4, false);
    expect(morph).toEqual({ from, to });
    expect(morphingLabelInitialText(morph.from, morph.to)).toBe(from);
    expect(morphingLabelFinalText(morph.from, morph.to)).toBe(to);
  });

  it('editing on final step morphs to Save changes', () => {
    const morph = wizardCtaMorphOnStepEnter(4, 4, true);
    expect(morph.to).toBe('Save changes');
    expect(morphingLabelFinalText(morph.from, morph.to)).toBe('Save changes');
  });
});