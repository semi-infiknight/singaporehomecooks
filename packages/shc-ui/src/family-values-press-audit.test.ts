import { describe, expect, it } from 'vitest';
import {
  cacheSharedDishLayoutFromRef,
  clearSharedDishLayout,
  getSharedDishLayout,
  navigateSharedDishPress,
} from './family-values-core';

/** Runtime handler audit — no source grep; exercises shipped press primitives. */
describe('shared dish press handler audit (runtime)', () => {
  it('press handler registers layout before navigate callback runs', () => {
    clearSharedDishLayout('audit-order');
    let layoutAtNav: ReturnType<typeof getSharedDishLayout>;
    navigateSharedDishPress('audit-order', { x: 4, y: 8, w: 140, h: 140 }, () => {
      layoutAtNav = getSharedDishLayout('audit-order');
    });
    expect(layoutAtNav!).toEqual({ x: 4, y: 8, w: 140, h: 140 });
    clearSharedDishLayout('audit-order');
  });

  it('layout cache enables navigate without fresh measure', () => {
    clearSharedDishLayout('audit-cache');
    cacheSharedDishLayoutFromRef('audit-cache', (cb) => cb(0, 0, 200, 140));
    let navigated = false;
    navigateSharedDishPress('audit-cache', null, () => {
      navigated = true;
    });
    expect(navigated).toBe(true);
    clearSharedDishLayout('audit-cache');
  });

  it('zero-size measure does not register invalid layout but still navigates', () => {
    clearSharedDishLayout('audit-zero');
    let navigated = false;
    navigateSharedDishPress('audit-zero', { x: 0, y: 0, w: 0, h: 0 }, () => {
      navigated = true;
    });
    expect(navigated).toBe(true);
    expect(getSharedDishLayout('audit-zero')).toBeUndefined();
    clearSharedDishLayout('audit-zero');
  });
});