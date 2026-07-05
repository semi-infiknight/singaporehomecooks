/**
 * Static guard — web orders page must not duplicate trayFns / opener wiring.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const webPage = readFileSync(resolve(root, 'apps/web/app/orders/[id]/page.tsx'), 'utf8');
const webSection = readFileSync(resolve(root, 'apps/web/lib/order-tray-section-web.tsx'), 'utf8');
const mobilePage = readFileSync(resolve(root, 'apps/mobile-customer/app/(customer)/orders/[id].tsx'), 'utf8');

describe('order tray parity guards', () => {
  it('web page uses OrderTrackingTraySectionWeb, not inline trayFns', () => {
    expect(webPage).toMatch(/OrderTrackingTraySectionWeb/);
    expect(webPage).not.toMatch(/const trayFns/);
    expect(webPage).not.toMatch(/openOrderReviewTray/);
    expect(webPage).not.toMatch(/orderTrayActions/);
    expect(webPage).not.toMatch(/open-review-tray-btn/);
  });

  it('web section uses useOrderTrayTracking + createOrderTrayFns', () => {
    expect(webSection).toMatch(/useOrderTrayTracking/);
    expect(webSection).toMatch(/createOrderTrayFns/);
    expect(webSection).toMatch(/SHCOrderReviewTrayContentWeb/);
  });

  it('mobile page uses OrderTrackingTraySection', () => {
    expect(mobilePage).toMatch(/OrderTrackingTraySection/);
    expect(mobilePage).not.toMatch(/const trayFns/);
    expect(mobilePage).not.toMatch(/openOrderReviewTray/);
  });
});