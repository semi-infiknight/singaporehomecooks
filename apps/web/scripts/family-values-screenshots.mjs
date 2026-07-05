#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const e2eSrc = readFileSync(resolve(__dirname, '../../../packages/shc-utils/src/e2e-cart.ts'), 'utf8');
const seedMatch = e2eSrc.match(/id:\s*'([^']+)'/);
if (!seedMatch) throw new Error('E2E_CART_SEED_ITEM id not found in e2e-cart.ts');
const seedId = seedMatch[1];

const outDir = resolve(process.argv[2] || 'screenshots');
const base = process.argv[3] || 'http://localhost:3001';
const shots = [
  { name: 'fv-fixture', path: '/dev/family-values-fixture', waitFor: '[data-testid="fv-fixture-page"]' },
  { name: 'discover-home', path: '/', waitFor: '[data-testid="customer-discover-screen"]' },
  { name: 'product-pdp', path: `/product/${seedId}`, waitFor: `[data-testid="shared-dish-${seedId}-hero"]` },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function measure(sel) {
  const el = page.locator(sel).first();
  if ((await el.count()) === 0) return null;
  const box = await el.boundingBox();
  if (!box) return null;
  return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
}

async function captureElements() {
  return {
    dishCard: await measure('[data-testid^="dish-card-"]'),
    dishImage: await measure('[data-testid$="-image"]'),
    dishPrice: await measure('[data-testid$="-price"]'),
    heroImage: await measure('[data-testid^="shared-dish-"][data-testid$="-hero"]'),
    wizardMorph: await measure('[data-testid$="-morph"]'),
    trayWeb: await measure('[data-testid="shc-tray-web"]'),
  };
}

const captures = [];
for (const s of shots) {
  const url = `${base}${s.path}`;
  const file = resolve(outDir, `${s.name}.png`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (s.waitFor) {
      try {
        await page.waitForSelector(s.waitFor.split(',')[0].trim(), { timeout: 20000 });
      } catch {
        /* partial render ok for diagnostics */
      }
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: file, fullPage: false });
    captures.push({ name: s.name, url, file, viewport: { w: 390, h: 844 }, elements: await captureElements() });
  } catch (e) {
    captures.push({ name: s.name, url, file, error: e.message });
  }
}

// Live morph: scroll dish into view, capture click-time rect, tap price → PDP frames
const morphFile = resolve(outDir, 'discover-to-pdp-morph.png');
try {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector(`[data-testid="dish-card-${seedId}-price"], [data-testid="evidence-dish-card"]`, { timeout: 20000 });
  const priceSel = `[data-testid="dish-card-${seedId}-price"]`;
  const imageSel = `[data-testid="dish-card-${seedId}-image"]`;
  await page.locator(priceSel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const discoverElements = await captureElements();
  const clickDishImage = await measure(imageSel);
  await page.click(priceSel);
  await page.waitForURL(`**/product/${seedId}**`, { timeout: 20000 });
  await page.waitForSelector(`[data-testid="shared-dish-${seedId}-hero"]`, { timeout: 20000 });
  const morphFrames = [];
  for (const delay of [0, 80, 160, 320]) {
    if (delay > 0) await page.waitForTimeout(80);
    const framePath = resolve(outDir, `morph-frame-${delay}ms.png`);
    await page.screenshot({ path: framePath, fullPage: false });
    morphFrames.push({
      delay,
      file: framePath,
      heroImage: await measure(`[data-testid="shared-dish-${seedId}-hero"]`),
    });
  }
  await page.screenshot({ path: morphFile, fullPage: false });
  const pdpElements = await captureElements();
  captures.push({
    name: 'discover-to-pdp-morph',
    url: `${base}/ → ${base}/product/${seedId}`,
    file: morphFile,
    viewport: { w: 390, h: 844 },
    elements: pdpElements,
    discoverElements,
    clickDishImage,
    morphFrames,
    morphFlow: true,
  });
} catch (e) {
  captures.push({ name: 'discover-to-pdp-morph', error: e.message, morphFlow: true });
}

await browser.close();
const bboxPath = resolve(outDir, 'playwright-bboxes.json');
await writeFile(bboxPath, JSON.stringify(captures, null, 2));
console.log(JSON.stringify(captures, null, 2));
console.log(`Wrote ${bboxPath}`);