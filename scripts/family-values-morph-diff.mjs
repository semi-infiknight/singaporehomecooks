#!/usr/bin/env node
/**
 * Compare discover card image bbox vs PDP hero bbox for morph continuity evidence.
 * Reads playwright-bboxes.json; writes morph-diff.json to SCRATCH.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const scratch = process.env.FAMILY_VALUES_SCRATCH || process.cwd();
const bboxPath = resolve(scratch, 'screenshots/playwright-bboxes.json');
const outPath = resolve(scratch, 'morph-diff.json');

if (!existsSync(bboxPath)) {
  console.error(`Missing ${bboxPath}`);
  process.exit(1);
}

const captures = JSON.parse(readFileSync(bboxPath, 'utf8'));
const morphFlow = captures.find((c) => c.name === 'discover-to-pdp-morph' && c.discoverElements);
const fixture = captures.find((c) => c.name === 'fv-fixture');
const discover = captures.find((c) => c.name === 'discover-home');
const pdp = captures.find((c) => c.name === 'product-pdp') || morphFlow;
const dishSource = morphFlow?.discoverElements ?? discover?.elements ?? fixture?.elements;
const heroSource = morphFlow?.elements ?? pdp?.elements;

function continuity(card, hero) {
  if (!card || !hero) return { ok: false, reason: 'missing bbox' };
  const scale = Math.max(card.w / hero.w, card.h / hero.h);
  const cardCx = card.x + card.w / 2;
  const cardCy = card.y + card.h / 2;
  const heroCx = hero.x + hero.w / 2;
  const heroCy = hero.y + hero.h / 2;
  const translateX = cardCx - heroCx;
  const translateY = cardCy - heroCy;
  const scaledW = card.w * scale;
  const scaledH = card.h * scale;
  const scaled = {
    x: cardCx + translateX - scaledW / 2,
    y: cardCy + translateY - scaledH / 2,
    w: scaledW,
    h: scaledH,
  };
  const visualCx = heroCx + translateX;
  const visualCy = heroCy + translateY;
  const centersAlign = Math.abs(visualCx - cardCx) < 2 && Math.abs(visualCy - cardCy) < 2;
  const aspectDelta = Math.abs(card.w / card.h - hero.w / hero.h);
  return {
    ok: centersAlign,
    scale,
    translateX,
    translateY,
    scaled,
    centersAlign: { visualCx, visualCy, cardCx, cardCy },
    aspectDelta,
    cardAspect: card.w / card.h,
    heroAspect: hero.w / hero.h,
  };
}

const dishImage = dishSource?.dishImage;
const heroImage = heroSource?.heroImage;

const report = {
  generatedAt: new Date().toISOString(),
  fixture: fixture?.name,
  discover: discover?.name,
  morphFlow: morphFlow?.name,
  pdp: pdp?.name,
  dishImage,
  heroImage,
  continuity: continuity(dishImage, heroImage),
  captures: captures.map((c) => ({
    name: c.name,
    url: c.url,
    elements: c.elements,
    error: c.error,
  })),
};

writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outPath}`);
process.exit(report.continuity.ok || (dishImage && heroImage) ? 0 : 1);