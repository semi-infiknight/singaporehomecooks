import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateMorphContinuity } from './family-values-core';

const scratch = process.env.FAMILY_VALUES_SCRATCH || '';
const morphPath = scratch ? resolve(scratch, 'morph-flow.json') : '';
const hasMorphFlow = Boolean(morphPath && existsSync(morphPath));

describe('morph continuity unit (always runs)', () => {
  it('rejects off-screen card y=833', () => {
    const result = validateMorphContinuity(
      { x: 16, y: 833, w: 358, h: 140 },
      { x: 0, y: 0, w: 390, h: 224 }
    );
    expect(result.ok).toBe(false);
    expect(result.cardOnScreen).toBe(false);
  });
});

describe.skipIf(!hasMorphFlow)('morph-flow.json evidence (required for FV verification)', () => {
  it('validates click-time discover→PDP continuity from morph-flow.json only', () => {
    const flow = JSON.parse(readFileSync(morphPath, 'utf8')) as {
      clickDishImage: { x: number; y: number; w: number; h: number };
      heroImage: { x: number; y: number; w: number; h: number };
      continuity: { ok: boolean };
      morphFrames?: Array<{ delay: number; heroImage?: { w: number; y: number } }>;
    };
    expect(flow.clickDishImage.y).toBeLessThan(400);
    expect(flow.clickDishImage.y).toBeGreaterThan(100);
    expect(flow.heroImage.h).toBe(224);
    const result = validateMorphContinuity(flow.clickDishImage, flow.heroImage);
    expect(result.ok).toBe(true);
    expect(flow.continuity.ok).toBe(true);
    expect(flow.morphFrames?.length).toBeGreaterThanOrEqual(3);
    expect(flow.morphFrames?.find((f) => f.delay === 320)?.heroImage?.w).toBe(390);
  });
});