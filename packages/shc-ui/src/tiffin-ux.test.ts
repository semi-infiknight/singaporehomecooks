import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TIFFIN_UX = resolve(__dirname, 'tiffin-ux.tsx');
const CUSTOMER_BROWSE = resolve(__dirname, '../../../apps/mobile-customer/app/(customer)/tiffin/index.tsx');
const CUSTOMER_PLANNER = resolve(__dirname, '../../../apps/mobile-customer/app/(customer)/tiffin/planner.tsx');
const COOK_CONFIG = resolve(__dirname, '../../../apps/mobile-cook/app/(cook)/tiffin/index.tsx');
const CONFIRM = resolve(__dirname, '../../../apps/mobile-customer/app/(customer)/tiffin/confirm.tsx');

describe('tiffin subscription UX', () => {
  it('exports kitchen browse, meals picker, and weekly planner', () => {
    const src = readFileSync(TIFFIN_UX, 'utf8');
    expect(src).toContain('export function SHCTiffinKitchenCard');
    expect(src).toContain('export function SHCTiffinFilterChips');
    expect(src).toContain('export function SHCTiffinCategoryRow');
    expect(src).toContain('Explore tiffin plans');
    expect(src).toContain('export function SHCTiffinMealsPicker');
    expect(src).toContain('export function SHCTiffinPlannerScreen');
    expect(src).toContain('export function SHCTiffinManageCard');
    expect(src).toContain('export function SHCTiffinCookDishToggle');
    expect(src).toContain('export function SHCTiffinOrderSummary');
    expect(src).toContain('export function SHCTiffinOrderLineItem');
    expect(src).toContain('export function SHCTiffinMenuListItem');
    expect(src).toContain('export function SHCTiffinCalendarStrip');
    expect(src).toContain('export function SHCTiffinOrderStatusCard');
    expect(src).toContain('export function SHCTiffinPlanMetrics');
    expect(src).toContain('export function SHCTiffinEmptyState');
    expect(src).toContain("saveTestID = 'tiffin-save-plan-btn'");
  });

  it('customer screens wire Maestro testIDs', () => {
    const browse = readFileSync(CUSTOMER_BROWSE, 'utf8');
    const planner = readFileSync(CUSTOMER_PLANNER, 'utf8');
    expect(browse).toContain('testID="tiffin-browse-screen"');
    expect(browse).toContain('testID="tiffin-go-manage-btn"');
    expect(planner).toContain('testID="tiffin-planner-screen"');
    expect(planner).toContain('tiffin-save-next-week-btn');
  });

  it('confirm screen shows pick meals CTA after subscribe', () => {
    const src = readFileSync(CONFIRM, 'utf8');
    expect(src).toContain('testID="tiffin-confirm-screen"');
    expect(src).toContain('testID="tiffin-pick-meals-btn"');
    expect(src).toContain('SHCTiffinConfirmBanner');
  });

  it('cook config screen exposes enable switch and dish toggles', () => {
    const src = readFileSync(COOK_CONFIG, 'utf8');
    expect(src).toContain('testID="cook-tiffin-config-screen"');
    expect(src).toContain('testID="cook-tiffin-enabled-switch"');
    expect(src).toContain('testID="cook-tiffin-save-btn"');
    expect(src).toContain('SHCTiffinCookDishToggle');
  });
});