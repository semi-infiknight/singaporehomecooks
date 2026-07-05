import { describe, expect, it } from 'vitest';
import { pushTray, popTray, dismissTray } from './family-values-core';

/** Tray frame ids used by checkout allergen gate — must match SHCTrayOverlay testID suffix. */
describe('family values tray frame ids', () => {
  it('allergen-gate frame stacks and yields shc-tray-allergen-gate testID', () => {
    const frame = { id: 'allergen-gate', title: 'Allergen acknowledgment', height: 'medium' as const };
    let stack = pushTray([], frame);
    expect(stack).toHaveLength(1);
    expect(stack[0]?.id).toBe('allergen-gate');
    expect(`shc-tray-${stack[0]?.id}`).toBe('shc-tray-allergen-gate');

    stack = popTray(stack);
    expect(stack).toHaveLength(0);

    stack = pushTray([], frame);
    stack = dismissTray(stack);
    expect(stack).toHaveLength(0);
  });

  it('listing tray frames match Maestro selectors', () => {
    const actions = { id: 'listing-actions', title: 'Listing actions', height: 'medium' as const };
    const confirm = { id: 'listing-delete-confirm', title: 'Delete?', height: 'medium' as const };
    let stack = pushTray([], actions);
    stack = pushTray(stack, confirm);
    expect(stack.map((f) => f.id)).toEqual(['listing-actions', 'listing-delete-confirm']);
    expect(`shc-tray-${confirm.id}`).toBe('shc-tray-listing-delete-confirm');
  });
});