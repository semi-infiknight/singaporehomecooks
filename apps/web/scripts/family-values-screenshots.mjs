#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve(process.argv[2] || 'screenshots');
const base = process.argv[3] || 'http://localhost:3001';

const shots = [
  { name: 'fv-fixture', path: '/dev/family-values-fixture', waitFor: '[data-testid="fv-fixture-page"]' },
  { name: 'discover-home', path: '/', waitFor: '[data-testid="discover-home"], body' },
  { name: 'product-pdp', path: '/product/dish-1', waitFor: 'body' },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const captures = [];
for (const s of shots) {
  const url = `${base}${s.path}`;
  const file = resolve(outDir, `${s.name}.png`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (s.waitFor) {
      try {
        await page.waitForSelector(s.waitFor.split(',')[0].trim(), { timeout: 15000 });
      } catch {
        /* fixture may still render partial UI */
      }
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: file, fullPage: false });
    const measure = async (sel) => {
      const el = page.locator(sel).first();
      if ((await el.count()) === 0) return null;
      const box = await el.boundingBox();
      if (!box) return null;
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        w: Math.round(box.width),
        h: Math.round(box.height),
      };
    };
    captures.push({
      name: s.name,
      url,
      file,
      viewport: { w: 390, h: 844 },
      elements: {
        dishCard: await measure('[data-testid^="dish-card-"]'),
        dishImage: await measure('[data-testid$="-image"]'),
        heroImage: await measure('[data-testid^="shared-dish-"], [data-testid*="shared-dish"][data-testid$="-hero"]'),
        wizardMorph: await measure('[data-testid$="-morph"]'),
        trayWeb: await measure('[data-testid="shc-tray-web"]'),
      },
    });
  } catch (e) {
    captures.push({ name: s.name, url, file, error: e.message });
  }
}

await browser.close();
const bboxPath = resolve(outDir, 'playwright-bboxes.json');
await import('node:fs/promises').then((fs) => fs.writeFile(bboxPath, JSON.stringify(captures, null, 2)));
console.log(JSON.stringify(captures, null, 2));
console.log(`Wrote ${bboxPath}`);