import { describe, expect, it, vi } from 'vitest';
import {
  applySharedDishPress,
  applySharedDishPressStrict,
  cacheSharedDishLayoutFromRef,
  clearSharedDishLayout,
  computeMorphingLabelSegments,
  getSharedDishLayout,
  hasSharedDishLayout,
  morphingLabelFinalText,
  morphingLabelInitialText,
  wizardCtaMorphOnStepEnter,
} from './family-values-core';

describe('applySharedDishPress (runtime)', () => {
  it('registers valid measure then calls onNavigate', () => {
    clearSharedDishLayout('dish-rt-1');
    const onNavigate = vi.fn();
    applySharedDishPress('dish-rt-1', { x: 12, y: 88, w: 160, h: 140 }, onNavigate);
    expect(getSharedDishLayout('dish-rt-1')).toEqual({ x: 12, y: 88, w: 160, h: 140 });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    clearSharedDishLayout('dish-rt-1');
  });

  it('strict mode skips navigate when no layout and no cache', () => {
    clearSharedDishLayout('dish-strict-none');
    const onNavigate = vi.fn();
    const ok = applySharedDishPressStrict('dish-strict-none', null, onNavigate);
    expect(ok).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('strict mode navigates with cached layout when measure null', () => {
    clearSharedDishLayout('dish-strict-cache');
    cacheSharedDishLayoutFromRef('dish-strict-cache', (cb) => cb(5, 10, 120, 100));
    const onNavigate = vi.fn();
    const ok = applySharedDishPressStrict('dish-strict-cache', null, onNavigate);
    expect(ok).toBe(true);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(hasSharedDishLayout('dish-strict-cache')).toBe(true);
    clearSharedDishLayout('dish-strict-cache');
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