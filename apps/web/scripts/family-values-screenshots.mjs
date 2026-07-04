#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve(process.argv[2] || 'screenshots');
const base = process.argv[3] || 'http://localhost:3001';

const shots = [
  { name: 'discover-home', path: '/' },
  { name: 'product-pdp', path: '/product/dish-1' },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const log = [];
for (const s of shots) {
  const url = `${base}${s.path}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const file = resolve(outDir, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const card = page.locator('[data-testid^="dish-card-"]').first();
    const box = (await card.count()) > 0 ? await card.boundingBox() : null;
    const trayHeader = page.locator('[data-testid="shc-tray-web"]').first();
    log.push(
      `${s.name}: saved ${file} | cardBox=${box ? `${Math.round(box.width)}x${Math.round(box.height)}@${Math.round(box.x)},${Math.round(box.y)}` : 'n/a'}`
    );
  } catch (e) {
    log.push(`${s.name}: FAIL ${e.message}`);
  }
}

await browser.close();
console.log(log.join('\n'));