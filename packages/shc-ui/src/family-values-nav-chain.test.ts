import { describe, expect, it, vi } from 'vitest';
import {
  cacheSharedDishLayoutFromRef,
  clearSharedDishLayout,
  getSharedDishLayout,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  navigateSharedDishPress,
} from './family-values-core';

describe('shared dish nav chain (cache → press → hero)', () => {
  it('valid measure registers layout and yields hero origin with scale ≠ 1', () => {
    clearSharedDishLayout('chain-measure');
    const onNavigate = vi.fn();
    navigateSharedDishPress('chain-measure', { x: 12, y: 40, w: 160, h: 140 }, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(getSharedDishLayout('chain-measure')).toEqual({ x: 12, y: 40, w: 160, h: 140 });
    const sync = getSyncHeroTransformForDish('chain-measure', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(true);
    expect(sync.initialScale).not.toBe(1);
    clearSharedDishLayout('chain-measure');
  });

  it('cached layout enables hero origin when press measure is null', () => {
    clearSharedDishLayout('chain-cache');
    cacheSharedDishLayoutFromRef('chain-cache', (cb) => cb(8, 16, 120, 100));
    const onNavigate = vi.fn();
    navigateSharedDishPress('chain-cache', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const sync = getSyncHeroTransformForDish('chain-cache', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(true);
    expect(sync.initialScale).not.toBe(1);
    clearSharedDishLayout('chain-cache');
  });

  it('always navigates without layout — hero falls back to identity', () => {
    clearSharedDishLayout('chain-no-layout');
    const onNavigate = vi.fn();
    navigateSharedDishPress('chain-no-layout', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(getSharedDishLayout('chain-no-layout')).toBeUndefined();
    const sync = getSyncHeroTransformForDish('chain-no-layout', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(false);
    clearSharedDishLayout('chain-no-layout');
  });
});