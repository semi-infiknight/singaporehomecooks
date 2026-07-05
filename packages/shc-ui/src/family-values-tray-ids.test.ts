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

  it('order action tray frames match customer/cook selectors', () => {
    const review = { id: 'order-review', title: 'Leave a review', height: 'medium' as const };
    const dispute = { id: 'order-dispute', title: 'Report an issue', height: 'medium' as const };
    const status = { id: 'order-status-confirm', title: 'Accept', height: 'compact' as const };
    expect(`shc-tray-${review.id}`).toBe('shc-tray-order-review');
    expect(`shc-tray-${dispute.id}`).toBe('shc-tray-order-dispute');
    expect(`shc-tray-${status.id}`).toBe('shc-tray-order-status-confirm');
    let stack = pushTray([], review);
    stack = pushTray(stack, dispute);
    expect(stack.map((f) => f.id)).toEqual(['order-review', 'order-dispute']);
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