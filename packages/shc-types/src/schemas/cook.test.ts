import { describe, it, expect } from 'vitest';
import { shcCookSchema, CookStatus } from './cook';

function validBase() {
  return {
    id: 'c1',
    auth_identity_id: 'a1',
    slug: 'test-cook',
    display_name: 'Test',
    story: 'Test story for Singapore home cook.',
    area: 'Jurong',
    collection_address: '1 Test St',
    collection_instructions: 'Ring bell',
    status: 'pending' as const,
    availability_paused: false,
    created_at: '2026-06-13T00:00:00Z',
  };
}

describe('shc-cook schema (TDD from 05-data-model + 07-auth)', () => {
  it('validates active cook with Singapore details', () => {
    const valid = {
      id: 'cook_123',
      auth_identity_id: 'auth_456',
      slug: 'auntie-lee-kitchen',
      display_name: 'Auntie Lee',
      story: 'Heritage Peranakan recipes from my grandmother.',
      area: 'Tiong Bahru',
      collection_address: '123 Tiong Bahru Rd #01-01',
      collection_instructions: 'Use side gate, ring doorbell',
      status: 'active' as const,
      availability_paused: false,
      expo_push_token: 'ExponentPushToken[xxx]',
      sfa_reg_number: 'SFA-12345',
      pdpa_consent_at: '2026-06-10T10:00:00Z',
      pdpa_consent_version: 'v1.0',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-13T12:00:00Z',
    };
    const parsed = shcCookSchema.parse(valid);
    expect(parsed.area).toBe('Tiong Bahru');
    expect(parsed.status).toBe('active');
  });

  it('enforces status machine values', () => {
    expect(() => shcCookSchema.parse({ ...validBase(), status: 'invalid' as any })).toThrow();
  });

  it('validates CookStatus enum separately', () => {
    expect(CookStatus.parse('active')).toBe('active');
    expect(() => CookStatus.parse('foo')).toThrow();
  });

  it('accepts and requires exact fields (strict - no extras)', () => {
    const withConsent = shcCookSchema.parse({
      ...validBase(),
      pdpa_consent_at: '2026-06-13T09:00:00Z',
      pdpa_consent_version: 'v1.0',
    });
    expect(withConsent.pdpa_consent_at).toBeDefined();
    expect(withConsent.pdpa_consent_version).toBe('v1.0');
  });

  it('rejects extra keys due to .strict()', () => {
    expect(() => shcCookSchema.parse({ ...validBase(), foo: 'bar' } as any)).toThrow();
  });

  it('makes optional fields work (story, tokens, certs)', () => {
    const minimal = shcCookSchema.parse(validBase());
    expect(minimal.story).toBeDefined();
    expect(minimal.expo_push_token).toBeUndefined();
  });
});
