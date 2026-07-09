import { describe, expect, it } from 'vitest';
import {
  canSkipManageOrder,
  canAddItemsToOrder,
  collectionSlotOptions,
  formatSlotLabel,
  manageOrderActionLabels,
  menuUpdatedSuccessCopy,
  computeAddItemsExtraTotal,
  describeAddedExtras,
  mergeMenuLinesWithAdd,
  buildManageViewFromDayCard,
  addItemsProceedLabel,
  buildManageOrderQuery,
} from './order-manage';
import { buildCustomizeDraft, kitchenMealExtraOptions, kitchenMealAddonOptions } from './kitchen-order';

describe('order manage flow helpers', () => {
  it('allows skip/add only for scheduled customizable orders', () => {
    expect(canSkipManageOrder('scheduled')).toBe(true);
    expect(canSkipManageOrder('delivered')).toBe(false);
    expect(canAddItemsToOrder('scheduled', true)).toBe(true);
    expect(canAddItemsToOrder('scheduled', false)).toBe(false);
    expect(canAddItemsToOrder('skipped', true)).toBe(false);
  });

  it('exposes collection slot options and labels', () => {
    const slots = collectionSlotOptions();
    expect(slots.length).toBeGreaterThanOrEqual(3);
    expect(formatSlotLabel('18:00-19:00')).toMatch(/6:00|18/);
  });

  it('prices extras/addons as pay-on-spot delta', () => {
    const dish = { id: 'd1', name: 'Nasi Lemak', price: 12, cuisine: 'Malay', halal: true };
    const draft = buildCustomizeDraft(dish);
    draft.extraId = 'coconut-rice';
    draft.addonIds = ['sambal'];
    draft.qty = 1;
    const extras = kitchenMealExtraOptions(dish);
    const addons = kitchenMealAddonOptions(dish);
    const extra = computeAddItemsExtraTotal(draft, extras, addons);
    expect(extra).toBe(3.5); // 2 + 1.5
    expect(addItemsProceedLabel(extra)).toContain('3.50');
    expect(describeAddedExtras(draft, extras, addons)).toMatch(/Coconut|sambal/i);
  });

  it('builds success copy and merges menu lines', () => {
    const ok = menuUpdatedSuccessCopy('+1 Ghee Tawa Roti');
    expect(ok.title).toBe('Menu Updated!');
    expect(ok.subtitle).toContain('Ghee');
    expect(mergeMenuLinesWithAdd(['3 roti'], '+1 pickle')).toEqual(['3 roti', '+1 pickle']);
  });

  it('maps day card to manage view and query string', () => {
    const card = {
      id: 'ord_1',
      kind: 'one_off' as const,
      cookName: 'Auntie Rose',
      planTitle: 'Nasi Lemak',
      status: 'scheduled' as const,
      timeslot: '6–7 pm',
      collectionDate: '2026-07-10',
      menuLines: ['Nasi Lemak'],
      customizable: true,
      menuPending: false,
      hrefOrderId: 'ord_1',
    };
    const v = buildManageViewFromDayCard(card);
    expect(v.cookName).toBe('Auntie Rose');
    expect(manageOrderActionLabels(v.status).skip).toBe('Skip order');
    const q = buildManageOrderQuery(card);
    expect(q).toContain('kind=one_off');
    expect(q).toContain('cook=Auntie');
    expect(q).toContain('customizable=1');
  });
});
