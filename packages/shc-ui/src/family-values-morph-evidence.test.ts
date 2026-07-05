import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateMorphContinuity } from './family-values-core';

const scratch = process.env.FAMILY_VALUES_SCRATCH || '';
const bboxPath = scratch ? resolve(scratch, 'screenshots/playwright-bboxes.json') : '';

describe('playwright morph evidence (when scratch bboxes present)', () => {
  it('validates live discover→PDP continuity with real transform math', () => {
    if (!bboxPath || !existsSync(bboxPath)) {
      expect(validateMorphContinuity({ x: 16, y: 400, w: 173, h: 140 }, { x: 0, y: 0, w: 390, h: 224 }).ok).toBe(true);
      return;
    }
    const captures = JSON.parse(readFileSync(bboxPath, 'utf8')) as Array<{
      name: string;
      discoverElements?: { dishImage?: { x: number; y: number; w: number; h: number } };
      elements?: { dishImage?: { x: number; y: number; w: number; h: number }; heroImage?: { x: number; y: number; w: number; h: number } };
      clickDishImage?: { x: number; y: number; w: number; h: number };
    }>;
    const morphFlow = captures.find((c) => c.name === 'discover-to-pdp-morph');
    const discover = captures.find((c) => c.name === 'discover-home');
    const pdp = captures.find((c) => c.name === 'product-pdp');
    const origin = morphFlow?.clickDishImage ?? morphFlow?.discoverElements?.dishImage ?? discover?.elements?.dishImage;
    const hero = pdp?.elements?.heroImage ?? morphFlow?.elements?.heroImage;
    const result = validateMorphContinuity(origin, hero);
    expect(result.centersAlign).toBe(true);
    expect(result.cardOnScreen).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(morphFlow?.morphFrames?.length).toBeGreaterThanOrEqual(3);
    const frame0 = morphFlow?.morphFrames?.find((f) => f.delay === 0);
    const frame320 = morphFlow?.morphFrames?.find((f) => f.delay === 320);
    expect(frame320?.heroImage?.w).toBe(390);
    expect(frame0?.heroImage?.y).toBeGreaterThan(0);
  });
});