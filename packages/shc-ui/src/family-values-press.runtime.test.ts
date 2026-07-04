import { describe, expect, it, vi } from 'vitest';
import {
  applySharedDishPress,
  clearSharedDishLayout,
  computeMorphingLabelSegments,
  getSharedDishLayout,
  registerSharedDishLayout,
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

  it('skips register for zero-size measure but still navigates', () => {
    clearSharedDishLayout('dish-rt-2');
    const onNavigate = vi.fn();
    applySharedDishPress('dish-rt-2', { x: 0, y: 0, w: 0, h: 0 }, onNavigate);
    expect(getSharedDishLayout('dish-rt-2')).toBeUndefined();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('navigates when measure is null (no ref)', () => {
    const onNavigate = vi.fn();
    applySharedDishPress('dish-rt-3', null, onNavigate);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('wizard step1 morph data', () => {
  it('step1 enter morphs Start to Continue with visible out segment', () => {
    const morph = wizardCtaMorphOnStepEnter(1, 4, false);
    expect(morph).toEqual({ from: 'Start', to: 'Continue' });
    const segs = computeMorphingLabelSegments(morph.from, morph.to);
    expect(segs.find((s) => s.kind === 'out')?.text).toBe('Start');
    expect(segs.find((s) => s.kind === 'in')?.text).toBe('Continue');
  });
});