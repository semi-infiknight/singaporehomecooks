import { describe, expect, it } from 'vitest';
import { cookPortalGreeting } from './cook-portal';

describe('cookPortalGreeting', () => {
  it('returns morning before noon', () => {
    expect(cookPortalGreeting(new Date('2026-07-26T08:30:00'))).toBe('Good morning, Chef');
  });

  it('returns afternoon before 5pm', () => {
    expect(cookPortalGreeting(new Date('2026-07-26T14:00:00'))).toBe('Good afternoon, Chef');
  });

  it('returns evening after 5pm', () => {
    expect(cookPortalGreeting(new Date('2026-07-26T19:00:00'))).toBe('Good evening, Chef');
  });
});
