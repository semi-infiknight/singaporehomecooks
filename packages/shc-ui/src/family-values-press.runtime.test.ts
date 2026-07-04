import { describe, expect, it, vi } from 'vitest';
import {
  cacheSharedDishLayoutFromRef,
  clearSharedDishLayout,
  computeMorphingLabelSegments,
  getSharedDishLayout,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  morphingLabelFinalText,
  morphingLabelInitialText,
  navigateSharedDishPress,
  wizardCtaMorphOnStepEnter,
} from './family-values-core';

describe('navigateSharedDishPress (runtime)', () => {
  it('registers valid measure then calls onNavigate', () => {
    clearSharedDishLayout('dish-rt-1');
    const onNavigate = vi.fn();
    navigateSharedDishPress('dish-rt-1', { x: 12, y: 88, w: 160, h: 140 }, onNavigate);
    expect(getSharedDishLayout('dish-rt-1')).toEqual({ x: 12, y: 88, w: 160, h: 140 });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const sync = getSyncHeroTransformForDish('dish-rt-1', HERO_RECT_MOBILE);
    expect(sync.hasOrigin).toBe(true);
    clearSharedDishLayout('dish-rt-1');
  });

  it('always navigates when no layout and no cache', () => {
    clearSharedDishLayout('dish-nav-none');
    const onNavigate = vi.fn();
    navigateSharedDishPress('dish-nav-none', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(getSharedDishLayout('dish-nav-none')).toBeUndefined();
    clearSharedDishLayout('dish-nav-none');
  });

  it('navigates with cached layout when measure null', () => {
    clearSharedDishLayout('dish-nav-cache');
    cacheSharedDishLayoutFromRef('dish-nav-cache', (cb) => cb(5, 10, 120, 100));
    const onNavigate = vi.fn();
    navigateSharedDishPress('dish-nav-cache', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(getSyncHeroTransformForDish('dish-nav-cache', HERO_RECT_MOBILE).hasOrigin).toBe(true);
    clearSharedDishLayout('dish-nav-cache');
  });

  it('cacheSharedDishLayoutFromRef warms registry before press', () => {
    clearSharedDishLayout('dish-cache');
    cacheSharedDishLayoutFromRef('dish-cache', (cb) => cb(20, 30, 88, 88));
    expect(getSharedDishLayout('dish-cache')).toEqual({ x: 20, y: 30, w: 88, h: 88 });
    clearSharedDishLayout('dish-cache');
  });
});

describe('wizard step1 morph phases', () => {
  it('step1 enter morphs Start to Continue with visible out segment', () => {
    const morph = wizardCtaMorphOnStepEnter(1, 4, false);
    expect(morph).toEqual({ from: 'Start', to: 'Continue' });
    expect(morphingLabelInitialText(morph.from, morph.to)).toBe('Start');
    expect(morphingLabelFinalText(morph.from, morph.to)).toBe('Continue');
    const segs = computeMorphingLabelSegments(morph.from, morph.to);
    expect(segs.find((s) => s.kind === 'out')?.text).toBe('Start');
    expect(segs.find((s) => s.kind === 'in')?.text).toBe('Continue');
    expect(morphingLabelInitialText(morph.from, morph.to)).toBe('Start');
    expect(morphingLabelFinalText(morph.from, morph.to)).toBe('Continue');
  });
});