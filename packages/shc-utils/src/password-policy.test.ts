import { describe, expect, it, afterEach } from 'vitest';
import { assertProductionEmailAllowed, validateShcPassword } from './password-policy';

describe('validateShcPassword', () => {
  it('allows short passwords in non-strict mode', () => {
    expect(validateShcPassword('abc123', { strict: false }).ok).toBe(true);
  });

  it('requires 8+ chars with letter and number in strict mode', () => {
    expect(validateShcPassword('short1', { strict: true }).ok).toBe(false);
    expect(validateShcPassword('longenough', { strict: true }).ok).toBe(false);
    expect(validateShcPassword('GoodPass1', { strict: true }).ok).toBe(true);
  });

  it('rejects known weak passwords in strict mode', () => {
    expect(validateShcPassword('customersecret', { strict: true }).ok).toBe(false);
  });
});

describe('assertProductionEmailAllowed', () => {
  const prev = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prev;
    delete process.env.SHC_ALLOW_DEMO_EMAILS;
  });

  it('blocks @shc.local in production', () => {
    process.env.NODE_ENV = 'production';
    expect(assertProductionEmailAllowed('rose@shc.local').ok).toBe(false);
    expect(assertProductionEmailAllowed('real.user@gmail.com').ok).toBe(true);
  });
});
