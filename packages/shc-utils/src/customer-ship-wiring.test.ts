/**
 * Structural + pure-logic guards for pre–App Store customer paths.
 * These assert shipped helpers/strings stay aligned with guest-first + no dead surfaces.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  appendGuestOrderId,
  parseGuestOrdersJson,
  maxCalFilterLabel,
  snapMaxCalSliderValue,
  DISCOVER_MAX_CAL_SLIDER,
  occasionBrowseRoute,
} from './index';

const REPO = join(__dirname, '../../..');

function readApp(rel: string): string {
  return readFileSync(join(REPO, rel), 'utf8');
}

describe('customer ship wiring (pre-store)', () => {
  it('Orders tab is not blocked by sign-in copy on mobile tab bar', () => {
    const tabBar = readApp('apps/mobile-customer/components/CustomerTabBar.tsx');
    expect(tabBar).not.toMatch(/Sign in to view orders/i);
    // Orders must navigate; only profile may open guest auth tray
    expect(tabBar).toMatch(/orders\/index/);
    expect(tabBar).toMatch(/profile\/index/);
    // orders path must not return early before navigate for guests
    const ordersGate = tabBar.includes("key === 'orders/index'") && tabBar.includes('showGuestAuthTray');
    // If both appear, ensure orders is not the gated branch
    if (ordersGate) {
      expect(tabBar).toMatch(/Orders are guest-friendly/);
    }
  });

  it('mobile + web getCustomerOrders hydrates guest order ids when unauthenticated', () => {
    const mobile = readApp('apps/mobile-customer/lib/api-client.ts');
    const web = readApp('apps/web/lib/api-client.ts');
    for (const src of [mobile, web]) {
      expect(src).toMatch(/export async function getCustomerOrders/);
      expect(src).toMatch(/listGuestOrderIds/);
      expect(src).toMatch(/getOrder/);
      expect(src).toMatch(/isAuthenticated\(\)/);
    }
  });

  it('guest order id helpers support checkout → Orders list chain', () => {
    const stored = parseGuestOrdersJson(JSON.stringify(['order_a']));
    const next = appendGuestOrderId(stored, 'order_b');
    expect(next).toEqual(['order_b', 'order_a']);
    expect(snapMaxCalSliderValue(447)).toBe(450);
    expect(maxCalFilterLabel(450)).toBe('Under 450 cal');
    expect(DISCOVER_MAX_CAL_SLIDER.min).toBeLessThan(DISCOVER_MAX_CAL_SLIDER.max);
  });

  it('occasion browse deep links no longer open a catalogue page', () => {
    expect(occasionBrowseRoute('Hari Raya').web).toBe('/request');
    expect(occasionBrowseRoute('Hari Raya').mobile).toBe('/(customer)/request');
    expect(existsSync(join(REPO, 'apps/mobile-customer/app/(customer)/occasions.tsx'))).toBe(false);
  });

  it('calorie filter sheet surfaces a live value test id path on web', () => {
    const web = readApp('apps/web/app/components/SHCWebComponents.tsx');
    expect(web).toMatch(/cal-slider-value/);
    expect(web).toMatch(/maxCalFilterLabel/);
  });

  it('mobile filter sheet shows live max calories label', () => {
    const ui = readApp('packages/shc-ui/src/gourmeat.tsx');
    expect(ui).toMatch(/maxCalFilterLabel\(live\)/);
    expect(ui).toMatch(/Max calories/);
    // Guard: no measureInWindow in gourmeat (CI family-values-press-forbidden)
    expect(ui).not.toMatch(/\.measureInWindow\s*\(/);
  });
});
