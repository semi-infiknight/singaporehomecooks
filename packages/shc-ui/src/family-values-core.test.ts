import { describe, expect, it } from 'vitest';
import {
  computeMorphingLabelSegments,
  dismissTray,
  markMilestoneSeen,
  morphingLabelTarget,
  popTray,
  pushTray,
  shouldReduceMotion,
  shouldShowMilestone,
  tabSlideDirection,
  trayStackDepth,
  wizardCtaLabel,
  wizardCtaMorphFrom,
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  computeSharedHeroTransform,
} from './family-values-core';

describe('tray stack', () => {
  const frame = { id: 'actions', title: 'Listing', height: 'compact' as const };
  const confirm = { id: 'delete', title: 'Delete?', height: 'medium' as const };

  it('pushes frames and increases depth', () => {
    const s1 = pushTray([], frame);
    expect(trayStackDepth(s1)).toBe(1);
    const s2 = pushTray(s1, confirm);
    expect(trayStackDepth(s2)).toBe(2);
  });

  it('pops to previous frame', () => {
    const s2 = pushTray(pushTray([], frame), confirm);
    expect(trayStackDepth(popTray(s2))).toBe(1);
  });

  it('dismiss clears stack', () => {
    expect(dismissTray(pushTray([], frame))).toEqual([]);
  });
});

describe('computeMorphingLabelSegments', () => {
  it('shares prefix between Continue and Confirm', () => {
    const segs = computeMorphingLabelSegments('Continue', 'Confirm order');
    expect(segs[0]).toEqual({ text: 'Con', kind: 'shared' });
    expect(morphingLabelTarget(segs)).toBe('Confirm order');
  });

  it('handles identical labels', () => {
    const segs = computeMorphingLabelSegments('Publish', 'Publish');
    expect(segs).toEqual([{ text: 'Publish', kind: 'shared' }]);
  });

  it('handles wholly different strings', () => {
    const segs = computeMorphingLabelSegments('Add', 'Pay Now');
    expect(morphingLabelTarget(segs)).toBe('Pay Now');
  });
});

describe('shouldReduceMotion', () => {
  it('respects explicit true', () => {
    expect(shouldReduceMotion(true)).toBe(true);
  });

  it('defaults false when unset', () => {
    expect(shouldReduceMotion(null)).toBe(false);
  });
});

describe('milestones', () => {
  it('shows once per user', () => {
    expect(shouldShowMilestone('first_order', 'u1', {})).toBe(true);
    const seen = markMilestoneSeen('first_order', 'u1', {});
    expect(shouldShowMilestone('first_order', 'u1', seen)).toBe(false);
  });
});

describe('tabSlideDirection', () => {
  it('slides left when moving to higher index', () => {
    expect(tabSlideDirection(0, 2)).toBe('left');
  });

  it('slides right when moving to lower index', () => {
    expect(tabSlideDirection(3, 1)).toBe('right');
  });
});

describe('wizardCtaLabel', () => {
  it('morphs on final step', () => {
    expect(wizardCtaLabel(4, 4, false)).toBe('Publish');
    expect(wizardCtaMorphFrom(4, 4, false)).toEqual({ from: 'Continue', to: 'Publish' });
  });

  it('save when editing', () => {
    expect(wizardCtaLabel(4, 4, true)).toBe('Save changes');
    expect(wizardCtaMorphFrom(4, 4, true).to).toBe('Save changes');
  });

  it('intermediate steps stay Continue', () => {
    expect(wizardCtaMorphFrom(2, 4, false)).toEqual({ from: 'Continue', to: 'Continue' });
  });
});

describe('shared dish layout', () => {
  const card = { x: 16, y: 200, w: 160, h: 140 };
  const hero = { x: 0, y: 0, w: 390, h: 280 };

  it('registers and retrieves layout by dish id', () => {
    registerSharedDishLayout('dish-1', card);
    expect(getSharedDishLayout('dish-1')).toEqual(card);
    clearSharedDishLayout('dish-1');
    expect(getSharedDishLayout('dish-1')).toBeUndefined();
  });

  it('computes hero transform from card origin', () => {
    const t = computeSharedHeroTransform(card, hero);
    expect(t.initialScale).toBeGreaterThan(0);
    expect(t.initialScale).toBeLessThan(1);
    expect(typeof t.translateX).toBe('number');
    expect(typeof t.translateY).toBe('number');
  });
});