import { describe, expect, it } from 'vitest';
import { getRequestDishCopy } from './request-dish';
import { getOrderTrayLabels } from './order-tray';
import { getCookAuthCopy, getCookListingsCopy, getCookOnboardingCopy } from './cook';

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

  it('returns localized tray form labels', () => {
    const labels = getOrderTrayLabels('en');
    expect(labels.reviewPlaceholder).toBe('Share your experience (optional)');
    expect(labels.disputeSubmit).toBe('Report issue');
    expect(getOrderTrayLabels('zh-Hans').reviewSubmit).toBe('提交评价');
  });
});

describe('cook copy', () => {
  it('returns localized cook auth and listings strings', () => {
    expect(getCookAuthCopy('en').title).toBe('SHC Cook Portal');
    expect(getCookListingsCopy('zh-Hans').wizardNew).toBe('新建菜品');
  });

  it('returns localized cook onboarding strings', () => {
    expect(getCookOnboardingCopy('en').cta).toBe('Go to dashboard');
    expect(getCookOnboardingCopy('en').body).toContain('compliance');
    expect(getCookOnboardingCopy('zh-Hans').title).toBe('欢迎，家厨');
  });
});
