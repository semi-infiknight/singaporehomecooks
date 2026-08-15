import { describe, expect, it } from 'vitest';
import {
  buildCookDashboardSetupItems,
  cookDashboardIncompleteSetup,
  cookDashboardKitchenSubtitle,
  cookDashboardOrdersNeedingCook,
} from './cook-dashboard';

describe('cook-dashboard helpers', () => {
  it('builds subtitle from kitchen + area', () => {
    expect(
      cookDashboardKitchenSubtitle({ display_name: 'Auntie Rose Kitchen', area: 'Katong', availability_paused: false })
    ).toContain('Katong');
  });

  it('lists incomplete setup items', () => {
    const items = buildCookDashboardSetupItems({
      profile: { display_name: 'Rose', collection_address: '123 Hougang Ave 1' },
      listingCount: 0,
      complianceVerified: false,
      paynowConfigured: true,
    });
    const open = cookDashboardIncompleteSetup(items);
    expect(open.map((i) => i.id).sort()).toEqual(['compliance', 'menu']);
  });

  it('flags paid orders as needing cook action', () => {
    expect(cookDashboardOrdersNeedingCook([{ shc_status: 'paid' }, { shc_status: 'preparing' }])).toHaveLength(1);
  });
});
