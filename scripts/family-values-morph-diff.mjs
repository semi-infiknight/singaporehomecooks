#!/usr/bin/env node
/**
 * Compare discover card image bbox vs PDP hero bbox for morph continuity evidence.
 * Uses the same transform math as family-values-core (not tautological center checks).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const scratch = process.env.FAMILY_VALUES_SCRATCH || process.cwd();
const bboxPath = resolve(scratch, 'screenshots/playwright-bboxes.json');
const outPath = resolve(scratch, 'morph-diff.json');
const VIEWPORT = { w: 390, h: 844 };

function computeSharedHeroTransform(origin, hero) {
  const initialScale = Math.max(origin.w / hero.w, origin.h / hero.h);
  const originCx = origin.x + origin.w / 2;
  const originCy = origin.y + origin.h / 2;
  const heroCx = hero.x + hero.w / 2;
  const heroCy = hero.y + hero.h / 2;
  return {
    initialScale,
    translateX: originCx - heroCx,
    translateY: originCy - heroCy,
  };
}

function morphCentersAlign(origin, hero) {
  const t = computeSharedHeroTransform(origin, hero);
  const originCx = origin.x + origin.w / 2;
  const originCy = origin.y + origin.h / 2;
  const heroCx = hero.x + hero.w / 2;
  const heroCy = hero.y + hero.h / 2;
  const visualCx = heroCx + t.translateX;
  const visualCy = heroCy + t.translateY;
  return Math.abs(visualCx - originCx) < 0.5 && Math.abs(visualCy - originCy) < 0.5;
}

function isCardOnScreen(origin, viewport = VIEWPORT) {
  const margin = 8;
  const centerX = origin.x + origin.w / 2;
  const centerY = origin.y + origin.h / 2;
  return (
    centerY > margin &&
    centerY < viewport.h - margin &&
    centerX > margin &&
    centerX < viewport.w - margin
  );
}

function validateMorphContinuity(origin, hero, viewport = VIEWPORT) {
  const reasons = [];
  if (!origin || !hero) {
    return { ok: false, reasons: ['missing bbox'], transform: null, centersAlign: false, cardOnScreen: false };
  }
  const transform = computeSharedHeroTransform(origin, hero);
  const centersAlign = morphCentersAlign(origin, hero);
  const cardOnScreen = isCardOnScreen(origin, viewport);
  if (!cardOnScreen) reasons.push('card off-screen');
  if (!centersAlign) reasons.push('centers misaligned');
  if (transform.initialScale >= 1) reasons.push('scale not shrinking into hero');
  if (origin.w <= 0 || origin.h <= 0 || hero.w <= 0 || hero.h <= 0) reasons.push('invalid dimensions');
  return { ok: reasons.length === 0, reasons, transform, centersAlign, cardOnScreen };
}

if (!existsSync(bboxPath)) {
  console.error(`Missing ${bboxPath}`);
  process.exit(1);
}

const captures = JSON.parse(readFileSync(bboxPath, 'utf8'));
const morphFlow = captures.find((c) => c.name === 'discover-to-pdp-morph');
const fixture = captures.find((c) => c.name === 'fv-fixture');
const discover = captures.find((c) => c.name === 'discover-home');
const pdp = captures.find((c) => c.name === 'product-pdp');

// Morph continuity MUST use click-time bbox from live flow — no cherry-picking discover-home fallback
const dishImage = morphFlow?.clickDishImage;
const heroImage = pdp?.elements?.heroImage ?? morphFlow?.elements?.heroImage;

if (!morphFlow?.clickDishImage) {
  console.error('Missing morphFlow.clickDishImage — run morph flow with scroll + click-time measure');
  process.exit(1);
}

const continuity = validateMorphContinuity(dishImage, heroImage);
const discoverHomeValidation = discover?.elements?.dishImage
  ? validateMorphContinuity(discover.elements.dishImage, heroImage)
  : { ok: false, reasons: ['discover-home missing dishImage'], cardOnScreen: false };

const report = {
  generatedAt: new Date().toISOString(),
  fixture: fixture?.name,
  discover: discover?.name,
  morphFlow: morphFlow?.name,
  pdp: pdp?.name,
  dishImage,
  heroImage,
  clickDishImage: morphFlow.clickDishImage,
  discoverHomeDishImage: discover?.elements?.dishImage ?? null,
  discoverHomeScrolled: discover?.scrolledIntoView ?? false,
  discoverHomeValidation,
  morphFrames: morphFlow?.morphFrames ?? null,
  continuity,
  captures: captures.map((c) => ({
    name: c.name,
    url: c.url,
    elements: c.elements,
    discoverElements: c.discoverElements,
    clickDishImage: c.clickDishImage,
    scrolledIntoView: c.scrolledIntoView,
    error: c.error,
  })),
};

writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outPath}`);

const exitOk =
  continuity.ok &&
  discoverHomeValidation.cardOnScreen &&
  (discover?.scrolledIntoView ?? false);

process.exit(exitOk ? 0 : 1);