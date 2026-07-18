import { describe, expect, it } from 'vitest';
import { resolveAuthSessionState } from './auth-session';

describe('auth-session', () => {
  it('returns loading before guest or authenticated', () => {
    expect(resolveAuthSessionState(true, null)).toBe('loading');
    expect(resolveAuthSessionState(true, { id: '1' })).toBe('loading');
    expect(resolveAuthSessionState(false, null)).toBe('guest');
    expect(resolveAuthSessionState(false, { id: '1' })).toBe('authenticated');
  });
});
