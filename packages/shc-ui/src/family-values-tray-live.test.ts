import { describe, expect, it } from 'vitest';
import { pushTray, popTray } from './family-values-core';

/** Tray contentMap must store render fns — stale ReactNode snapshots freeze controlled inputs. */
describe('tray live render contract', () => {
  it('render fn re-reads state on each invoke (not snapshot at open)', () => {
    let notes = '';
    const render = () => ({ value: notes, onChange: (v: string) => { notes = v; } });
    const first = render();
    first.onChange('typed text');
    const second = render();
    expect(first.value).toBe('');
    expect(second.value).toBe('typed text');
  });

  it('order tray frame ids remain stable for Maestro', () => {
    const review = { id: 'order-review', title: 'Leave a review', height: 'medium' as const };
    expect(`shc-tray-${pushTray([], review)[0]?.id}`).toBe('shc-tray-order-review');
    popTray(pushTray([], review));
  });
});