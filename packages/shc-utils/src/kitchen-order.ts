/**
 * Kitchen order flow (HomelyEats): customize meal → qty → cart / subscription CTA.
 * Pure helpers — extras & add-ons are SHC-adapted (heritage sides, HDB collection).
 */
import { kitchenDishPriceDollars } from './kitchen';

export type KitchenMealOption = {
  id: string;
  label: string;
  /** Extra SGD dollars on top of base portion price */
  priceDelta: number;
};

export type KitchenMealCustomizeDraft = {
  productId: string;
  productName: string;
  basePrice: number;
  qty: number;
  extraId?: string | null;
  addonIds: string[];
};

export type KitchenOrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  extraLabel?: string;
  addonLabels?: string[];
};

export function kitchenMealMetaChips(dish: Record<string, unknown>): Array<{ id: string; label: string }> {
  const chips: Array<{ id: string; label: string }> = [];
  const cal = Number(dish.calories);
  if (Number.isFinite(cal) && cal > 0) chips.push({ id: 'cal', label: `≈${cal} cal` });
  const cuisine = dish.cuisine ? String(dish.cuisine) : '';
  if (cuisine) chips.push({ id: 'cuisine', label: cuisine });
  if (dish.halal) chips.push({ id: 'halal', label: 'Halal' });
  chips.push({ id: 'fresh', label: 'Home-cooked' });
  return chips.slice(0, 4);
}

export function kitchenMealExtraOptions(dish: Record<string, unknown>): KitchenMealOption[] {
  const cuisine = String(dish.cuisine || '').toLowerCase();
  if (cuisine.includes('indian') || cuisine.includes('malay')) {
    return [
      { id: 'plain-rice', label: 'Plain rice', priceDelta: 0 },
      { id: 'coconut-rice', label: 'Coconut rice', priceDelta: 2 },
    ];
  }
  if (cuisine.includes('chinese') || cuisine.includes('peranakan')) {
    return [
      { id: 'white-rice', label: 'Steamed rice', priceDelta: 0 },
      { id: 'no-rice', label: 'No rice (dish only)', priceDelta: 0 },
    ];
  }
  return [
    { id: 'standard', label: 'Standard portion', priceDelta: 0 },
    { id: 'large', label: 'Family portion', priceDelta: 8 },
  ];
}

export function kitchenMealAddonOptions(dish: Record<string, unknown>): KitchenMealOption[] {
  const base: KitchenMealOption[] = [
    { id: 'sambal', label: 'Extra sambal', priceDelta: 1.5 },
    { id: 'acar', label: 'Acar / pickle', priceDelta: 2 },
    { id: 'egg', label: 'Fried egg', priceDelta: 1.5 },
  ];
  if (dish.halal) {
    return base.filter((o) => o.id !== 'egg').concat([{ id: 'tempeh', label: 'Tempeh side', priceDelta: 2 }]);
  }
  return base;
}

export function kitchenCustomizeLineTotal(
  draft: KitchenMealCustomizeDraft,
  opts: { extras: KitchenMealOption[]; addons: KitchenMealOption[] }
): number {
  const extra = opts.extras.find((e) => e.id === draft.extraId);
  const addonSum = draft.addonIds.reduce((sum, id) => {
    const a = opts.addons.find((x) => x.id === id);
    return sum + (a?.priceDelta || 0);
  }, 0);
  const unit = draft.basePrice + (extra?.priceDelta || 0) + addonSum;
  return unit * Math.max(1, draft.qty);
}

export function kitchenCustomizeUnitPrice(
  draft: KitchenMealCustomizeDraft,
  opts: { extras: KitchenMealOption[]; addons: KitchenMealOption[] }
): number {
  const qty = Math.max(1, draft.qty);
  return kitchenCustomizeLineTotal(draft, opts) / qty;
}

export function kitchenOrderLinesTotal(lines: KitchenOrderLine[]): number {
  return lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
}

export function kitchenOrderItemCount(lines: KitchenOrderLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0);
}

export function upsertKitchenOrderLine(lines: KitchenOrderLine[], next: KitchenOrderLine): KitchenOrderLine[] {
  if (next.qty <= 0) return lines.filter((l) => l.productId !== next.productId);
  const i = lines.findIndex((l) => l.productId === next.productId);
  if (i < 0) return [...lines, next];
  const copy = [...lines];
  copy[i] = next;
  return copy;
}

export function setKitchenOrderLineQty(lines: KitchenOrderLine[], productId: string, qty: number): KitchenOrderLine[] {
  return lines.map((l) => (l.productId === productId ? { ...l, qty } : l)).filter((l) => l.qty > 0);
}

export function dishBasePriceDollars(dish: Record<string, unknown>): number {
  return kitchenDishPriceDollars(dish) ?? 12;
}

export function buildCustomizeDraft(dish: Record<string, unknown>): KitchenMealCustomizeDraft {
  const extras = kitchenMealExtraOptions(dish);
  return {
    productId: String(dish.id),
    productName: String(dish.name || 'Dish'),
    basePrice: dishBasePriceDollars(dish),
    qty: 1,
    extraId: extras[0]?.id ?? null,
    addonIds: [],
  };
}

export function draftToOrderLine(
  draft: KitchenMealCustomizeDraft,
  extras: KitchenMealOption[],
  addons: KitchenMealOption[]
): KitchenOrderLine {
  const unitPrice = kitchenCustomizeUnitPrice(draft, { extras, addons });
  const extra = extras.find((e) => e.id === draft.extraId);
  return {
    productId: draft.productId,
    name: draft.productName,
    qty: draft.qty,
    unitPrice,
    extraLabel: extra?.label,
    addonLabels: draft.addonIds
      .map((id) => addons.find((a) => a.id === id)?.label)
      .filter(Boolean) as string[],
  };
}

export function kitchenMenuFilterChips(): Array<{ id: string; label: string }> {
  return [
    { id: 'all', label: 'All' },
    { id: 'popular', label: 'Popular' },
    { id: 'halal', label: 'Halal' },
  ];
}

export function filterKitchenMenuDishes(
  dishes: Record<string, unknown>[],
  filterId: string
): Record<string, unknown>[] {
  if (filterId === 'halal') return dishes.filter((d) => Boolean(d.halal));
  if (filterId === 'popular') {
    return [...dishes].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }
  return dishes;
}

export function formatKitchenOrderCta(lines: KitchenOrderLine[]): {
  itemLabel: string;
  totalLabel: string;
  ctaLabel: string;
} {
  const n = kitchenOrderItemCount(lines);
  const total = kitchenOrderLinesTotal(lines);
  return {
    itemLabel: n === 1 ? '1 item added' : `${n} items added`,
    totalLabel: `S$${total.toFixed(2)}`,
    ctaLabel: 'View cart & checkout',
  };
}

export function formatKitchenSubscribeCta(): string {
  return 'Create tiffin subscription';
}

export function kitchenCustomizeAddButtonLabel(unitPrice: number): string {
  return `Add item S$${unitPrice.toFixed(2)}/portion`;
}

export function kitchenMealSectionDeliveryHint(sectionTitle: string): string {
  const t = sectionTitle.toLowerCase();
  if (t.includes('lunch') || t.includes('family')) return 'Collect 11:30 am – 1:30 pm (weekend)';
  if (t.includes('dinner') || t.includes('raya') || t.includes('cny')) return 'Collect 5:00 pm – 8:00 pm';
  return 'HDB collection · book ahead for best slots';
}

export function toggleAddonId(addonIds: string[], id: string): string[] {
  return addonIds.includes(id) ? addonIds.filter((x) => x !== id) : [...addonIds, id];
}

export function clampMealQty(qty: number, min = 1, max = 20): number {
  if (!Number.isFinite(qty)) return min;
  return Math.min(max, Math.max(min, Math.floor(qty)));
}

export function adjustMealQty(qty: number, delta: number): number {
  return clampMealQty(qty + delta);
}

export function lineQtyForProduct(lines: KitchenOrderLine[], productId: string): number {
  return lines.find((l) => l.productId === productId)?.qty ?? 0;
}
