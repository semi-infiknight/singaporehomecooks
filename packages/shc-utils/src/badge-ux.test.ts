import { describe, expect, it } from 'vitest';
import {
  shcBadgeVariant,
  shcCollabRequestBadgeVariant,
  shcDropStatusBadgeVariant,
  shcMealPlanBadgeLabel,
  shcOrderStatusBadgeVariant,
  shcPartySizeBadgeLabel,
  shcPortionMinBadgeLabel,
  shcSubscriptionStatusBadgeVariant,
  shcUploadTypeBadgeLabel,
} from './badge-ux';

describe('shcBadgeVariant', () => {
  it('maps food/culture kinds to warm', () => {
    expect(shcBadgeVariant('cuisine')).toBe('warm');
    expect(shcBadgeVariant('occasion')).toBe('warm');
    expect(shcBadgeVariant('party_size')).toBe('warm');
    expect(shcBadgeVariant('cook_date')).toBe('warm');
    expect(shcBadgeVariant('portion_min')).toBe('warm');
    expect(shcBadgeVariant('meal_plan')).toBe('warm');
    expect(shcBadgeVariant('customizable')).toBe('warm');
    expect(shcBadgeVariant('photo_tips')).toBe('warm');
    expect(shcBadgeVariant('tier')).toBe('warm');
    expect(shcBadgeVariant('period')).toBe('warm');
  });

  it('maps operational kinds to default', () => {
    expect(shcBadgeVariant('price')).toBe('default');
    expect(shcBadgeVariant('slot')).toBe('default');
    expect(shcBadgeVariant('date')).toBe('default');
    expect(shcBadgeVariant('label')).toBe('default');
    expect(shcBadgeVariant('upload_type')).toBe('default');
    expect(shcBadgeVariant('tax')).toBe('default');
  });

  it('maps state kinds to semantic colors', () => {
    expect(shcBadgeVariant('halal')).toBe('success');
    expect(shcBadgeVariant('live')).toBe('success');
    expect(shcBadgeVariant('earnings')).toBe('success');
    expect(shcBadgeVariant('paused')).toBe('warning');
  });
});

describe('shcOrderStatusBadgeVariant', () => {
  it('maps fulfilment states', () => {
    expect(shcOrderStatusBadgeVariant('collected')).toBe('success');
    expect(shcOrderStatusBadgeVariant('paid')).toBe('warning');
    expect(shcOrderStatusBadgeVariant('canceled')).toBe('error');
    expect(shcOrderStatusBadgeVariant('pending')).toBe('default');
  });
});

describe('status helpers', () => {
  it('drop and subscription', () => {
    expect(shcDropStatusBadgeVariant(true)).toBe('success');
    expect(shcDropStatusBadgeVariant(false)).toBe('warning');
    expect(shcSubscriptionStatusBadgeVariant(true)).toBe('warning');
    expect(shcSubscriptionStatusBadgeVariant(false)).toBe('success');
    expect(shcCollabRequestBadgeVariant(true)).toBe('success');
    expect(shcCollabRequestBadgeVariant(false)).toBe('warning');
  });
});

describe('label helpers', () => {
  it('formats chip copy', () => {
    expect(shcMealPlanBadgeLabel(5)).toBe('5 meals/wk');
    expect(shcPartySizeBadgeLabel(12)).toBe('12 guests');
    expect(shcPortionMinBadgeLabel(2)).toBe('min 2');
    expect(shcUploadTypeBadgeLabel('sfa')).toBe('SFA upload');
  });
});
