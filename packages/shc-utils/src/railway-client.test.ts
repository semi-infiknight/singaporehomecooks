import { describe, expect, it } from 'vitest';
import {
  RAILWAY_MEDUSA_BASE,
  assertRailwayMedusaBase,
  resolveRailwayMedusaBase,
  resolveRailwayPublishableKey,
} from './railway-client';

describe('railway-client', () => {
  it('defaults to Railway when env unset', () => {
    expect(resolveRailwayMedusaBase()).toBe(RAILWAY_MEDUSA_BASE);
  });

  it('rejects localhost', () => {
    expect(() => resolveRailwayMedusaBase('http://localhost:9000')).toThrow(/Local Medusa/);
    expect(() => assertRailwayMedusaBase('http://127.0.0.1:9000')).toThrow(/Local Medusa/);
  });

  it('accepts explicit Railway URL', () => {
    expect(resolveRailwayMedusaBase('https://medusa-production-d2ba.up.railway.app/')).toBe(
      RAILWAY_MEDUSA_BASE
    );
  });

  it('defaults publishable key', () => {
    expect(resolveRailwayPublishableKey()).toMatch(/^pk_/);
  });
});