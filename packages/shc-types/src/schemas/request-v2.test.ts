import { describe, expect, it } from 'vitest';
import { shcRequestSchema } from './request';

describe('shcRequestSchema multi-dish v2 fields', () => {
  it('accepts guest_count and items_json on partial create payload', () => {
    const items_json = JSON.stringify([
      { id: 'line_0', name: 'Laksa', servings: 8 },
      { id: 'line_1', name: 'Kueh', servings: 4 },
    ]);
    const parsed = shcRequestSchema.partial().parse({
      customer_id: 'cus_1',
      body: 'Hari Raya: Laksa · Kueh for open house',
      guest_count: 8,
      items_json,
      status: 'open',
    });
    expect(parsed.guest_count).toBe(8);
    expect(parsed.items_json).toContain('Laksa');
    expect(parsed.body?.length).toBeGreaterThanOrEqual(10);
  });

  it('strips unknown keys instead of throwing (deploy lag / client extras)', () => {
    const parsed = shcRequestSchema.partial().parse({
      body: 'Need a festive spread for twelve guests please',
      customer_id: 'cus_1',
      guest_count: 12,
      items_json: '[]',
      items: [{ name: 'should-strip' }],
      corporate: true,
    } as any);
    expect(parsed.guest_count).toBe(12);
    expect((parsed as any).items).toBeUndefined();
    expect((parsed as any).corporate).toBeUndefined();
  });
});
