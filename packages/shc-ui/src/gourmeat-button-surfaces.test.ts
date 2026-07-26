import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GOURMEAT_SRC = resolve(__dirname, 'gourmeat.tsx');
const CART_SRC = resolve(__dirname, '../../../apps/mobile-customer/app/(customer)/cart.tsx');
const THEME_SRC = resolve(__dirname, 'theme.ts');

function extractFunctionBlock(src: string, fnName: string, nextFnName?: string): string {
  const start = src.indexOf(`export function ${fnName}`);
  expect(start).toBeGreaterThan(-1);
  const end = nextFnName
    ? src.indexOf(`export function ${nextFnName}`, start + 1)
    : src.length;
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

/** Gourmeat CTAs must paint fill on an inner View (NativeWind-safe), not Pressable alone. */
function expectInnerViewBackground(block: string, fnName: string) {
  expect(block).toMatch(/<Pressable[\s\S]*?\{\(\{ pressed \}\) => \(/);
  expect(block).toMatch(/<View[\s\S]*?backgroundColor:/);
  const pressableStyleBg = block.match(/<Pressable[^>]*style=\{\(\{ pressed \}\) => \(\{[\s\S]*?backgroundColor:/);
  expect(pressableStyleBg, `${fnName} must not set backgroundColor on Pressable style callback`).toBeNull();
}

describe('Gourmeat button surfaces (mobile-customer)', () => {
  const gourmeat = readFileSync(GOURMEAT_SRC, 'utf8');

  it('GourmeatAddButton uses inner View backgroundColor', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatAddButton', 'GourmeatDishCard');
    expectInnerViewBackground(block, 'GourmeatAddButton');
    expect(block).toContain('gourmeatColors.primary');
  });

  it('GourmeatStickyCartBar uses inner View with border and shadow', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatStickyCartBar', 'GourmeatPayButton');
    expectInnerViewBackground(block, 'GourmeatStickyCartBar');
    expect(block).toContain('borderWidth: 0');
    expect(block).toContain('gourmeatShadows.nav');
  });

  it('GourmeatPayButton uses inner View with pay fill', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatPayButton', 'GourmeatOrderSummaryCard');
    expectInnerViewBackground(block, 'GourmeatPayButton');
    expect(block).toContain('gourmeatColors.pay');
  });

  it('GourmeatPrimaryButton uses inner View backgroundColor', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatPrimaryButton', 'GourmeatProductStickyBar');
    expectInnerViewBackground(block, 'GourmeatPrimaryButton');
  });

  it('GourmeatPrimaryButton size sm is compact 36px (order action chips)', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatPrimaryButton', 'GourmeatProductStickyBar');
    expect(block).toContain("size = 'md'");
    expect(block).toMatch(/minHeight:\s*isSm\s*\?\s*36\s*:\s*48/);
    expect(block).toMatch(/height:\s*isSm\s*\?\s*36/);
    expect(block).toContain("size === 'sm'");
  });

  it('GourmeatActionRow is a horizontal equal-height strip', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatActionRow', 'GourmeatProductStickyBar');
    expect(block).toContain("flexDirection: 'row'");
    expect(block).toContain("alignItems: 'center'");
  });

  it('GourmeatProductStickyBar add control uses inner View backgroundColor', () => {
    const block = extractFunctionBlock(gourmeat, 'GourmeatProductStickyBar', 'GourmeatCookHeader');
    const addStart = block.lastIndexOf('<Pressable');
    expect(addStart).toBeGreaterThan(-1);
    const addBlock = block.slice(addStart);
    expectInnerViewBackground(addBlock, 'GourmeatProductStickyBar add');
    expect(addBlock).toContain('testID="add-to-cart-btn"');
    expect(addBlock).toContain('gourmeatColors.primary');
  });
});

describe('gourmeatLayout tab bar clearance', () => {
  it('exports tabBarClearance for customer bottom insets', () => {
    const theme = readFileSync(THEME_SRC, 'utf8');
    expect(theme).toContain('export const gourmeatLayout');
    expect(theme).toMatch(/tabBarClearance:\s*\d+/);
  });
});

describe('cart checkout footer', () => {
  it('positions proceed-checkout above floating tab bar', () => {
    const cart = readFileSync(CART_SRC, 'utf8');
    expect(cart).toContain('testID="proceed-checkout"');
    expect(cart).toContain('contentPadForTabBar');
    expect(cart).toContain('styles.footer');
    expect(cart).toMatch(/position:\s*'absolute'/);
    expect(cart).toContain('GourmeatPayButton');
  });
});