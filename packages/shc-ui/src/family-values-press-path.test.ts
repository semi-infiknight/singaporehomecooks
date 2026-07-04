import { describe, expect, it, vi } from 'vitest';
import {
  clearSharedDishLayout,
  getSharedDishLayout,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  navigateSharedDishPress,
  runMeasuredSharedDishPress,
} from './family-values-core';

/** Contract test for the RN press path (measureInWindow → register → navigate). */
describe('shared dish press path (RN contract)', () => {
  const cardMeasure = { x: 12, y: 218, w: 171, h: 140 };

  it('runMeasuredSharedDishPress registers layout before onNavigate runs', () => {
    clearSharedDishLayout('path-rn-1');
    let layoutInsideCallback: ReturnType<typeof getSharedDishLayout>;
    const onNavigate = vi.fn(() => {
      layoutInsideCallback = getSharedDishLayout('path-rn-1');
    });
    const result = runMeasuredSharedDishPress('path-rn-1', (cb) => cb(cardMeasure.x, cardMeasure.y, cardMeasure.w, cardMeasure.h), onNavigate);
    expect(result.navigated).toBe(true);
    expect(result.layoutAtNavigate).toEqual(cardMeasure);
    expect(layoutInsideCallback!).toEqual(cardMeasure);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    clearSharedDishLayout('path-rn-1');
  });

  it('press path yields hero morph origin with scale < 1', () => {
    clearSharedDishLayout('path-rn-hero');
    runMeasuredSharedDishPress('path-rn-hero', (cb) => cb(cardMeasure.x, cardMeasure.y, cardMeasure.w, cardMeasure.h));
    const sync = getSyncHeroTransformForDish('path-rn-hero', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(true);
    expect(sync.initialScale).toBeLessThan(1);
    expect(sync.initialScale).toBeCloseTo(Math.max(cardMeasure.w / HERO_RECT_MOBILE.w, cardMeasure.h / HERO_RECT_MOBILE.h), 5);
    clearSharedDishLayout('path-rn-hero');
  });

  it('navigates without measure when layout was cached on mount', () => {
    clearSharedDishLayout('path-rn-cache');
    navigateSharedDishPress('path-rn-cache', cardMeasure);
    const onNavigate = vi.fn();
    navigateSharedDishPress('path-rn-cache', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(getSyncHeroTransformForDish('path-rn-cache', HERO_RECT_MOBILE).hasOrigin).toBe(true);
    clearSharedDishLayout('path-rn-cache');
  });
});