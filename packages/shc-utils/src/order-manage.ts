/**
 * Manage upcoming order flow (HomelyEats): skip · add items · timeslot · instructions · success.
 * SHC: collection (not door delivery).
 */

import type { DayOrderCardStatus } from './my-orders';
import {
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenCustomizeUnitPrice,
  type KitchenMealCustomizeDraft,
  type KitchenMealOption,
} from './kitchen-order';

export type ManageOrderView = {
  kind: 'one_off' | 'tiffin';
  id: string;
  cookName: string;
  planTitle: string;
  status: DayOrderCardStatus;
  collectionDate: string;
  timeslot: string;
  menuLines: string[];
  customizable: boolean;
  menuPending: boolean;
  instructions?: string;
};

/** Collection slot options for change-slot picker (HDB evenings / lunch). */
export function collectionSlotOptions(): Array<{ id: string; label: string }> {
  return [
    { id: '11:30-13:30', label: '11:30 am – 1:30 pm' },
    { id: '17:00-18:00', label: '5:00 pm – 6:00 pm' },
    { id: '18:00-19:00', label: '6:00 pm – 7:00 pm' },
    { id: '19:00-20:00', label: '7:00 pm – 8:00 pm' },
  ];
}

export function formatSlotLabel(slotId: string): string {
  const found = collectionSlotOptions().find((s) => s.id === slotId || s.label === slotId);
  if (found) return found.label;
  return String(slotId || 'Collection slot TBC').replace('-', ' – ');
}

export function canSkipManageOrder(status: DayOrderCardStatus): boolean {
  return status === 'scheduled' || status === 'indeterminate';
}

export function canAddItemsToOrder(status: DayOrderCardStatus, customizable: boolean): boolean {
  return customizable && (status === 'scheduled' || status === 'indeterminate');
}

export function manageOrderActionLabels(status: DayOrderCardStatus): {
  skip: string;
  addItems: string;
  help: string;
  changeSlot: string;
  instructions: string;
} {
  return {
    skip: 'Skip order',
    addItems: '+ Add items',
    help: 'Need help with this order?',
    changeSlot: 'Change collection timeslot',
    instructions: 'Add collection instructions',
  };
}

export type AddItemSuccess = {
  title: string;
  subtitle: string;
};

export function menuUpdatedSuccessCopy(addedLabel: string): AddItemSuccess {
  const display = formatMenuLineDisplay(addedLabel);
  return {
    title: 'Menu Updated!',
    subtitle: display.startsWith('+') ? display : `+${display.startsWith('1 ') ? display.slice(2) : display}`,
  };
}

export function addItemsProceedLabel(extraTotal: number): string {
  if (extraTotal <= 0) return 'Update menu';
  return `Proceed to pay S$${extraTotal.toFixed(2)}`;
}

export function computeAddItemsExtraTotal(
  draft: KitchenMealCustomizeDraft,
  extras: KitchenMealOption[],
  addons: KitchenMealOption[]
): number {
  // Only charge delta above base for extras/addons on an already-scheduled meal
  const full = kitchenCustomizeUnitPrice(draft, { extras, addons }) * draft.qty;
  const baseOnly = draft.basePrice * draft.qty;
  return Math.max(0, full - baseOnly);
}

/** Prefix so UI can show EXTRA ITEM badge (HomelyEats manage menu). */
export const EXTRA_MENU_LINE_PREFIX = 'extra:';

export function isExtraMenuLine(line: string): boolean {
  return String(line || '').startsWith(EXTRA_MENU_LINE_PREFIX);
}

/** Display label without internal prefix, e.g. "1 Ghee Tawa Roti". */
export function formatMenuLineDisplay(line: string): string {
  const raw = String(line || '');
  if (isExtraMenuLine(raw)) return raw.slice(EXTRA_MENU_LINE_PREFIX.length);
  return raw;
}

export function describeAddedExtras(
  draft: KitchenMealCustomizeDraft,
  extras: KitchenMealOption[],
  addons: KitchenMealOption[]
): string {
  const parts: string[] = [];
  const ex = extras.find((e) => e.id === draft.extraId && e.priceDelta > 0);
  if (ex) parts.push(ex.label);
  for (const id of draft.addonIds) {
    const a = addons.find((x) => x.id === id);
    if (a) parts.push(a.label);
  }
  if (!parts.length) return 'Menu preferences saved';
  // One primary extra line for success + menu (qty on first selected add)
  const label = parts[0];
  return `${EXTRA_MENU_LINE_PREFIX}${draft.qty} ${label}`;
}

/** All extra lines to append when multiple add-ons selected. */
export function describeAddedExtraLines(
  draft: KitchenMealCustomizeDraft,
  extras: KitchenMealOption[],
  addons: KitchenMealOption[]
): string[] {
  const lines: string[] = [];
  const ex = extras.find((e) => e.id === draft.extraId && e.priceDelta > 0);
  if (ex) lines.push(`${EXTRA_MENU_LINE_PREFIX}${draft.qty} ${ex.label}`);
  for (const id of draft.addonIds) {
    const a = addons.find((x) => x.id === id);
    if (a) lines.push(`${EXTRA_MENU_LINE_PREFIX}${draft.qty} ${a.label}`);
  }
  return lines;
}

export function kitchenExtrasForDish(dish: Record<string, unknown>): KitchenMealOption[] {
  return kitchenMealExtraOptions(dish);
}

export function kitchenAddonsForDish(dish: Record<string, unknown>): KitchenMealOption[] {
  return kitchenMealAddonOptions(dish);
}

export function buildManageViewFromDayCard(card: {
  id: string;
  kind: 'one_off' | 'tiffin';
  cookName: string;
  planTitle: string;
  status: DayOrderCardStatus;
  timeslot: string;
  collectionDate: string;
  menuLines: string[];
  customizable: boolean;
  menuPending: boolean;
}): ManageOrderView {
  return {
    kind: card.kind,
    id: card.id,
    cookName: card.cookName,
    planTitle: card.planTitle,
    status: card.status,
    collectionDate: card.collectionDate,
    timeslot: card.timeslot,
    menuLines: card.menuLines,
    customizable: card.customizable,
    menuPending: card.menuPending,
  };
}

export function mergeMenuLinesWithAdd(
  existing: string[],
  addedDescription: string | string[]
): string[] {
  const adds = Array.isArray(addedDescription) ? addedDescription : [addedDescription];
  const next = [...existing];
  for (const a of adds) {
    if (!a || a === 'Menu preferences saved') continue;
    next.push(a);
  }
  return next;
}

export function defaultAddItemDishFromMenu(menuLines: string[], cookName: string): Record<string, unknown> {
  const name = menuLines[0] || 'Daily meal';
  return {
    id: `addon_${name.slice(0, 12).replace(/\s+/g, '_')}`,
    name,
    price: 10,
    cuisine: 'Heritage',
    cook_name: cookName,
  };
}

/** Build query string for manage order route (web/mobile). */
export function buildManageOrderQuery(card: {
  id: string;
  kind: 'one_off' | 'tiffin';
  cookName: string;
  planTitle: string;
  status: DayOrderCardStatus;
  timeslot: string;
  collectionDate: string;
  menuLines: string[];
  customizable: boolean;
  menuPending: boolean;
  hrefOrderId?: string;
}): string {
  const params = new URLSearchParams({
    kind: card.kind,
    id: card.hrefOrderId || card.id,
    cook: card.cookName,
    title: card.planTitle,
    status: card.status,
    date: card.collectionDate,
    slot: card.timeslot,
    menu: card.menuLines.join('|'),
    customizable: card.customizable ? '1' : '0',
    menuPending: card.menuPending ? '1' : '0',
  });
  return params.toString();
}
