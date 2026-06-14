import { describe, it, expect } from 'vitest';
import { SHCErrorCode, SHCErrorCodes, formatError, createSHCError } from './errors';

describe('SHC Error Codes (TDD - production contract)', () => {
  it('should export all required error codes from blueprint', () => {
    expect(SHCErrorCodes['SHC-AUTH-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-ORDER-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-ORDER-002']).toBeDefined();
    expect(SHCErrorCodes['SHC-CART-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-PAY-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-COMPLIANCE-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-AVAIL-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-DISPUTE-001']).toBeDefined();
    // expanded full set
    expect(SHCErrorCodes['SHC-CART-002']).toBeDefined();
    expect(SHCErrorCodes['SHC-COOK-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-PORTIONS-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-COMMISSION-001']).toBeDefined();
  });

  it('formatError should return structured error with code and message', () => {
    const err = formatError('SHC-ORDER-001', 'Invalid state transition');
    expect(err).toEqual({
      error: {
        code: 'SHC-ORDER-001',
        message: 'Invalid state transition',
        details: undefined,
      },
    });
  });

  it('formatError falls back to description from SHCErrorCodes map', () => {
    const err = formatError('SHC-CART-001');
    expect(err.error.message).toBe(SHCErrorCodes['SHC-CART-001']);
  });

  it('createSHCError produces valid SHCError shape', () => {
    const err = createSHCError('SHC-AVAIL-002', 'Portions exceeded');
    expect(err.code).toBe('SHC-AVAIL-002');
    expect(err.message).toBe('Portions exceeded');
  });

  it('should not allow unknown codes in production', () => {
    expect(() => formatError('SHC-UNKNOWN-999' as any, 'foo')).toThrow();
  });

  it('SHCErrorCode schema validates only known codes', () => {
    expect(SHCErrorCode.parse('SHC-LEDGER-001')).toBe('SHC-LEDGER-001');
    expect(() => SHCErrorCode.parse('SHC-FOO-999')).toThrow();
  });
});
