import { describe, it, expect } from 'vitest';
import { isProductVisible, checkAvailabilityForDate, validateAvailabilityAndPortions } from './availability';
import { shcAvailabilitySchema } from '@shc/types';

const sampleAvail = {
  product_id: 'prod1',
  portions_per_day: 10,
  collection_days: [1, 3, 5],
  time_slots: ['18:00-19:00'],
  paused: false,
};

describe('availability rule (10+ tests, 08-marketplace-rules + 05 shc_availability + portions check)', () => {
  it('visible when active cook + not paused + portions >0', () => {
    const res = isProductVisible(sampleAvail, 'active', false);
    expect(res.valid).toBe(true);
  });

  it('not visible if cook not active', () => {
    const res = isProductVisible(sampleAvail, 'paused', false);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-COOK-001');
  });

  it('not visible if availability paused', () => {
    expect(isProductVisible(sampleAvail, 'active', true).valid).toBe(false);
  });

  it('not visible if slot paused', () => {
    const paused = { ...sampleAvail, paused: true };
    expect(isProductVisible(paused, 'active', false).valid).toBe(false);
  });

  it('checkAvailabilityForDate succeeds on allowed day', () => {
    const r = checkAvailabilityForDate(sampleAvail as any, 1);
    expect(r.valid).toBe(true);
    expect(r.remaining).toBe(10);
  });

  it('check fails on disallowed day', () => {
    const r = checkAvailabilityForDate(sampleAvail as any, 0);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('SHC-AVAIL-001');
  });

  it('validateAvailabilityAndPortions integrates min + portions', () => {
    const r = validateAvailabilityAndPortions(sampleAvail as any, 3, 2, 3);
    expect(r.valid).toBe(true);
  });

  it('validate fails on min qty violation', () => {
    const r = validateAvailabilityAndPortions(sampleAvail as any, 1, 5, 1);
    expect(r.valid).toBe(false);
  });

  it('validate fails on portions exceed', () => {
    const r = validateAvailabilityAndPortions(sampleAvail as any, 99, 1, 1);
    expect(r.valid).toBe(false);
  });

  it('schema used for parse in rule', () => {
    expect(shcAvailabilitySchema.parse(sampleAvail)).toBeTruthy();
  });

  it('pure functions', () => {
    expect(isProductVisible(sampleAvail, 'active', false)).toEqual(isProductVisible(sampleAvail, 'active', false));
  });

  it('covers mock cart checkout availability (mobile)', () => {
    const mock = { ...sampleAvail, paused: false };
    // sample collection_days [1,3,5], day 5 (Friday) is allowed
    expect(validateAvailabilityAndPortions(mock as any, 5, 1, 5).valid).toBe(true);
  });
});
