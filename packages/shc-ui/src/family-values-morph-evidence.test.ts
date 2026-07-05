import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateMorphContinuity } from './family-values-core';

const scratch = process.env.FAMILY_VALUES_SCRATCH || '';
const bboxPath = scratch ? resolve(scratch, 'screenshots/playwright-bboxes.json') : '';
const hasEvidence = Boolean(bboxPath && existsSync(bboxPath));

describe('morph continuity unit (always runs)', () => {
  it('rejects off-screen card y=833', () => {
    const result = validateMorphContinuity(
      { x: 16, y: 833, w: 358, h: 140 },
      { x: 0, y: 0, w: 390, h: 224 }
    );
    expect(result.ok).toBe(false);
    expect(result.cardOnScreen).toBe(false);
  });

  it('passes on-screen card with 224px hero', () => {
    const result = validateMorphContinuity(
      { x: 16, y: 216, w: 358, h: 140 },
      { x: 0, y: 0, w: 390, h: 224 }
    );
    expect(result.ok).toBe(true);
  });
});

describe.skipIf(!hasEvidence)('playwright morph evidence (scratch bboxes required)', () => {
  it('validates click-time discover→PDP continuity — no discover-home cherry-pick', () => {
    const captures = JSON.parse(readFileSync(bboxPath, 'utf8')) as Array<{
      name: string;
      discoverElements?: { dishImage?: { x: number; y: number; w: number; h: number } };
      elements?: { dishImage?: { x: number; y: number; w: number; h: number }; heroImage?: { x: number; y: number; w: number; h: number } };
      clickDishImage?: { x: number; y: number; w: number; h: number };
      scrolledIntoView?: boolean;
      morphFrames?: Array<{ delay: number; heroImage?: { w: number; y: number } }>;
    }>;
    const morphFlow = captures.find((c) => c.name === 'discover-to-pdp-morph');
    const discover = captures.find((c) => c.name === 'discover-home');
    const pdp = captures.find((c) => c.name === 'product-pdp');

    expect(morphFlow?.clickDishImage).toBeDefined();
    const origin = morphFlow!.clickDishImage!;
    const hero = pdp?.elements?.heroImage ?? morphFlow?.elements?.heroImage;
    const result = validateMorphContinuity(origin, hero);
    expect(result.centersAlign).toBe(true);
    expect(result.cardOnScreen).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(hero?.h).toBe(224);

    // discover-home must be on-screen after scroll (not y=833)
    expect(discover?.scrolledIntoView).toBe(true);
    const discoverResult = validateMorphContinuity(discover?.elements?.dishImage, hero);
    expect(discoverResult.cardOnScreen).toBe(true);
    expect(discover?.elements?.dishImage?.y).toBeLessThan(800);

    expect(morphFlow?.morphFrames?.length).toBeGreaterThanOrEqual(3);
    const frame0 = morphFlow?.morphFrames?.find((f) => f.delay === 0);
    const frame320 = morphFlow?.morphFrames?.find((f) => f.delay === 320);
    expect(frame320?.heroImage?.w).toBe(390);
    expect(frame0?.heroImage?.y).toBeGreaterThan(0);
  });
});