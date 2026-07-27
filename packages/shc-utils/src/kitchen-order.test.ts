import { describe, expect, it } from 'vitest';
import {
  buildCustomizeDraft,
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenCustomizeUnitPrice,
  kitchenCustomizeLineTotal,
  draftToOrderLine,
  upsertKitchenOrderLine,
  setKitchenOrderLineQty,
  kitchenOrderItemCount,
  kitchenOrderLinesTotal,
  formatKitchenOrderCta,
  filterKitchenMenuDishes,
  toggleAddonId,
  adjustMealQty,
  kitchenCustomizeAddButtonLabel,
  lineQtyForProduct,
} from './kitchen-order';

const DISH = {
  id: 'dish_nasi',
  name: 'Nasi Lemak',
  price: 12,
  cuisine: 'Malay',
  halal: true,
  calories: 450,
  rating: 4.9,
};

describe('kitchen meal customize flow', () => {
  it('builds draft with default extra and qty 1', () => {
    const draft = buildCustomizeDraft(DISH);
    expect(draft.productId).toBe('dish_nasi');
    expect(draft.basePrice).toBe(12);
    expect(draft.qty).toBe(1);
    expect(draft.extraId).toBeTruthy();
    expect(draft.addonIds).toEqual([]);
  });

  it('prices line with coconut rice + sambal add-on', () => {
    const extras = kitchenMealExtraOptions(DISH);
    const addons = kitchenMealAddonOptions(DISH);
    const draft = buildCustomizeDraft(DISH);
    draft.extraId = 'coconut-rice';
    draft.addonIds = ['sambal'];
    draft.qty = 2;
    const unit = kitchenCustomizeUnitPrice(draft, { extras, addons });
    // 12 + 2 + 1.5 = 15.5
    expect(unit).toBe(15.5);
    expect(kitchenCustomizeLineTotal(draft, { extras, addons })).toBe(31);
    expect(kitchenCustomizeAddButtonLabel(unit)).toContain('15.50');
  });

  it('upserts and counts kitchen order lines', () => {
    const extras = kitchenMealExtraOptions(DISH);
    const addons = kitchenMealAddonOptions(DISH);
    const draft = buildCustomizeDraft(DISH);
    draft.qty = 2;
    let lines = upsertKitchenOrderLine([], draftToOrderLine(draft, extras, addons));
    expect(kitchenOrderItemCount(lines)).toBe(2);
    expect(lineQtyForProduct(lines, 'dish_nasi')).toBe(2);
    lines = setKitchenOrderLineQty(lines, 'dish_nasi', 3);
    expect(kitchenOrderItemCount(lines)).toBe(3);
    const cta = formatKitchenOrderCta(lines);
    expect(cta.itemLabel).toBe('3 items added');
    expect(cta.totalLabel).toMatch(/^S\$/);
  });

  it('filters menu dishes by halal', () => {
    const list = [
      DISH,
      { id: 'x', name: 'Pork', price: 10, halal: false, rating: 5 },
    ];
    expect(filterKitchenMenuDishes(list, 'halal')).toHaveLength(1);
  });

  it('uses cook-provided meal extras when set', () => {
    const dish = {
      cuisine: 'Peranakan',
      meal_extras: [{ id: 'keluak', label: 'Extra keluak paste', price_delta: 4 }],
      meal_addons: [{ id: 'pickle', label: 'House pickle', price_delta: 2 }],
    };
    const extras = kitchenMealExtraOptions(dish);
    const addons = kitchenMealAddonOptions(dish);
    expect(extras[0].label).toBe('Extra keluak paste');
    expect(addons[0].label).toBe('House pickle');
  });

  it('toggles addons and clamps qty', () => {
    expect(toggleAddonId([], 'sambal')).toEqual(['sambal']);
    expect(toggleAddonId(['sambal'], 'sambal')).toEqual([]);
    expect(adjustMealQty(1, 1)).toBe(2);
    expect(adjustMealQty(1, -1)).toBe(1);
  });
});
