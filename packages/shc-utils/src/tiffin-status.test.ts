import { describe, expect, it } from 'vitest';
import { tiffinMealStatusChip } from './tiffin-status';

describe('tiffin-status', () => {
  it('maps delivered status', () => {
    expect(tiffinMealStatusChip('delivered').text).toBe('Delivered');
  });

  it('defaults unknown to scheduled styling', () => {
    expect(tiffinMealStatusChip('scheduled').text).toBe('Scheduled');
  });
});
