import { describe, expect, it } from 'vitest';
import { getRequestDishCopy } from './request-dish';
import { getOrderTrayLabels } from './order-tray';

describe('request-dish copy', () => {
  it('returns localized wizard strings', () => {
    const copy = getRequestDishCopy('en');
    expect(copy.title).toBe('Request a custom dish');
    expect(copy.steps).toHaveLength(4);
    expect(copy.occasionLabels['Hari Raya']).toBeTruthy();
  });

  it('returns Mandarin request copy', () => {
    const copy = getRequestDishCopy('zh-Hans');
    expect(copy.title).toBe('请求定制菜品');
  });
});

describe('order tray labels', () => {
  it('returns localized tray button labels', () => {
    expect(getOrderTrayLabels('en').leaveReview).toBe('Leave a review');
    expect(getOrderTrayLabels('zh-Hans').reportIssue).toBe('报告问题');
  });
});
