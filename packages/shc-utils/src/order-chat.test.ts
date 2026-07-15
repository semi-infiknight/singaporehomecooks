import { describe, expect, it } from 'vitest';
import { buildChatThreadItems, isOutgoingChatMessage, orderChatRef } from './order-chat';

describe('order-chat helpers', () => {
  it('orderChatRef shortens long ids', () => {
    expect(orderChatRef('order_abcdefghijklmnop')).toMatch(/^#/);
  });

  it('buildChatThreadItems inserts date separators', () => {
    const items = buildChatThreadItems([
      { id: '1', sender_actor: 'cook', body: 'Hi', created_at: '2026-07-15T10:00:00.000Z' },
      { id: '2', sender_actor: 'customer', body: 'Thanks', created_at: '2026-07-15T10:05:00.000Z' },
    ]);
    expect(items.some((i) => i.kind === 'date')).toBe(true);
    expect(items.filter((i) => i.kind === 'message')).toHaveLength(2);
  });

  it('isOutgoingChatMessage respects viewer role', () => {
    expect(isOutgoingChatMessage('customer', 'customer')).toBe(true);
    expect(isOutgoingChatMessage('customer', 'cook')).toBe(false);
    expect(isOutgoingChatMessage('cook', 'cook')).toBe(true);
  });
});
